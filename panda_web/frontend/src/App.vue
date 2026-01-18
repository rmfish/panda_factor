<template>
  <div class="app-shell">
    <main class="app-main">
      <div class="app-inner">
        <router-view />
      </div>
    </main>
  </div>
</template>

<style scoped>
.app-shell {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: #11131a;
  color: #e5e9f2;
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
  padding: 32px 40px 48px;
  display: flex;
  justify-content: center;
  align-items: flex-start;
}

.app-inner {
  width: 100%;
  max-width: 1600px;
}
</style>
