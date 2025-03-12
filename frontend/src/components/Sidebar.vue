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

    <!-- ส่วนเนื้อหา wrapper -->
    <div class="sidebar-content">
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

          <!-- แสดงเฉพาะ admin และ superadmin -->
          <router-link 
            v-if="userData.role_id === 2 || userData.role_id === 3" 
            to="/user-management" 
            class="nav-item"
          >
            <i class="fas fa-users-cog"></i>
            <span v-if="!isCollapsed">จัดการผู้ใช้</span>
          </router-link>

          <!-- แสดงเฉพาะ superadmin -->
          <router-link 
            v-if="userData.role_id === 3" 
            to="/super-admin/activities" 
            class="nav-item"
          >
            <i class="fas fa-chart-line"></i>
            <span v-if="!isCollapsed">ภาพรวมกิจกรรม</span>
          </router-link>
        </div>
      </nav>

      <!-- User Profile -->
      <div class="user-profile">
        <div class="profile-info" v-if="!isCollapsed">
          <div class="user-details">
            <div class="username">{{ fullName }}</div>
            <div class="department">{{ department }}</div>
            <div class="user-role-info">
              <span class="emp-id">รหัสพนักงาน: {{ userData.empId || 'ไม่พบข้อมูล' }}</span>
              <span class="role-badge" :class="getRoleBadgeClass">{{ getRoleName }}</span>
            </div>
          </div>
        </div>
        
        <button @click="handleLogout" class="logout-btn" :title="isCollapsed ? 'ออกจากระบบ' : ''">
          <i class="fas fa-sign-out-alt"></i>
          <span v-if="!isCollapsed">ออกจากระบบ</span>
        </button>
      </div>
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
      isCollapsed: false,
      subMenus: {
        systemMenu: false,
        updateDataMenu: false,
        activityMenu: false,
      },
      userData: {
        fullName: "",
        department: "",
        empId: null,
        role_id: null
      },
      isAdmin: false
    };
  },
  computed: {
    fullName() {
      return this.userData.fullName || "ไม่พบชื่อผู้ใช้งาน";
    },
    department() {
      return this.userData.department || "ไม่พบแผนก";
    },
    userRole() {
      let roleName = 'ไม่พบข้อมูล';
      switch (this.userData.role_id) {
        case 1:
          roleName = 'ผู้ใช้งานทั่วไป';
          break;
        case 2:
          roleName = 'ผู้ดูแลระบบ';
          break;
        case 3:
          roleName = 'ผู้ดูแลระบบระดับสูง';
          break;
      }
      return `รหัสพนักงาน: ${this.userData.empId || 'ไม่พบข้อมูล'} | สิทธิ์: ${roleName}`;
    },
    isAdmin() {
      return this.userData.role_id === 2 || this.userData.role_id === 3;
    },
    getRoleName() {
      switch (this.userData.role_id) {
        case 1:
          return 'ผู้ใช้งานทั่วไป';
        case 2:
          return 'ผู้ดูแลระบบ';
        case 3:
          return 'ผู้ดูแลระบบระดับสูง';
        default:
          return 'ไม่พบข้อมูล';
      }
    },
    getRoleBadgeClass() {
      switch (this.userData.role_id) {
        case 1:
          return 'role-user';
        case 2:
          return 'role-admin';
        case 3:
          return 'role-superadmin';
        default:
          return 'role-unknown';
      }
    }
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
          // ดึงข้อมูล role_id จากฐานข้อมูลของเรา
          try {
            const roleResponse = await axios.get(`http://localhost:8088/api/user-role/${user.emp_id}`);
            console.log('Role Response:', roleResponse.data);
            
            this.userData = {
              empId: user.emp_id,
              role_id: roleResponse.data.role_id,
              fullName: `${user.title_s_desc || ''} ${user.first_name || ''} ${user.last_name || ''}`.trim(),
              department: user.dept_full || "ไม่ระบุแผนก",
            };

            // เก็บข้อมูลใน localStorage
            localStorage.setItem('userData', JSON.stringify({
              empId: user.emp_id,
              role_id: roleResponse.data.role_id,
              fullName: this.userData.fullName,
              department: user.dept_full,
              dept_change_code: user.dept_change_code,
              dept_full: user.dept_full
            }));

            // เก็บข้อมูลแผนกใน store
            this.$store.dispatch('updateUserDepartment', {
              dept_change_code: user.dept_change_code,
              dept_full: user.dept_full
            });

            // เก็บชื่อ-นามสกุลใน store
            this.$store.dispatch('updateFullName', this.userData.fullName);

            console.log('Updated userData:', this.userData);
            
            // กำหนด isAdmin ตามค่า role_id
            this.isAdmin = this.userData.role_id === 2 || this.userData.role_id === 3;
          } catch (roleError) {
            console.error('Error fetching role:', roleError);
            this.userData = {
              empId: user.emp_id,
              role_id: null,
              fullName: `${user.title_s_desc || ''} ${user.first_name || ''} ${user.last_name || ''}`.trim(),
              department: user.dept_full || "ไม่ระบุแผนก",
            };
          }

          // เก็บข้อมูลแผนกใน store
          this.$store.dispatch('updateUserDepartment', {
            dept_change_code: user.dept_change_code,
            dept_full: user.dept_full
          });

          // เก็บชื่อ-นามสกุลใน store
          this.$store.dispatch('updateFullName', this.userData.fullName);

          console.log('Updated userData:', this.userData);
          
          // กำหนด isAdmin ตามค่า role_id
          this.isAdmin = this.userData.role_id === 2 || this.userData.role_id === 3;
        }
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
      if (error.response) {
        console.error('Error response:', error.response.data);
      }
    }
  },
  methods: {
    toggleSidebar() {
      this.isCollapsed = !this.isCollapsed;
    },
    toggleSubMenu(menu) {
      Object.keys(this.subMenus).forEach((key) => {
        if (key !== menu) this.subMenus[key] = false;
      });
      this.subMenus[menu] = !this.subMenus[menu];
    },
    handleLogout() {
      if (confirm('ต้องการออกจากระบบใช่หรือไม่?')) {
        localStorage.removeItem('token');
        this.$router.push('/login');
      }
    }
  }
};
</script>

