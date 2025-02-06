<!-- Sidebar.vue -->
<template>
  <div class="sidebar" :class="{ 'collapsed': isCollapsed }">
    <div class="sidebar-header">
      <div class="logo-container">
        <i class="fas fa-bolt logo-icon"></i>
      </div>
      <span v-if="!isCollapsed" class="system-name">PEA</span>
      <button @click="toggleSidebar" class="toggle-btn">
        <i :class="isCollapsed ? 'fas fa-chevron-right' : 'fas fa-chevron-left'"></i>
      </button>
      </div>

    <!-- เมนูหลัก -->
    <nav class="sidebar-nav">
      <!-- หน้าแรก -->
      <router-link to="/" class="nav-item" exact-active-class="active">
              <i class="fas fa-home"></i>
        <span v-if="!isCollapsed">หน้าแรก</span>
            </router-link>

      <!-- ข้อมูลระบบ -->
      <div class="menu-group">
        <div class="nav-item expandable" 
              @click="toggleSubMenu('systemMenu')"
             :class="{ 'active': subMenus.systemMenu }">
              <i class="fas fa-cogs"></i>
          <span v-if="!isCollapsed">ข้อมูลระบบ</span>
          <i v-if="!isCollapsed" 
             class="fas fa-chevron-right toggle-icon"
             :class="{ 'rotated': subMenus.systemMenu }"></i>
            </div>
        <div class="sub-menu" v-show="!isCollapsed && subMenus.systemMenu">
          <router-link to="/datasystemrecord" class="nav-item sub">
                    <i class="fas fa-list-alt"></i>
            <span v-if="!isCollapsed">รายการระบบ</span>
                  </router-link>
        </div>
      </div>

      <!-- อัพเดตข้อมูล -->
      <div class="menu-group">
        <div class="nav-item expandable"
              @click="toggleSubMenu('updateDataMenu')"
             :class="{ 'active': subMenus.updateDataMenu }">
              <i class="fas fa-sync-alt"></i>
          <span v-if="!isCollapsed">อัพเดตข้อมูล</span>
          <i v-if="!isCollapsed"
             class="fas fa-chevron-right toggle-icon"
             :class="{ 'rotated': subMenus.updateDataMenu }"></i>
            </div>
        <div class="sub-menu" v-show="!isCollapsed && subMenus.updateDataMenu">
          <router-link to="/system_details" class="nav-item sub">
                    <i class="fas fa-upload"></i>
            <span v-if="!isCollapsed">อัพเดตข้อมูล</span>
                  </router-link>
          <router-link to="/DataDisplay" class="nav-item sub">
                    <i class="fas fa-database"></i>
            <span v-if="!isCollapsed">ข้อมูลที่อัพเดต</span>
                  </router-link>
        </div>
      </div>

      <!-- กิจกรรม -->
      <div class="menu-group">
        <div class="nav-item expandable"
              @click="toggleSubMenu('activityMenu')"
             :class="{ 'active': subMenus.activityMenu }">
              <i class="fas fa-calendar-check"></i>
          <span v-if="!isCollapsed">กิจกรรม</span>
          <i v-if="!isCollapsed"
             class="fas fa-chevron-right toggle-icon"
             :class="{ 'rotated': subMenus.activityMenu }"></i>
            </div>
        <div class="sub-menu" v-show="!isCollapsed && subMenus.activityMenu">
          <router-link to="/system-activities" class="nav-item sub">
                    <i class="fas fa-edit"></i>
            <span v-if="!isCollapsed">บันทึกกิจกรรม</span>
                  </router-link>
          <router-link to="/Dataactivities" class="nav-item sub">
                    <i class="fas fa-list"></i>
            <span v-if="!isCollapsed">ข้อมูลกิจกรรม</span>
                  </router-link>
        </div>
      </div>

      <!-- Admin Section -->
      <div v-if="isAdmin" class="admin-section">
        <div class="section-title" v-if="!isCollapsed">
          <span>ส่วนผู้ดูแลระบบ</span>
            </div>
        
        <router-link to="/super-admin" class="nav-item">
          <i class="fas fa-cog"></i>
          <span v-if="!isCollapsed">จัดการระบบ</span>
                  </router-link>

        <router-link to="/user-management" class="nav-item">
                    <i class="fas fa-users-cog"></i>
          <span v-if="!isCollapsed">จัดการผู้ใช้</span>
                  </router-link>

        <router-link to="/super-admin/activities" class="nav-item" exact-active-class="active">
          <i class="fas fa-chart-line"></i>
          <span v-if="!isCollapsed">ภาพรวมกิจกรรม</span>
                  </router-link>
      </div>
    </nav>

    <!-- User Profile -->
    <div class="user-profile">
      <div class="profile-info" v-if="!isCollapsed">
        <!-- <img :src="userAvatar" alt="User Avatar" class="avatar" /> -->
        <div class="user-details">
            <div class="user-name">{{ fullName }}</div>
            <div class="user-role">{{ department }}</div>
          </div>
      </div>
        <router-link to="/login" class="nav-item">
      <button @click="logout" class="logout-btn" :title="isCollapsed ? 'ออกจากระบบ' : ''">
        <i class="fas fa-sign-out-alt"></i>
        <span v-if="!isCollapsed">ออกจากระบบ</span>
      </button></router-link>
    </div>
  </div>
