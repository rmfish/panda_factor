import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '../stores/auth';

import FactorList from '../views/FactorList.vue';
import FactorEditor from '../views/FactorEditor.vue';
import FactorDeep from '../views/FactorDeep.vue';
import FactorChat from '../views/FactorChat.vue';
import DataHubSource from '../views/DataHubSource.vue';
import DataHubDataClean from '../views/DataHubDataClean.vue';
import DataHubList from '../views/DataHubList.vue';
import DatahubFactorClean from '../views/DatahubFactorClean.vue';

const router = createRouter({
  history: createWebHistory('/factor'),
  routes: [
    { path: '/', name: 'factorList', component: FactorList },
    { path: '/factorList', name: 'factorList2', component: FactorList },
    { path: '/factorEditor', name: 'factorEditor', component: FactorEditor },
    { path: '/factorDeep', name: 'factorDeep', component: FactorDeep },
    { path: '/factorChat', name: 'factorChat', component: FactorChat },
    { path: '/dataHubSource', name: 'dataHubSource', component: DataHubSource },
    { path: '/dataHubDataClean', name: 'dataHubDataClean', component: DataHubDataClean },
    { path: '/dataHubList', name: 'dataHubList', component: DataHubList },
    { path: '/datahubFactorClean', name: 'datahubFactorClean', component: DatahubFactorClean }
  ]
});

router.beforeEach((to, from, next) => {
  const auth = useAuthStore();
  if (!auth.token && !auth.userId) {
    window.location.href = `/login?redirect=/factor${to.fullPath}`;
    return;
  }
  next();
});

export default router;
