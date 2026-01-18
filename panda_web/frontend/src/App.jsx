import { Layout, Nav, Space, Typography } from '@douyinfe/semi-ui';
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
  useNavigate
} from 'react-router-dom';
import FactorList from './pages/FactorList.jsx';
import FactorDetail from './pages/FactorDetail.jsx';
import FactorWorkspace from './pages/FactorWorkspace.jsx';
import './App.css';

const { Header, Content, Footer } = Layout;
const { Title, Text } = Typography;

const navItems = [
  { itemKey: 'list', text: '因子列表' },
  { itemKey: 'workspace', text: '因子工作台' }
];

const navRoutes = {
  list: '/',
  workspace: '/workspace/alpha-001'
};

function AppShell() {
  const location = useLocation();
  const navigate = useNavigate();
  const selectedKey = location.pathname.startsWith('/workspace')
    ? 'workspace'
    : 'list';

  return (
    <Layout className="app-shell">
      <Header className="app-header">
        <Space align="center" spacing="medium">
          <Title heading={3} className="app-title">
            Panda Factor
          </Title>
          <Text type="tertiary">Semi Design · React</Text>
        </Space>
        <Nav
          mode="horizontal"
          items={navItems}
          selectedKeys={[selectedKey]}
          onSelect={({ itemKey }) => navigate(navRoutes[itemKey])}
          className="app-nav"
        />
      </Header>
      <Content className="app-content">
        <Routes>
          <Route path="/" element={<FactorList />} />
          <Route path="/detail/:factorId" element={<FactorDetail />} />
          <Route path="/workspace/:factorId" element={<FactorWorkspace />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Content>
      <Footer className="app-footer">
        <Text type="tertiary">PandaAI · Semi Design · React</Text>
      </Footer>
    </Layout>
  );
}

export default function App() {
  return (
    <BrowserRouter basename="/factor">
      <AppShell />
    </BrowserRouter>
  );
}
