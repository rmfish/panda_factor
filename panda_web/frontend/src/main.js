import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import router from './router';
import { renderWithQiankun, qiankunWindow } from './plugins/qiankun';
import './styles/main.css';

let app = null;

function mount(props = {}) {
  app = createApp(App);
  app.use(createPinia());
  app.use(router);

  const container = props.container
    ? props.container.querySelector('#app')
    : '#app';

  app.mount(container);
}

renderWithQiankun({
  mount,
  bootstrap() {
    console.info('[vite] vue app bootstrapped');
  },
  unmount() {
    if (app) {
      app.unmount();
      app = null;
    }
  },
  update() {
    console.info('[vite] vue app updated');
  }
});

if (!qiankunWindow.__POWERED_BY_QIANKUN__) {
  mount();
}