</template>

<script>
import axios from "axios";

export default {
  name: "AppSidebar",
  data() {
    return {
      logoSrc: require("@/assets/logo.png"),
      sidebarOpen: false,
      subMenus: {
        systemMenu: false,
        updateDataMenu: false,
        activityMenu: false,
      },
      userData: {
        fullName: "",
        department: "",
        empId: null,
      },
    };
  },
  async created() {
    try {
      console.log('Fetching user data...');
      const response = await axios.get("http://localhost:3007/api/data", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      console.log('API Response:', response.data);

      if (response.data?.data?.dataDetail?.length > 0) {
        const user = response.data.data.dataDetail[0];
        console.log('User data:', user);

        if (user.emp_id) {
          this.userData = {
            fullName: `${user.title_s_desc || ''}${user.first_name} ${user.last_name}`.trim(),
            department: user.dept_full || "ไม่ระบุแผนก",
            empId: user.emp_id,
          };
          console.log('Updated userData:', this.userData);
        }
      } else {
        console.warn("ไม่พบข้อมูลผู้ใช้งานหรือข้อมูลว่าง");
      }
    } catch (error) {
      console.error('Error fetching user data:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      
      if (error.response?.status === 401) {
        console.error("Token หมดอายุ กรุณาเข้าสู่ระบบใหม่");
        this.$router.push("/login");
      }
    }
  },
  computed: {
    fullName() {
      return this.userData.empId ? this.userData.fullName : "ไม่พบชื่อผู้ใช้งาน";
    },
    department() {
      return this.userData.empId ? this.userData.department : "ไม่พบแผนก";
    },
  },
  methods: {
    toggleSidebar() {
      this.sidebarOpen = !this.sidebarOpen;
    },
    toggleSubMenu(menu) {
      Object.keys(this.subMenus).forEach((key) => {
        if (key !== menu) this.subMenus[key] = false;
      });
      this.subMenus[menu] = !this.subMenus[menu];
    },
    handleLogout() {
      if (confirm("ต้องการออกจากระบบใช่หรือไม่?")) {
        localStorage.removeItem("token");
        this.$router.push("/login").catch((err) =>
          console.error("Error navigating to login:", err)
        );
      }
    },
  },
};
</script>

<style scoped>
.sidebar {
  width: 260px;
  height: 100vh;
  background: #ffffff;
  color: #475569;
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
  position: fixed;
  left: 0;
  top: 0;
  z-index: 1000;
  border-right: 1px solid #e2e8f0;
}

/* Logo Section */
.sidebar-header {
  padding: 1.5rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  border-bottom: 1px solid #f1f5f9;
}

.logo-container {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
  box-shadow: 0 4px 12px rgba(251, 191, 36, 0.3);
  transition: all 0.3s ease;
}

.logo-icon {
  font-size: 1.5rem;
  color: white;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1));
}

