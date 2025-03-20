<template>
  <div class="container">
    <div class="admin-card">
      <!-- ส่วนหัว -->
      <div class="header">
        <div class="header-title">
          <i class="fas fa-users-cog"></i>
          <h1>จัดการสิทธิ์ผู้ใช้งาน</h1>
        </div>
        
        <button v-if="currentUserRole === 3" class="btn-add" @click="showAddUserModal = true">
          <i class="fas fa-user-plus"></i>
          เพิ่มผู้ใช้งาน
        </button>
       
      </div>

      <!-- ส่วนค้นหาและกรอง -->
      <div class="filter-section">
        <div class="search-box">
          <i class="fas fa-search"></i>
          <input 
            type="text" 
            v-model="searchTerm" 
            placeholder="ค้นหา"
          >
        </div>
        <div class="filter-group">
          <div class="select-wrapper">
            <i class="fas fa-building"></i>
            <select v-model="departmentFilter">
              <option value="">ทุกแผนก</option>
              <option v-for="dept in departments" :key="dept.code" :value="dept.name">
                {{ dept.name }}
              </option>
            </select>
          </div>
          <div class="select-wrapper">
            <i class="fas fa-user-shield"></i>
            <select v-model="roleFilter">
              <option value="">ทุกระดับ</option>
              <option value="user">User</option>
              <option value="admin">Admin</option>
              <option value="superadmin">Super Admin</option>
            </select>
          </div>
        </div>
      </div>

      <!-- สรุปข้อมูล -->
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon">
            <i class="fas fa-users"></i>
          </div>
          <div class="stat-info">
            <h3>ผู้ใช้งานทั้งหมด</h3>
            <p>{{ users.length }}</p>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">
            <i class="fas fa-user-shield"></i>
          </div>
          <div class="stat-info">
            <h3>Admin</h3>
            <p>{{ adminCount }}</p>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">
            <i class="fas fa-user-cog"></i>
          </div>
          <div class="stat-info">
            <h3>Super Admin</h3>
            <p>{{ superAdminCount }}</p>
          </div>
        </div>
      </div>

      <!-- ตารางแสดงผู้ใช้งาน -->
      <div class="table-container">
        <table>
          <thead>
            <tr>
              <th>รหัสพนักงาน</th>
              <th>ชื่อ-นามสกุล</th>
              <th>แผนก</th>
              <th>ระดับผู้ใช้</th>
              <th class="text-center">การจัดการ</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="user in filteredUsers" :key="user.emp_id">
              <td>{{ user.emp_id }}</td>
              <td>{{ user.first_name }} {{ user.last_name }}</td>
              <td>
                <span class="department-badge">{{ user.dept_full }}</span>
              </td>
              <td>
                <span :class="['role-badge', getRoleClass(user.role_id)]">
                  {{ getRoleDisplay(user.role_id) }}
                </span>
              </td>
              <td class="text-center">
                <div class="action-buttons">
                  <button class="btn-manage" @click="manageRole(user)">
                    <i class="fas fa-user-shield"></i>
                    จัดการสิทธิ์
                  </button>
                  
                  <button v-if="currentUserRole === 3" class="btn-delete" @click="confirmDelete(user)">
                    <i class="fas fa-trash"></i>
                    ลบ
                  </button>

                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Modal เพิ่ม/แก้ไขผู้ใช้งาน -->
    <div v-if="showAddUserModal" class="modal-overlay" @click.self="closeModal">
      <div class="modal-content">
        <div class="modal-header">
          <h2>
            <i class="fas fa-user-plus"></i>
            {{ editingUser ? 'แก้ไขผู้ใช้งาน' : 'เพิ่มผู้ใช้งาน' }}
          </h2>
          <button @click="closeModal" class="btn-close">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="modal-body">
          <form @submit.prevent="saveUser" class="user-form">
            <div class="form-grid">
              <div class="form-group">
                <label>
                  <i class="fas fa-user"></i>
                  ชื่อ
                </label>
                <input 
                  type="text" 
                  v-model="userForm.firstName" 
                  required
                  placeholder="กรอกชื่อ"
                >
              </div>
              <div class="form-group">
                <label>
                  <i class="fas fa-user"></i>
                  นามสกุล
                </label>
                <input 
                  type="text" 
                  v-model="userForm.lastName" 
                  required
                  placeholder="กรอกนามสกุล"
                >
              </div>
              <div class="form-group">
                <label>
                  <i class="fas fa-id-card"></i>
                  รหัสพนักงาน
                </label>
                <input 
                  type="number" 
                  v-model="userForm.employeeId" 
                  required
                  placeholder="กรอกรหัสพนักงาน"
                >
              </div>
              <div class="form-group">
                <label>
                  <i class="fas fa-building"></i>
                  แผนก
                </label>
                <select v-model="userForm.department" required>
                  <option value="" disabled selected>กรุณาเลือกแผนก</option>
                  <option v-for="dept in departments" :key="dept.code" :value="dept">
                    {{ dept.name }}
                  </option>
                </select>
              </div>
              <div class="form-group">
                <label>
                  <i class="fas fa-user-shield"></i>
                  ระดับผู้ใช้
                </label>
                <select v-model="userForm.role" required>
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                  <!-- <option value="superadmin">Super Admin</option> -->
                </select>
              </div>
            </div>
            <div class="form-actions">
              <button type="button" class="btn-cancel" @click="closeModal">
                <i class="fas fa-times"></i>
                ยกเลิก
              </button>
              <button type="submit" class="btn-save">
                <i class="fas fa-save"></i>
                เพิ่มผู้ใช้งาน
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- Modal ยืนยันการเปลี่ยนระดับผู้ใช้ -->
    <div v-if="showConfirmModal" class="modal-overlay" @click.self="closeConfirmModal">
      <div class="modal-content">
        <div class="modal-header">
          <h2>
            <i class="fas fa-user-shield"></i>
            ยืนยันการเปลี่ยนระดับผู้ใช้
          </h2>
          <button @click="closeConfirmModal" class="btn-close">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="modal-body">
          <p>คุณต้องการเปลี่ยนระดับผู้ใช้ของ</p>
          <p class="user-name">{{ selectedUser?.first_name }} {{ selectedUser?.last_name }}</p>
          <p>จาก <span class="old-role">{{ getRoleDisplay(selectedUser?.role_id) }}</span></p>
          <p>เป็น <span class="new-role">{{ getRoleDisplay(role_id) }}</span></p>
          
          <div class="form-actions">
            <button class="btn-cancel" @click="closeConfirmModal">
              <i class="fas fa-times"></i>
              ยกเลิก
            </button>
            <button class="btn-confirm" @click="saveRoleChange">
              <i class="fas fa-check"></i>
              ยืนยัน
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal จัดการสิทธิ์ -->
    <div v-if="showRoleModal" class="modal-overlay" @click.self="closeRoleModal">
      <div class="modal-content">
        <div class="modal-header">
          <h2>
            <i class="fas fa-user-shield"></i>
            จัดการสิทธิ์ผู้ใช้งาน
          </h2>
          <button @click="closeRoleModal" class="btn-close">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="modal-body">
          <div class="user-info">
            <div class="user-avatar">{{ getUserInitials(selectedUser?.first_name + ' ' + selectedUser?.last_name) }}</div>
            <div class="user-details">
              <h3>{{ selectedUser?.first_name }} {{ selectedUser?.last_name }}</h3>
              <p class="user-id">รหัสพนักงาน: {{ selectedUser?.emp_id }}</p>
              <p class="user-dept">{{ selectedUser?.dept_full }}</p>
            </div>
          </div>

          <div class="role-selection">
            <label>เลือกระดับผู้ใช้:</label>
            <div class="role-options">
              <button 
                v-for="role in roles" 
                :key="role.value"
                class="role-option"
                :class="{ active: selectedRole === role.value }"
                @click="selectedRole = role.value"
              >
                <i :class="role.icon"></i>
                {{ role.label }}
              </button>
            </div>
          </div>

          <div class="form-actions">
            <button class="btn-cancel" @click="closeRoleModal">
              <i class="fas fa-times"></i>
              ยกเลิก
            </button>
            <button 
              class="btn-save" 
              @click="saveRole"
              :disabled="!selectedRole || selectedRole === selectedUser?.role"
            >
              <i class="fas fa-save"></i>
              บันทึก
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal ยืนยันการลบ -->
    <div v-if="showDeleteModal" class="modal-overlay" @click.self="closeDeleteModal">
      <div class="modal-content">
        <div class="modal-header">
          <h2>
            <i class="fas fa-exclamation-triangle"></i>
            ยืนยันการลบผู้ใช้งาน
          </h2>
          <button @click="closeDeleteModal" class="btn-close">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="modal-body">
          <p>คุณต้องการลบผู้ใช้งาน</p>
          <p class="user-name">{{ selectedUser?.first_name }} {{ selectedUser?.last_name }}</p>
          <p>ใช่หรือไม่?</p>
          
          <div class="form-actions">
            <button class="btn-cancel" @click="closeDeleteModal">
              <i class="fas fa-times"></i>
              ยกเลิก
            </button>
            <button  class="btn-delete" @click="deleteUser">
              <i class="fas fa-trash"></i>
              ลบ
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios';
import { useToast } from 'vue-toastification';

