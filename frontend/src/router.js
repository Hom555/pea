import { createRouter, createWebHistory } from "vue-router";
import HomePage from "./components/HomePage.vue";
import SystemRecord from "./components/SystemRecord.vue"; // นำเข้าไฟล์ SystemRecord.vue
import datasystemrecord from "./components/datasystemrecord.vue";
import system_details from "./components/system_details.vue";
import systemActivities from "./components/system-activities.vue";
import Dataactivities from "./components/Dataactivities.vue";
import DataDisplay from "./components/DataDisplay.vue";
import SuperAdmin from "@/components/SuperAdmin.vue";
import Footer from "./components/Footer.vue";
import Narbar from "./components/Narbar.vue";
import UserManagement from '@/components/UserManagement.vue'
import SuperAdminActivities from '@/components/SuperAdminActivities.vue'

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

export default router;