.system-name {
  font-size: 1.2rem;
  font-weight: 600;
  color: #334155;
}

/* Navigation Items */
.sidebar-nav {
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 0.8rem;
  padding: 0.8rem 1rem;
  color: #64748b;
  text-decoration: none;
  border-radius: 8px;
  margin-bottom: 0.3rem;
  transition: all 0.2s ease;
}

.nav-item i {
  font-size: 1.2rem;
  width: 24px;
  text-align: center;
  color: #94a3b8;
}

.nav-item:hover {
  background: #f8fafc;
  color: #334155;
}

.nav-item:hover i {
  color: #3b82f6;
}

.nav-item.active {
  background: #f1f5f9;
  color: #1e293b;
}

.nav-item.active i {
  color: #2563eb;
}

/* Sub Menu */
.sub-menu {
  margin-left: 1rem;
  padding: 0.5rem;
  background: #f8fafc;
  border-radius: 8px;
  margin-bottom: 0.5rem;
}

.nav-item.sub {
  padding: 0.6rem 0.8rem;
  font-size: 0.95rem;
}

/* Admin Section */
.admin-section {
  padding: 1rem;
  background: #f8fafc;
  margin-top: auto;
}

.section-title {
  font-size: 0.9rem;
  color: #94a3b8;
  margin-bottom: 0.8rem;
}

/* User Profile */
.user-profile {
  padding: 1rem;
  border-top: 1px solid #e2e8f0;
  margin-top: auto;
}

.profile-info {
  display: flex;
  align-items: center;
  gap: 0.8rem;
  margin-bottom: 0.8rem;
}

.avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
}

.user-details {
  flex: 1;
  min-width: 0; /* สำคัญสำหรับ text-overflow */
}

.username {
  display: block;
  font-weight: 600;
  color: #1e293b;
  font-size: 0.9rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 150px; /* จำกัดความกว้างสูงสุด */
}

.role {
  display: block;
  color: #64748b;
  font-size: 0.8rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.logout-btn {
  width: 100%;
  padding: 0.8rem;
  border: none;
  background: none;
  color: #64748b;
  display: flex;
  align-items: center;
  gap: 0.8rem;
  cursor: pointer;
  transition: all 0.2s;
  border-radius: 6px;
}

.logout-btn:hover {
  background: #f1f5f9;
  color: #1e293b;
}

/* Scrollbar */
.sidebar-nav::-webkit-scrollbar {
  width: 4px;
}

.sidebar-nav::-webkit-scrollbar-track {
  background: transparent;
}

.sidebar-nav::-webkit-scrollbar-thumb {
  background: #e2e8f0;
  border-radius: 2px;
}

.sidebar-nav::-webkit-scrollbar-thumb:hover {
  background: #cbd5e1;
}

/* Toggle Button */
.toggle-btn {
  background: none;
  border: none;
  color: #94a3b8;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 6px;
  transition: all 0.2s ease;
}

.toggle-btn:hover {
  background: #f1f5f9;
  color: #64748b;
}

/* Collapsed State */
.sidebar.collapsed {
  width: 70px;
}

.sidebar.collapsed .system-name,
.sidebar.collapsed .nav-item span,
.sidebar.collapsed .section-title,
.sidebar.collapsed .profile-info {
  display: none;
}

.sidebar.collapsed .nav-item {
  justify-content: center;
  padding: 0.8rem;
}

.sidebar.collapsed .nav-item i {
  margin: 0;
}

.sidebar.collapsed .sub-menu {
  margin-left: 0;
}

/* Animation for profile section */
@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.profile-info {
  animation: slideUp 0.3s ease-out;
}
</style>