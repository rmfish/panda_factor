import time
import traceback
from abc import ABC
from concurrent.futures import ThreadPoolExecutor

import tushare as ts
from pymongo import UpdateOne
from tqdm import tqdm

from panda_common.handlers.database_handler import DatabaseHandler
from panda_common.logger_config import logger
from panda_common.utils.stock_utils import get_exchange_suffix
from panda_data_hub.utils.mongo_utils import ensure_collection_and_indexes
from panda_data_hub.utils.ts_utils import calculate_upper_limit, get_trading_dates, get_previous_month_dates, \
    calculate_lower_limit, ts_query, get_namechange

"""
       使用须知：因tushare对于接口返回数据条数具有严格限制，故无法一次拉取全量数据。此限制会导致接口运行效率偏低，请耐心等待。

       参数:
       date: 日期字符串，格式为 "YYYY-MM-DD"

       返回:
       bool: 如果是交易日返回 True，否则返回 False
       """


class StockMarketCleanTSServicePRO(ABC):
    def __init__(self, config):
        self.config = config
        self.db_handler = DatabaseHandler(config)
        self.progress_callback = None
        try:
            ts.set_token(config['TS_TOKEN'])
            self.pro = ts.pro_api()
        except Exception as e:
            error_msg = f"Failed to initialize tushare: {str(e)}\nStack trace:\n{traceback.format_exc()}"
            logger.error(error_msg)
            raise

    def set_progress_callback(self, callback):
        self.progress_callback = callback

    def stock_market_history_clean(self, start_date, end_date):

        logger.info("Starting market data cleaning for tushare")

        # 获取交易日
        # date_range = pd.date_range(start=start_date, end=end_date, freq='D')
        trading_days = get_trading_dates(start_date,end_date)
        # for date in date_range:
        #     date_str = datetime.strftime(date, "%Y-%m-%d")
        #     if ts_is_trading_day(date_str):
        #         trading_days.append(date_str)
        #     else:
        #         logger.info(f"跳过非交易日: {date_str}")
        logger.info(f"从{start_date}到{end_date} 找到 {len(trading_days)} 个交易日需要处理")
        total_days = len(trading_days)
        processed_days = 0
        # 根据交易日去循环
        with tqdm(total=len(trading_days), desc="Processing Trading Days") as pbar:
            # 分批处理，每批8天
            batch_size = 8
            for i in range(0, len(trading_days), batch_size):
                batch_days = trading_days[i:i + batch_size]
                with ThreadPoolExecutor(max_workers=10) as executor:
                    futures = []
                    for date in batch_days:
                        futures.append(executor.submit(
                            self.clean_meta_market_data,
                            date_str=date
                        ))

                    # 等待当前批次的所有任务完成
                    for future in futures:
                        try:
                            future.result()
                            processed_days += 1
                            progress = int((processed_days / total_days) * 100)

                            # 更新进度
                            if self.progress_callback:
                                self.progress_callback(progress)
                            pbar.update(1)
                        except Exception as e:
                            logger.error(f"Task failed: {e}")
                            pbar.update(1)  # 即使任务失败也更新进度条

                # 批次之间添加短暂延迟，避免连接数超限
                if i + batch_size < len(trading_days):
                    logger.info(
                        f"完成批次 {i // batch_size + 1}/{(len(trading_days) - 1) // batch_size + 1}，等待1秒后继续...")
                    time.sleep(1)
        logger.info("所有交易日数据处理完成")

    def clean_meta_market_data(self,date_str):
        try:
            total_start = time.time()
            date = date_str.replace("-", "")
            fetch_start = time.time()
            price_data = self.pro.query('daily', trade_date=date)
            price_data.reset_index(drop=False, inplace=True)
            fetch_elapsed = time.time() - fetch_start
            logger.info(f"Fetched daily data for date {date} in {fetch_elapsed:.2f}s")
            price_data['index_component'] = None
            # tushare关于中证500和中证1000这两个指数只有每月的最后一个交易日才有数据，对于沪深300成分股是每月的第一个交易日和最后一个交易日才有数据
            # tushare关于中证500和中证1000这两个指数只有每月的最后一个交易日才有数据，对于沪深300成分股是每月的第一个交易日和最后一个交易日才有数据
            mid_date,last_date = get_previous_month_dates(date_str = date)
            hs_300 = ts_query('index_weight', index_code='399300.SZ', start_date=mid_date, end_date=last_date)
            zz_500 = ts_query('index_weight', index_code='000905.SH', start_date=mid_date, end_date=last_date)
            zz_1000 = ts_query('index_weight', index_code='000852.SH', start_date=mid_date, end_date=last_date)
            for idx, row in price_data.iterrows():
                try:
                    component = self.clean_index_components(data_symbol=row['ts_code'], date=date,hs_300 =hs_300,zz_500 = zz_500,zz_1000 = zz_1000)
                    price_data.at[idx, 'index_component'] = component
                    # logger.info(f"Success to clean index for {row['ts_code']} on {date}")
                except Exception as e:
                    logger.error(f"Failed to clean index for {row['ts_code']} on {date}: {str(e)}")
                    continue

            namechange_info = get_namechange()
            stock_info = ts_query('stock_basic',list_status="L,D,P")
            self.clean_stock_name(price_data, date, namechange_info, stock_info)
            price_data = price_data.drop(columns=['index','change','pct_chg','amount'])
            price_data = price_data.rename(columns={'vol': 'volume'})
            price_data = price_data.rename(columns={'trade_date': 'date'})
            price_data['ts_code'] = price_data['ts_code'].apply(get_exchange_suffix)
            price_data = price_data.rename(columns={'ts_code': 'symbol'})

            # 计算涨跌停价格时对于已经退市的股票，因无法获取当日股票名称，故无法计算涨跌停价格
            price_data['limit_up'] = None
            price_data['limit_down'] = None
            price_data['limit_up'] = price_data.apply(
                lambda row: calculate_upper_limit(stock_code = row['symbol'], prev_close = row['pre_close'], stock_name = row['name']),
                axis=1
            )
            price_data['limit_down'] = price_data.apply(
                lambda row: calculate_lower_limit(stock_code = row['symbol'], prev_close = row['pre_close'], stock_name = row['name']),
                axis=1
            )
            price_data['volume'] = price_data['volume']*100
            # 过滤掉北交所的股票
            price_data = price_data[~price_data['symbol'].str.contains('BJ')]
            #重新排列
            desired_order = ['date', 'symbol', 'open', 'high', 'low', 'close', 'volume', 'pre_close',
                             'limit_up', 'limit_down', 'index_component', 'name']
            price_data = price_data[desired_order]
            # 检索数据库索引
            ensure_collection_and_indexes(table_name='stock_market')
            # 执行插入操作
            upsert_operations = []
            for record in price_data.to_dict('records'):
                upsert_operations.append(UpdateOne(
                    {'date': record['date'], 'symbol': record['symbol']},
                    {'$set': record},
                    upsert=True
                ))
            if upsert_operations:
                self.db_handler.mongo_client[self.config["MONGO_DB"]]['stock_market'].bulk_write(
                    upsert_operations)
                total_elapsed = time.time() - total_start
                logger.info(
                    f"Saved {len(upsert_operations)} market records for date {date} in {total_elapsed:.2f}s"
                )

        except Exception as e:
            logger.error({e})

    def clean_index_components(self, date,data_symbol, hs_300,zz_500 ,zz_1000):
        try:
            # 首先查询沪深300
            if data_symbol in hs_300['con_code'].values:
                return '100'

            # 如果不在沪深300中，查询中证500
            if data_symbol in zz_500['con_code'].values:
                return '010'

            # 如果不在中证500中，查询中证1000
            if data_symbol in zz_1000['con_code'].values:
                return '001'

            # 如果都不在其中
            return '000'

        except Exception as e:
            logger.error(f"Error checking if {data_symbol} is in index components on {date}: {str(e)}")
            return None

    def clean_stock_name(self, price_data, date, namechange_info, stock_info):
        price_data['name'] = None
        codes = price_data['ts_code'].unique()
        namechange_filtered = namechange_info[
            (namechange_info['ts_code'].isin(codes)) &
            (namechange_info['start_date'] <= date)
        ]
        if not namechange_filtered.empty:
            latest_changes = (
                namechange_filtered
                .sort_values(['ts_code', 'start_date'])
                .groupby('ts_code')
                .tail(1)
                .set_index('ts_code')['name']
            )
        else:
            latest_changes = pd.Series(dtype=object)

        stock_filtered = stock_info[stock_info['ts_code'].isin(codes)]
        current_names = stock_filtered.set_index('ts_code')['name']

        name_series = price_data['ts_code'].map(latest_changes)
        fallback_series = price_data['ts_code'].map(current_names)
        name_series = name_series.combine_first(fallback_series)
        price_data['name'] = name_series.where(name_series.notna(), None)
