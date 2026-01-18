<template>
  <div class="app-shell">
    <header class="app-header">
      <h1>Panda Factor</h1>
      <p>Vue 3 scaffold reconstructed from the bundled output.</p>
    </header>
    <main class="app-main">
      <router-view />
    </main>
  </div>
</template>

<style scoped>
.app-shell {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: #f7f8fb;
  color: #1f2a44;
}

.app-header {
  padding: 24px 32px 12px;
  background: #ffffff;
  border-bottom: 1px solid #e4e8f0;
}

.app-header h1 {
  margin: 0;
  font-size: 24px;
}

.app-header p {
  margin: 8px 0 0;
  color: #52607a;
}

.app-main {
  flex: 1;
  padding: 24px 32px 48px;
}
</style>
