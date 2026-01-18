import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import { renderWithQiankun, qiankunWindow } from './plugins/qiankun';
import '@semi-ui-theme';
import './styles/main.css';

let root = null;

function render(container) {
  const mountNode = container
    ? container.querySelector('#root')
    : document.querySelector('#root');

  if (!mountNode) {
    return;
  }

  root = ReactDOM.createRoot(mountNode);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}

function mount(props = {}) {
  render(props.container);
}

renderWithQiankun({
  mount,
  bootstrap() {
    console.info('[vite] react app bootstrapped');
  },
  unmount() {
    if (root) {
      root.unmount();
      root = null;
    }
  },
  update() {
    console.info('[vite] react app updated');
  }
});

if (!qiankunWindow.__POWERED_BY_QIANKUN__) {
  mount();
}
