import { createRouter, createWebHistory } from "vue-router";
import HomePage from "./components/HomePage.vue";
import SystemRecord from "./components/SystemRecord.vue"; // นำเข้าไฟล์ SystemRecord.vue
import datasystemrecord from "./components/datasystemrecord.vue";
import system_details from "./components/system_details.vue";
import systemActivities from "./components/system-activities.vue";
import Dataactivities from "./components/Dataactivities.vue";
import DataDisplay from "./components/DataDisplay.vue";
import SuperAdmin from "./components/SuperAdmin.vue";
import Footer from "./components/Footer.vue";
import Narbar from "./components/Narbar.vue";
import UserManagement from './components/UserManagement.vue'
import SuperAdminActivities from './components/SuperAdminActivities.vue'
import axios from 'axios';

const routes = [
  {
    path: "/",
    name: "home",
    component: HomePage,
  },
  {
    path: "/system-records", 
    name: "system-records",
    component: SystemRecord, 
  },
  {
    path: "/datasystemrecord",
    name: "/datasystemrecord",
    component: datasystemrecord,
  },
  {
    path: "/system_details",
    name: "/system_details",
    component: system_details,
  },
  {
    path: "/system-activities",
    name: "/system-activities",
    component: systemActivities,
  },
  {
    path: "/dataactivities",
    name: "/dataactivities",
    component: Dataactivities,
  },
  {
    path: "/dataDisplay",
    name: "/dataDisplay",
    component: DataDisplay,
  },
  {
    path: "/super-admin",
    name: "SuperAdmin",
    component: SuperAdmin,
  },
  {
    path: "/footer",
    name: "/footer",
    component: Footer,
  },
  {
    path: "/narbar",
    name: "/narbar",
    component: Narbar,
  },
  {
    path: '/user-management',
    name: 'UserManagement',
    component: UserManagement
  },
  {
    path: '/super-admin/activities',
    name: 'SuperAdminActivities',
    component: SuperAdminActivities,
    meta: { requiresAuth: true, role: 'superadmin' }
  },
];

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes,
});

// Navigation guard
router.beforeEach(async (to, from, next) => {
  // Check if route requires authentication and role
  if (to.meta.requiresAuth) {
    try {
      // Get user role from API
      const response = await axios.get('http://localhost:8088/api/check-permission');
      const userRole = response.data.data.role_id;

      // Check if user is superadmin (role_id === 3)
      if (to.meta.role === 'superadmin' && userRole !== 3) {
        // If not superadmin, redirect to home
        next({ path: '/' });
        return;
      }
    } catch (error) {
      console.error('Error checking permissions:', error);
      next({ path: '/' });
      return;
    }
  }
  next();
});

export default router;