export default {
  name: 'UserManagement',

  setup() {
    const toast = useToast();
    return { toast };
  },

  data() {
    return {
      users: [],
      searchTerm: '',
      departmentFilter: '',
      roleFilter: '',
      showAddUserModal: false,
      currentUserRole: null,
      userForm: {
        firstName: '',
        lastName: '',
        employeeId: '',
        department: '',
        role: 'user'
      },
      showConfirmModal: false,
      selectedUser: null,
      showRoleModal: false,
      selectedRole: null,
      roles: [
        { value: 'user', label: 'User', icon: 'fas fa-user' },
        { value: 'admin', label: 'Admin', icon: 'fas fa-user-cog' },
        { value: 'superadmin', label: 'Super Admin', icon: 'fas fa-user-shield' }
      ],
      showDeleteModal: false,
      departments: []
    }
  },
  computed: {
    filteredUsers() {
      return this.users.filter(user => {
        const matchesSearch = !this.searchTerm || 
          `${user.first_name} ${user.last_name}`.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
          user.emp_id.toString().includes(this.searchTerm) ||
          user.dept_full.toLowerCase().includes(this.searchTerm.toLowerCase());
        
        const matchesDepartment = !this.departmentFilter || 
          user.dept_full === this.departmentFilter;
        
        const matchesRole = !this.roleFilter || 
          this.getRoleClass(user.role_id) === this.roleFilter;
        
        return matchesSearch && matchesDepartment && matchesRole;
      });
    },
    adminCount() {
      return this.users.filter(user => user.role_id === 2).length;
    },
    userCount() {
      return this.users.filter(user => user.role_id === 1).length;
    },
    superAdminCount() {
      return this.users.filter(user => user.role_id === 3).length;
    }
  },


  methods: {
    async fetchUsers() {
      try {
        const response = await axios.get('http://localhost:8088/api/admin-users');
        this.users = response.data;
        console.log('Fetched users:', this.users);
      } catch (error) {
        console.error('Error fetching users:', error);
        this.toast.error('ไม่สามารถโหลดข้อมูลผู้ใช้งานได้');
      }
    },
    async fetchDepartments() {
      try {
        const response = await axios.get('http://localhost:8088/api/departments');
        this.departments = response.data.map(dept => ({
          code: dept.dept_change_code,
          name: dept.dept_full
        }));
      } catch (error) {
        console.error('Error fetching departments:', error);
        this.toast.error('ไม่สามารถโหลดข้อมูลแผนกได้');
      }
    },
    editUser(user) {
      alert('ไม่สามารถแก้ไขข้อมูลผู้ใช้ได้เนื่องจากใช้ข้อมูลจากระบบหลัก');
    },
    async toggleUserStatus(user) {
      try {
        const index = this.users.findIndex(u => u.id === user.id);
        if (index !== -1) {
          this.users[index].status = user.status === 'active' ? 'inactive' : 'active';
        }
      } catch (error) {
        console.error('Error toggling user status:', error);
        alert('ไม่สามารถเปลี่ยนสถานะผู้ใช้งานได้');
      }
    },
    async saveUser() {
      try {
        if (!this.userForm.firstName || !this.userForm.lastName || !this.userForm.department || !this.userForm.employeeId) {
          this.toast.error('กรุณากรอกข้อมูลให้ครบถ้วน');
          return;
        }

        // แปลง role เป็น role_id
        let role_id;
        switch (this.userForm.role) {
          case 'admin':
            role_id = 2;
            break;
          case 'superadmin':
            role_id = 3;
            break;
          default:
            role_id = 1;
        }

        const userData = {
          role_id: role_id,
          emp_id: parseInt(this.userForm.employeeId),
          first_name: this.userForm.firstName,
          last_name: this.userForm.lastName,
          dept_change_code: this.userForm.department.code,
          dept_full: this.userForm.department.name
        };

        const response = await axios.post('http://localhost:8088/api/add-user', userData);
        
        if (response.data.status === 'success') {
          this.toast.success('เพิ่มผู้ใช้งานสำเร็จ');
          this.closeModal();
          await this.fetchUsers(); // รีโหลดข้อมูลทั้งหมดใหม่
        } else {
          throw new Error(response.data.message || 'ไม่สามารถเพิ่มผู้ใช้งานได้');
        }
      } catch (error) {
        console.error('Error adding user:', error);
        this.toast.error(error.response?.data?.message || 'ไม่สามารถเพิ่มผู้ใช้งานได้');
      }
    },
    closeModal() {
      this.showAddUserModal = false;
      this.userForm = {
        firstName: '',
        lastName: '',
        employeeId: '',
        department: '',
        role: 'user'
      };
    },
    getUserInitials(name) {
      if (!name) return '';
      return name.split(' ')
        .map(n => n ? n[0] : '')
        .join('')
        .toUpperCase();
    },
    getDepartments() {
      return [...new Set(this.users.map(user => user.department))];
    },
    async updateUserRole(user) {
      try {
        if (!user || !user.emp_id) {
          this.toast.error('ไม่พบข้อมูลผู้ใช้');
          return;
        }

        const userData = {
          emp_id: user.emp_id,
          role: user.role,
          title_s_desc: user.title_s_desc || '',
          first_name: user.first_name || '',
          last_name: user.last_name || '',
          dept_full: user.department || ''
        };

        let response;
        
        // ถ้าเป็น admin หรือ superadmin ให้บันทึกลง MySQL
        if (user.role === 'admin' || user.role === 'superadmin') {
          response = await axios.post('http://localhost:8881/api/save-admin-role', userData);
          if (response.data.status !== 'success') {
            throw new Error(response.data.message || 'ไม่สามารถบันทึกสิทธิ์การใช้งานได้');
          }
          this.toast.success('บันทึกสิทธิ์การใช้งานสำเร็จ');
        } else {
          // ถ้าเปลี่ยนเป็น user ให้ลบออกจาก MySQL
          response = await axios.delete(`http://localhost:8881/api/remove-admin-role/${user.emp_id}`);
          if (response.data.status !== 'success') {
            throw new Error(response.data.message || 'ไม่สามารถลบสิทธิ์การใช้งานได้');
          }
          this.toast.success('อัปเดตสิทธิ์การใช้งานสำเร็จ');
        }

        // อัพเดตข้อมูลในตาราง
        const index = this.users.findIndex(u => u.emp_id === user.emp_id);
        if (index !== -1) {
          this.users[index] = {
            ...this.users[index],
            role: user.role
          };
        }

      } catch (error) {
        console.error('Error updating role:', error);
        
        // จัดการ error message
        let errorMessage;
        if (error.response) {
          // Error จาก API
          errorMessage = error.response.data?.message || 'ไม่สามารถอัปเดตสิทธิ์การใช้งานได้';
        } else if (error.message) {
          // Error ทั่วไป
          errorMessage = error.message;
        } else {
          // Default error message
          errorMessage = 'ไม่สามารถอัปเดตสิทธิ์การใช้งานได้';
        }
        
        this.toast.error(errorMessage);

        // Reset role กลับไปเป็นค่าเดิม
        if (this.originalRoles && this.originalRoles[user.emp_id]) {
          const index = this.users.findIndex(u => u.emp_id === user.emp_id);
          if (index !== -1) {
            this.users[index].role = this.originalRoles[user.emp_id];
          }
        }
      }
    },
    confirmRoleChange(user) {
      if (this.selectedRole === this.getRoleClass(user.role_id)) {
        return;
      }
      
      // แปลง role เป็น role_id
      let role_id;
      switch (this.selectedRole) {
        case 'admin':
          role_id = 2;
          break;
        case 'superadmin':
          role_id = 3;
          break;
        default:
          role_id = 1;
      }
      
      this.selectedUser = {
        ...user,
        role_id: role_id
      };
      this.showConfirmModal = true;
    },
    closeConfirmModal() {
      this.showConfirmModal = false;
      this.selectedUser = null;
    },
    async saveRoleChange() {
      if (this.selectedUser) {
        await this.updateUserRole(this.selectedUser);
      }
    },
    manageRole(user) {
      this.selectedUser = { ...user };
      this.selectedRole = this.getRoleClass(user.role_id);
      this.showRoleModal = true;
    },
    async saveRole() {
      try {
        if (!this.selectedUser || !this.selectedRole) {
          this.toast.error('กรุณาเลือกระดับผู้ใช้งาน');
          return;
        }

        // แปลง role เป็น role_id
        let role_id;
        switch (this.selectedRole) {
          case 'admin':
            role_id = 2;
            break;
          case 'superadmin':
            role_id = 3;
            break;
          default:
            role_id = 1;
        }

        const userData = {
          emp_id: this.selectedUser.emp_id,
          role_id: role_id,
          title_s_desc: this.selectedUser.title_s_desc || '',
          first_name: this.selectedUser.first_name,
          last_name: this.selectedUser.last_name,
          dept_change_code: this.selectedUser.dept_change_code,
          dept_full: this.selectedUser.dept_full
        };

        let response;
        if (role_id === 1) {
          // ถ้าเป็น user ให้เรียก API เปลี่ยนสิทธิ์
          response = await axios.delete(`http://localhost:8088/api/remove-admin-role/${this.selectedUser.emp_id}`);
        } else {
          // ถ้าเป็น admin หรือ superadmin ให้บันทึกลงตาราง users
          response = await axios.post('http://localhost:8088/api/save-admin-role', userData);
        }

        if (response.data.status === 'success') {
          // อัพเดตข้อมูลในตารางทันทีหลังจากบันทึกสำเร็จ
          const index = this.users.findIndex(u => u.emp_id === this.selectedUser.emp_id);
          if (index !== -1) {
            this.users[index] = {
              ...this.users[index],
              role_id: role_id
            };
          }
          this.toast.success('บันทึกสิทธิ์ผู้ใช้งานสำเร็จ');
          this.closeRoleModal();
          await this.fetchUsers(); // รีโหลดข้อมูลทั้งหมดใหม่
        } else {
          throw new Error(response.data.message || 'ไม่สามารถบันทึกสิทธิ์ผู้ใช้งานได้');
        }

      } catch (error) {
        console.error('Error saving role:', error);
        this.toast.error(error.response?.data?.message || 'ไม่สามารถบันทึกสิทธิ์ผู้ใช้งานได้');
      }
    },
    closeRoleModal() {
      this.showRoleModal = false;
      this.selectedUser = null;
      this.selectedRole = null;
    },
    getRoleDisplay(roleId) {
      switch (roleId) {
        case 1: return 'User';
        case 2: return 'Admin';
        case 3: return 'Super Admin';
        default: return 'User';
      }
    },
    getRoleClass(roleId) {
      switch (roleId) {
        case 1: return 'user';
        case 2: return 'admin';
        case 3: return 'superadmin';
        default: return 'user';
      }
    },
    formatDate(date) {
      if (!date) return '-';
      return new Date(date).toLocaleDateString('th-TH', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    },
    getCountByRole(roleType) {
      switch (roleType) {
        case 'admin':
          return this.users.filter(user => user.role_id === 2).length;
        case 'superadmin':
          return this.users.filter(user => user.role_id === 3).length;
        case 'user':
          return this.users.filter(user => user.role_id === 1).length;
        default:
          return 0;
      }
    },
    confirmDelete(user) {
      this.selectedUser = user;
      this.showDeleteModal = true;
    },
    closeDeleteModal() {
      this.showDeleteModal = false;
      this.selectedUser = null;
    },
    async deleteUser() {
      try {
        if (!this.selectedUser) {
          this.toast.error('ไม่พบข้อมูลผู้ใช้งาน');
          return;
        }

        const response = await axios.delete(`http://localhost:8088/api/delete-user/${this.selectedUser.emp_id}`);
        
        if (response.data.status === 'success') {
          this.toast.success('ลบผู้ใช้งานสำเร็จ');
          this.closeDeleteModal();
          await this.fetchUsers(); // รีโหลดข้อมูลทั้งหมดใหม่
        } else {
          throw new Error(response.data.message || 'ไม่สามารถลบผู้ใช้งานได้');
        }
      } catch (error) {
        console.error('Error deleting user:', error);
        this.toast.error(error.response?.data?.message || 'ไม่สามารถลบผู้ใช้งานได้');
      }
    },
    async getCurrentUserRole() {
      try {
        // ใช้ API call แทนการอ่านจาก localStorage
        const response = await axios.get('http://localhost:8088/api/check-permission');
        if (response.data && response.data.data) {
          this.currentUserRole = response.data.data.role_id;
          console.log('Set currentUserRole to:', this.currentUserRole);
        }
      } catch (error) {
        console.error('Error getting user role:', error);
        this.toast.error('ไม่สามารถดึงข้อมูลสิทธิ์ผู้ใช้ได้');
      }
    }
  },
  async created() {
    // เรียกใช้ getCurrentUserRole ก่อน
    await this.getCurrentUserRole();
    // จากนั้นจึงเรียกใช้ fetchUsers และ fetchDepartments
    await Promise.all([
      this.fetchUsers(),
      this.fetchDepartments()
    ]);
  }
}
</script>

<style scoped>
.container {
  padding: 2rem;
  background: #f8fafc;
  min-height: 100vh;
}

.admin-card {
  background: white;
  border-radius: 16px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  padding: 2rem;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.header-title {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.header-title i {
  font-size: 2rem;
  color: #4f46e5;
  background: #eef2ff;
  padding: 0.75rem;
  border-radius: 12px;
}

.header-title h1 {
  font-size: 1.8rem;
  color: #1e293b;
  margin: 0;
}

/* Stats Cards */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.stat-card {
  background: linear-gradient(135deg, #4f46e5, #6366f1);
  border-radius: 16px;
  padding: 1.5rem;
  color: white;
  display: flex;
  align-items: center;
  gap: 1.5rem;
  transition: transform 0.2s;
}

.stat-card:hover {
  transform: translateY(-4px);
}

.stat-icon i {
  font-size: 2rem;
  background: rgba(255, 255, 255, 0.2);
  padding: 1rem;
  border-radius: 12px;
}

.stat-info h3 {
  font-size: 0.9rem;
  opacity: 0.9;
  margin: 0;
}

.stat-info p {
  font-size: 1.8rem;
  font-weight: 600;
  margin: 0.5rem 0 0 0;
}

/* Search and Filters */
.filter-section {
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
}

.search-box {
  position: relative;
  flex: 1;
}

.search-box input {
  width: 100%;
  padding: 0.75rem 1rem 0.75rem 2.5rem;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  font-size: 0.95rem;
}

.search-box i {
  position: absolute;
  left: 1rem;
  top: 50%;
  transform: translateY(-50%);
  color: #94a3b8;
}

.filter-group {
  display: flex;
  gap: 1rem;
}

.select-wrapper {
  position: relative;
}

.select-wrapper i {
  position: absolute;
  left: 1rem;
  top: 50%;
  transform: translateY(-50%);
  color: #94a3b8;
}

.select-wrapper select {
  padding: 0.75rem 1rem 0.75rem 2.5rem;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  font-size: 0.95rem;
  min-width: 180px;
  appearance: none;
  background: white;
  cursor: pointer;
}

/* Table Styles */
.table-container {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

table {
  width: 100%;
  border-collapse: collapse;
}

th {
  background: #f8fafc;
  padding: 1rem;
  font-weight: 600;
  color: #1e293b;
  text-align: left;
}

td {
  padding: 1rem;
  border-bottom: 1px solid #e2e8f0;
  color: #475569;
}

.user-info-cell {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.user-avatar {
  width: 36px;
  height: 36px;
  background: #4f46e5;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 0.9rem;
}

.department-badge {
  /* background: #f3f4f6; */
  color: #4b5563;
  padding: 0.4rem 0.8rem;
  border-radius: 6px;
  font-size: 0.9rem;
}

.role-badge {
  padding: 0.4rem 0.8rem;
  border-radius: 6px;
  font-size: 0.9rem;
  font-weight: 500;
}

.role-badge.user {
  background: #e0f2fe;
  color: #0369a1;
}

.role-badge.admin {
  background: #f0fdf4;
  color: #166534;
}

.role-badge.superadmin {
  background: #fef3c7;
  color: #92400e;
}

.role-select {
  padding: 0.5rem;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: white;
  color: #1e293b;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s;
}

.role-select:hover {
  border-color: #cbd5e1;
}

.status-badge {
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-size: 0.875rem;
}

.status-badge.active {
  background: #dcfce7;
  color: #059669;
}

.status-badge.inactive {
  background: #fee2e2;
  color: #991b1b;
}

/* Buttons */
.btn-add {
  background: #4f46e5;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 12px;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-add:hover {
  background: #4338ca;
  transform: translateY(-2px);
}

.btn-action {
  padding: 0.5rem;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-action.edit {
  background: #eef2ff;
  color: #4f46e5;
}

.btn-action.suspend {
  background: #fee2e2;
  color: #ef4444;
}

.btn-action.activate {
  background: #dcfce7;
  color: #059669;
}

.btn-action:hover {
  transform: translateY(-2px);
}

/* Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 16px;
  width: 90%;
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-header {
  padding: 1.5rem;
  border-bottom: 1px solid #e2e8f0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-header h2 {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin: 0;
  color: #1e293b;
}

.modal-body {
  padding: 1.5rem;
  text-align: center;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1.5rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-group label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #64748b;
  font-size: 0.9rem;
}

.form-group input,
.form-group select {
  padding: 0.75rem;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 0.95rem;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 2rem;
}

.btn-cancel,
.btn-save {
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-cancel {
  background: white;
  border: 1px solid #e2e8f0;
  color: #64748b;
}

.btn-save {
  background: #4f46e5;
  border: none;
  color: white;
}

.btn-cancel:hover,
.btn-save:hover {
  transform: translateY(-2px);
}

.user-name {
  font-size: 1.2rem;
  font-weight: 600;
  color: #1e293b;
  margin: 1rem 0;
}

.old-role,
.new-role {
  font-weight: 600;
  padding: 0.3rem 0.8rem;
  border-radius: 20px;
  display: inline-block;
  margin: 0 0.5rem;
}

.old-role {
  background: #fee2e2;
  color: #dc2626;
}

.new-role {
  background: #dcfce7;
  color: #059669;
}

.btn-confirm {
  background: #059669;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-confirm:hover {
  background: #047857;
  transform: translateY(-2px);
}

/* Responsive Design */
@media (max-width: 768px) {
  .container {
    padding: 1rem;
  }

  .header {
    flex-direction: column;
    gap: 1rem;
  }

  .filter-section {
    flex-direction: column;
  }

  .stats-grid {
    grid-template-columns: 1fr;
  }

  .form-grid {
    grid-template-columns: 1fr;
  }
}

/* เพิ่ม styles สำหรับ Role Modal */
.role-options {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
  margin-top: 0.5rem;
}

.role-option {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  background: white;
  cursor: pointer;
  transition: all 0.2s;
}

.role-option i {
  font-size: 1.5rem;
  color: #6b7280;
}

.role-option.active {
  border-color: #4f46e5;
  background: #eef2ff;
}

.role-option.active i {
  color: #4f46e5;
}

.user-avatar {
  width: 48px;
  height: 48px;
  background: #4f46e5;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
  font-weight: 600;
}

.user-details h3 {
  margin: 0 0 0.25rem 0;
  color: #1f2937;
}

.user-details p {
  margin: 0;
  color: #6b7280;
}

.btn-manage {
  background: #4f46e5;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.2s;
}

.btn-manage:hover {
  background: #4338ca;
  transform: translateY(-1px);
}

.role-selection {
  margin: 1.5rem 0;
}

.role-selection label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: #374151;
}

.btn-close {
  background: #f1f5f9;
  border: none;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  color: #64748b;
}

.btn-close:hover {
  background: #e2e8f0;
  color: #ef4444;
  transform: rotate(90deg);
}

.btn-close i {
  font-size: 1.1rem;
}

.btn-delete {
  background: #ef4444;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.2s;
}

.btn-delete:hover {
  background: #dc2626;
  transform: translateY(-1px);
}

.action-buttons {
  display: flex;
  gap: 0.5rem;
  justify-content: center;
  min-width: 220px;
}
</style>