<style scoped>
.sidebar {
  width: 260px;
  height: 100vh;
  background: white;
  border-right: 1px solid #e2e8f0;
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
}

/* เพิ่ม wrapper สำหรับเนื้อหาทั้งหมด */
.sidebar-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* ปรับ sidebar-nav ให้ scroll ได้ */
.sidebar-nav {
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
}

/* ปรับ user-profile ให้อยู่ด้านล่างเสมอ */
.user-profile {
  padding: 1rem;
  border-top: 1px solid #e2e8f0;
  background: white;
  margin-top: auto;
}

.profile-info {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;
}

.user-details {
  flex: 1;
  min-width: 0;
}

.username {
  font-weight: 600;
  color: #1e293b;
  font-size: 0.9rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.department {
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

/* ปรับปรุง collapsed state */
.sidebar.collapsed {
  width: 70px;
}

.sidebar.collapsed .profile-info {
  display: none;
}

.sidebar.collapsed .logout-btn {
  justify-content: center;
  padding: 0.8rem;
}

.sidebar.collapsed .logout-btn span {
  display: none;
}

.sidebar.collapsed .nav-item {
  padding: 0.8rem;
  justify-content: center;
}

.sidebar.collapsed .nav-item span,
.sidebar.collapsed .section-title,
.sidebar.collapsed .toggle-icon {
  display: none;
}

.sidebar.collapsed .sub-menu {
  display: none !important;
}

.sidebar.collapsed .nav-item i {
  margin: 0;
  font-size: 1.3rem;
}

.sidebar.collapsed .logo-container {
  margin: 0 auto;
}


.sidebar.collapsed .admin-section {
  padding: 0.5rem;
  margin: 0;
  background: transparent;
}

.sidebar.collapsed .user-profile {
  padding: 0.5rem;
}

/* Add smooth transitions */
.sidebar,
.nav-item,
.logo-container,
.sidebar-header,
.user-profile,
.admin-section {
  transition: all 0.3s ease-in-out;
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
  margin-top: 1rem;
  padding: 1rem;
  background: #f8fafc;
  border-radius: 8px;
}

.section-title {
  font-size: 0.9rem;
  color: #94a3b8;
  margin-bottom: 0.8rem;
  padding-left: 0.5rem;
}

.admin-section .nav-item {
  margin-bottom: 0.5rem;
}

.admin-section .nav-item:last-child {
  margin-bottom: 0;
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
  color: #3b82f6;
}

.user-role-info {
  margin-top: 0.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}

.emp-id {
  font-size: 0.8rem;
  color: #64748b;
  font-weight: 500;
}

.role-badge {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 600;
  text-align: center;
  white-space: nowrap;
}

.role-user {
  background-color: #e2e8f0;
  color: #475569;
}

.role-admin {
  background-color: #bfdbfe;
  color: #1e40af;
}

.role-superadmin {
  background-color: #fde68a;
  color: #92400e;
}

.role-unknown {
  background-color: #e2e8f0;
  color: #64748b;
}
</style>