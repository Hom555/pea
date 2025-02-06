<template>
  <div id="app">
    <AppSidebar />
    <div class="content">
      <router-view />
    </div>
  </div>

</template>

<script>
import AppSidebar from "./components/Sidebar.vue";
import Footer from "./components/Footer.vue";


export default {
  name: "App",
  components: {
    AppSidebar, Footer,
  },
};
</script> 
<style scoped>
#app {
  display: flex;
}

.content {
  margin-left: 220px;
  padding: 20px;
  flex-grow: 1;
}
</style>

<style>
@import 'vue-toastification/dist/index.css';
</style>
