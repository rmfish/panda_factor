export const qiankunWindow = window;

export function renderWithQiankun(lifecycles) {
  if (!qiankunWindow.moudleQiankunAppLifeCycles) {
    qiankunWindow.moudleQiankunAppLifeCycles = {};
  }

  const name = qiankunWindow.qiankunName || 'vite-sub-app';
  qiankunWindow.moudleQiankunAppLifeCycles[name] = lifecycles;
}
