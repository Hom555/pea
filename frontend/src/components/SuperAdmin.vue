<template>
  <!-- Modal Components -->
  <div class="modal-overlay" v-if="showAddModal || showEditModal || showDeleteModal">
    <!-- Modal เพิ่ม/แก้ไขระบบ -->
    <div class="modal-card" v-if="showAddModal || showEditModal">
      <div class="modal-header">
        <h3>{{ showAddModal ? 'เพิ่มระบบใหม่' : 'แก้ไขระบบ' }}</h3>
        <button class="close-btn" @click="closeModal">
          <i class="fas fa-times"></i>
        </button>
      </div>
      <div class="modal-body">
        <form @submit.prevent="handleSubmit">
          <div class="form-group">
            <label>
              <i class="fas fa-font"></i>
              ชื่อระบบ (ภาษาไทย)
            </label>
            <input 
              v-model="currentNameTH" 
              required
              placeholder="กรอกชื่อระบบภาษาไทย"
            >
          </div>
          <div class="form-group">
            <label>
              <i class="fas fa-language"></i>
              ชื่อระบบ (ภาษาอังกฤษ)
            </label>
            <input 
              v-model="currentNameEN" 
              required
              placeholder="Enter system name in English"
            >
          </div>
          <div class="form-group">
            <label>
              <i class="fas fa-building"></i>
              แผนก
            </label>
            <select 
              v-if="showAddModal"
              v-model="selectedDept" 
              required
              @change="handleDeptChange"
            >
              <option value="">เลือกแผนก</option>
              <option 
                v-for="dept in departments" 
                :key="dept.dept_change_code" 
                :value="dept"
              >
                {{ dept.dept_full }}
              </option>
            </select>
            <input 
              v-else
              v-model="currentDeptFull" 
              required
              placeholder="กรอกชื่อแผนก"
              readonly
            >
          </div>
          
          <div class="modal-actions">
            <button type="button" class="cancel-btn" @click="closeModal">
              <i class="fas fa-times"></i> ยกเลิก
            </button>
            <button type="submit" class="submit-btn">
              <i class="fas fa-check"></i> 
              {{ showAddModal ? 'เพิ่มระบบ' : 'บันทึกการแก้ไข' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Modal ยืนยันการลบ -->
    <div class="modal-card delete-modal" v-if="showDeleteModal">
      <div class="modal-header delete">
        <h3><i class="fas fa-exclamation-triangle"></i> ยืนยันการลบ</h3>
        <button class="close-btn" @click="closeModal">
          <i class="fas fa-times"></i>
        </button>
      </div>
      <div class="modal-body">
        <div class="delete-content">
          <p>คุณต้องการลบระบบ "<span>{{ selectedSystem?.name_th }}</span>" ใช่หรือไม่?</p>
          <p class="warning">การดำเนินการนี้ไม่สามารถยกเลิกได้</p>
        </div>
        <div class="modal-actions">
          <button class="cancel-btn" @click="closeModal">
            <i class="fas fa-times"></i> ยกเลิก
          </button>
          <button class="delete-btn" @click="confirmDelete">
            <i class="fas fa-trash-alt"></i> ยืนยันการลบ
          </button>
        </div>
      </div>
    </div>
  </div>

  <div class="container">
    <div class="content">
      <!-- ส่วนแสดงข้อมูลระบบ -->
      <div class="data-section">
        <!-- Header with Stats -->
        <div class="dashboard-header">
          <div class="header-title">
            <h2><i class="fas fa-server pulse"></i> ระบบงานทั้งหมด</h2>
            <div class="header-stats">
              <div class="stat-card">
                <i class="fas fa-database"></i>
                <div class="stat-info">
                  <span class="stat-value">{{ systems.length }}</span>
                  <span class="stat-label">ระบบทั้งหมด</span>
                </div>
              </div>
            </div>
          </div>
          
          <div class="header-actions">
            <div class="search-box">
              <i class="fas fa-search"></i>
              <input 
                type="text" 
                v-model="searchTerm" 
                placeholder="ค้นหาระบบ..."
              >
            </div>
            <button class="add-btn" @click="showAddModal = true">
              <i class="fas fa-plus-circle"></i>
              <span>เพิ่มระบบใหม่</span>
            </button>
          </div>
        </div>

        <div class="table-container">
          <div class="table-responsive">
            <table class="system-table">
              <thead>
                <tr>
                  <th class="text-center">#</th>
                  <th>ชื่อระบบ</th>
                  <th>แผนก</th>
                  <th>วันที่สร้าง</th>
                  <th class="text-center">จัดการ</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(system, index) in filteredSystems" :key="system.id">
                  <td class="text-center">
                    <span class="row-number">{{ index + 1 }}</span>
                  </td>
                  <td>
                    <div class="system-name">
                      <strong>{{ system.name_th }}</strong>
                      <small class="name-en">{{ system.name_en }}</small>
                    </div>
                  </td>
                  <td>
                    <div class="department-info">
                      <div class="dept">
                        <i class="fas fa-building pulse-slow"></i>
                        {{ system.dept_full || 'ไม่ระบุแผนก' }}
                      </div>
                    </div>
                  </td>
                  <td>
                    <div class="date-info">
                      <i class="far fa-calendar-alt pulse-slow"></i>
                      {{ formatThaiDate(system.created_at) }}
                    </div>
                  </td>
                  <td>
                    <div class="action-buttons">
                      <button class="action-btn edit-btn" @click="editSystem(system)" title="แก้ไข">
                        <div class="btn-content">
                          <i class="fas fa-edit"></i>
                          <span class="btn-label">แก้ไข</span>
                        </div>
                        <div class="btn-bg"></div>
                      </button>
                      <button 
                        class="action-btn status-btn" 
                        @click="toggleStatus(system.id)"
                        :class="{ 'disabled': !system.is_active }"
                      >
                        <div class="btn-content">
                          <i :class="system.is_active ? 'fas fa-check-circle' : 'fas fa-times-circle'"></i>
                          <span class="btn-label">
                            {{ system.is_active ? 'เปิดใช้งาน' : 'ปิดใช้งาน' }}
                          </span>
                        </div>
                      </button>
                      <button class="action-btn delete-btn" @click="confirmDeletePrompt(system)" title="ลบ">
                        <div class="btn-content">
                          <i class="fas fa-trash-alt"></i>
                          <span class="btn-label">ลบ</span>
                        </div>
                        <div class="btn-bg"></div>
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios';
import { mapState, mapMutations } from 'vuex';
import { useToast } from 'vue-toastification';

export default {
  name: 'SuperAdmin',
  data() {
    return {
      systems: [],
      searchTerm: '',
      loading: false,
      showAddModal: false,
      showDeleteModal: false,
      selectedSystem: null,
      showEditModal: false,
      // แยกข้อมูลสำหรับการเพิ่มและแก้ไข
      addForm: {
        name_th: '',
        name_en: '',
        dept_full: '',
        dept_change_code: ''
      },
      editForm: {
        name_th: '',
        name_en: '',
        dept_full: '',
        dept_change_code: ''
      },
      departments: [],
      selectedDept: null,
    };
  },
  computed: {
    ...mapState(['isSuperAdminVisible']),
    filteredSystems() {
      if (!this.searchTerm) return this.systems;
      const search = this.searchTerm.toLowerCase();
      return this.systems.filter(system => 
        system.name_th.toLowerCase().includes(search) ||
        system.name_en.toLowerCase().includes(search) ||
        (system.dept_full && system.dept_full.toLowerCase().includes(search))
      );
    },
    totalImportantInfo() {
      return this.systems.reduce((total, system) => {
        return total + (system.important_info_count || 0);
      }, 0);
    },
    currentNameTH: {
      get() {
        return this.showAddModal ? this.addForm.name_th : this.editForm.name_th;
      },
      set(value) {
        if (this.showAddModal) {
          this.addForm.name_th = value;
        } else {
          this.editForm.name_th = value;
        }
      }
    },
    currentNameEN: {
      get() {
        return this.showAddModal ? this.addForm.name_en : this.editForm.name_en;
      },
      set(value) {
        if (this.showAddModal) {
          this.addForm.name_en = value;
        } else {
          this.editForm.name_en = value;
        }
      }
    },
    currentDeptFull: {
      get() {
        return this.showAddModal ? this.addForm.dept_full : this.editForm.dept_full;
      },
      set(value) {
        if (this.showAddModal) {
          this.addForm.dept_full = value;
        } else {
          this.editForm.dept_full = value;
        }
      }
    }
  },
  setup() {
    const toast = useToast();
    return { toast }
  },
  methods: {
    ...mapMutations(['toggleSuperAdminVisibility']),
    formatDate(dateString) {
      if (!dateString) return '';
      const date = new Date(dateString);
      return date.toLocaleDateString('th-TH', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    },
    formatThaiDate(dateString) {
      if (!dateString) return '';
      const date = new Date(dateString);
      const day = date.getDate();
      const month = date.getMonth() + 1;
      const year = date.getFullYear() + 543;
      const buddhistYear = String(year).slice(-2); // เอาเฉพาะ 2 ตัวท้าย
      return `${day}/${month}/${buddhistYear}`;
    },
    async fetchSystems() {
      try {
        const response = await axios.get('http://localhost:8088/api/all-system-records');
        this.systems = response.data;
      } catch (error) {
        console.error('ไม่สามารถดึงข้อมูลระบบ:', error);
        this.toast.error('ไม่สามารถโหลดข้อมูลระบบได้ กรุณาลองใหม่อีกครั้ง');
      }
    },
    async editSystem(system) {
      if (this.showEditModal) {
        try {
          const formattedData = {
            nameTH: this.editForm.name_th,
            nameEN: this.editForm.name_en,
            dept_full: this.editForm.dept_full,
            dept_change_code: this.editForm.dept_change_code
          };

          const response = await axios.put(
            `http://localhost:8088/api/system-record/${this.selectedSystem.id}`,
            formattedData
          );

          if (response.data.status === 'success') {
            const index = this.systems.findIndex(s => s.id === this.selectedSystem.id);
            if (index !== -1) {
              this.systems[index] = { 
                ...this.systems[index], 
                name_th: this.editForm.name_th,
                name_en: this.editForm.name_en,
                dept_full: this.editForm.dept_full,
                dept_change_code: this.editForm.dept_change_code
              };
            }
            this.toast.success('บันทึกการแก้ไขสำเร็จ');
            this.closeModal();
          } else {
            throw new Error(response.data.message || 'ไม่สามารถบันทึกการแก้ไขได้');
          }
        } catch (error) {
          console.error('Error updating system:', error);
          this.toast.error(error.response?.data?.message || 'ไม่สามารถบันทึกการแก้ไขได้');
        }
      } else {
        this.selectedSystem = system;
        this.editForm = { 
          name_th: system.name_th,
          name_en: system.name_en,
          dept_full: system.dept_full,
          dept_change_code: system.dept_change_code
        };
        this.showEditModal = true;
      }
    },
    confirmDeletePrompt(system) {
      this.selectedSystem = system;
      this.showDeleteModal = true;
    },
    async confirmDelete() {
      try {
        if (!this.selectedSystem) {
          this.toast.error('ไม่พบข้อมูลที่ต้องการลบ');
          return;
        }
        
        const response = await axios.delete(
          `http://localhost:8088/api/system-record/${this.selectedSystem.id}`
        );

        if (response.data.success) {
          // อัพเดตข้อมูลในตารางโดยลบระบบที่เลือกออก
          this.systems = this.systems.filter(
            system => system.id !== this.selectedSystem.id
          );
          this.toast.success('ลบระบบสำเร็จ');
          this.closeModal();
        } else {
          throw new Error(response.data.message || 'ไม่สามารถลบระบบได้');
        }
      } catch (error) {
        console.error('Error deleting system:', error);
        this.toast.error(error.response?.data?.message || 'ไม่สามารถลบระบบได้');
      }
      this.showDeleteModal = false;
      this.selectedSystem = null;
    },
    async fetchDepartments() {
      try {
        const response = await axios.get('http://localhost:8088/api/departments');
        this.departments = response.data;
      } catch (error) {
        console.error('Error fetching departments:', error);
        this.toast.error('ไม่สามารถดึงข้อมูลแผนกได้');
      }
    },
    handleDeptChange() {
      if (this.selectedDept) {
        this.addForm.dept_change_code = this.selectedDept.dept_change_code;
        this.addForm.dept_full = this.selectedDept.dept_full;
        this.currentDeptFull = this.selectedDept.dept_full;
      } else {
        this.addForm.dept_change_code = '';
        this.addForm.dept_full = '';
        this.currentDeptFull = '';
      }
    },
    async addSystem() {
      try {
        if (!this.addForm.dept_change_code || !this.addForm.dept_full) {
          this.toast.error('กรุณาเลือกแผนก');
          return;
        }

        const response = await axios.post('http://localhost:8088/api/super-admin/system-record', {
          nameTH: this.addForm.name_th,
          nameEN: this.addForm.name_en,
          dept_full: this.addForm.dept_full,
          dept_change_code: this.addForm.dept_change_code
        });
        
        this.systems.unshift(response.data);
        this.showAddModal = false;
        this.selectedDept = null;
        this.addForm = {
          name_th: '',
          name_en: '',
          dept_full: '',
          dept_change_code: ''
        };
        this.toast.success('เพิ่มระบบสำเร็จ');
      } catch (error) {
        console.error('Error adding system:', error);
        this.toast.error(error.response?.data?.message || 'ไม่สามารถเพิ่มระบบได้');
      }
    },
    closeModal() {
      this.showAddModal = false;
      this.showEditModal = false;
      this.showDeleteModal = false;
      this.selectedDept = null;
      // Reset forms
      this.addForm = {
        name_th: '',
        name_en: '',
        dept_full: '',
        dept_change_code: ''
      };
      this.editForm = {
        name_th: '',
        name_en: '',
        dept_full: '',
        dept_change_code: ''
      };
      this.selectedSystem = null;
    },
    handleSubmit() {
      if (this.showAddModal) {
        this.addSystem();
      } else if (this.showEditModal) {
        this.editSystem(this.selectedSystem);
      }
    },
    async toggleStatus(systemId) {
      try {
        console.log('Attempting to toggle status for system:', systemId);
        
        const response = await axios.put(
          `http://localhost:8088/api/system-records/${systemId}/toggle-status`
        );

        console.log('Response from server:', response.data);

        if (response.data.status === 'success') {
          const index = this.systems.findIndex(s => s.id === systemId);
          if (index !== -1) {
            this.systems[index].is_active = response.data.is_active;
            console.log('Updated system status locally');
          }
          
          this.toast.success(response.data.message);
          await this.fetchSystems();
        }
      } catch (error) {
        console.error('Error details:', {
          message: error.message,
          response: error.response?.data,
          status: error.response?.status
        });
        
        const errorMessage = error.response?.data?.message || 'ไม่สามารถเปลี่ยนสถานะการใช้งานได้';
        this.toast.error(errorMessage);
      }
    },
    toggleVisibility() {
      this.toggleSuperAdminVisibility();
    },
    showFullImage(imagePath) {
      this.selectedImage = imagePath;
      this.showImageModal = true;
    },
    closeImageModal() {
      this.showImageModal = false;
      this.selectedImage = null;
    },
    getFiles(paths) {
      if (!paths) return [];
      try {
        const fileArray = JSON.parse(paths);
        return fileArray.map(path => ({
          path: `http://localhost:8088${path}`,
          name: path.split('/').pop()
        }));
      } catch (error) {
        console.error('Error parsing file paths:', error);
        return [];
      }
    },
    getFileIcon(filePath) {
      const ext = filePath.split('.').pop().toLowerCase();
      switch (ext) {
        case 'pdf':
          return 'fas fa-file-pdf';
        case 'doc':
        case 'docx':
          return 'fas fa-file-word';
        case 'xls':
        case 'xlsx':
          return 'fas fa-file-excel';
        default:
          return 'fas fa-file';
      }
    },
    formatFileSize(bytes) {
      if (!bytes) return '0 Bytes';
      const k = 1024;
      const sizes = ['Bytes', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
  },
  mounted() {
    this.fetchSystems();
    this.fetchDepartments();
  }
};
</script>

<style scoped>
/* Base Layout */
.container {
  background: #f0f2f5;
  min-height: 100vh;
  padding: 20px;
}

.content {
  max-width: 1400px;
  margin: 0 auto;
}

.data-section {
  background: transparent;
}

/* Modern Dashboard Header */
.dashboard-header {
  background: linear-gradient(120deg, #1a237e 0%, #283593 100%);
  border-radius: 20px;
  padding: 30px;
  margin-bottom: 30px;
  box-shadow: 0 10px 25px rgba(26, 35, 126, 0.2);
  color: white;
}

.header-title {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  flex-wrap: wrap;
  gap: 30px;
}

.header-title h2 {
  font-size: 2.2rem;
  font-weight: 600;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 15px;
  color: white;
  text-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.header-title h2 i {
  color: #64ffda;
}

/* Stats Cards */
.header-stats {
  display: flex;
  gap: 20px;
  flex-wrap: wrap;
}

.stat-card {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  padding: 20px 30px;
  border-radius: 15px;
  display: flex;
  align-items: center;
  gap: 20px;
  min-width: 200px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  transition: all 0.3s ease;
}

.stat-card:hover {
  transform: translateY(-5px);
  background: rgba(255, 255, 255, 0.15);
}

.stat-card i {
  font-size: 2.5rem;
  color: #64ffda;
}

.stat-info {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.stat-value {
  font-size: 1.5rem;
  font-weight: 600;
  color: white;
}

.stat-label {
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.8);
}

/* Search and Add Button */
.header-actions {
  width: 100%;
  display: flex;
  gap: 20px;
  margin-top: 20px;
}

.search-box {
  flex: 1;
  max-width: 400px;
  position: relative;
}

.search-box input {
  width: 100%;
  padding: 12px 20px 12px 45px;
  border: none;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.1);
  color: white;
  font-size: 1rem;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  transition: all 0.3s ease;
}

.search-box input::placeholder {
  color: rgba(255, 255, 255, 0.6);
}

.search-box input:focus {
  background: rgba(255, 255, 255, 0.15);
  outline: none;
  box-shadow: 0 0 0 3px rgba(100, 255, 218, 0.3);
}

.search-box i {
  position: absolute;
  left: 15px;
  top: 50%;
  transform: translateY(-50%);
  color: rgba(255, 255, 255, 0.6);
}

.add-btn {
  padding: 12px 25px;
  border: none;
  border-radius: 12px;
  background: #64ffda;
  color: #1a237e;
  font-weight: 600;
  font-size: 1rem;
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(100, 255, 218, 0.3);
}

.add-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(100, 255, 218, 0.4);
}

/* Table Styling */
.table-container {
  background: white;
  border-radius: 20px;
  padding: 25px;
  box-shadow: 0 10px 30px rgba(0,0,0,0.05);
}

.system-table {
  width: 100%;
  border-spacing: 0 15px;
  margin-top: -15px;
}

.system-table thead tr {
  background: transparent;
  box-shadow: none;
}

.system-table th {
  padding: 20px;
  font-weight: 600;
  color: #1a237e;
  font-size: 1.1rem;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.system-table tbody tr {
  background: #fff;
  border-radius: 15px;
  box-shadow: 0 5px 15px rgba(0,0,0,0.03);
  transition: all 0.3s ease;
}

.system-table tbody tr:hover {
  transform: translateY(-3px) scale(1.005);
  box-shadow: 0 8px 25px rgba(0,0,0,0.05);
  background: #f8f9ff;
}

.system-table td {
  padding: 20px;
}

/* System Name Styling */
.system-name strong {
  color: #1a237e;
  font-size: 1.1rem;
  font-weight: 600;
}

.name-en {
  color: #666;
  font-size: 0.9rem;
  margin-top: 5px;
  display: block;
}

/* Department Info */
.department-info {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.department-info div {
  display: flex;
  align-items: center;
  gap: 10px;
  color: #555;
}

.department-info i {
  color: #1a237e;
  font-size: 1.1rem;
}

/* Stats Badges */
.badge {
  padding: 8px 15px;
  border-radius: 30px;
  font-weight: 500;
  font-size: 0.9rem;
}

.badge-primary {
  background: rgba(26, 35, 126, 0.1);
  color: #1a237e;
}

.badge-success {
  background: rgba(100, 255, 218, 0.1);
  color: #00897b;
}

/* Modern Action Buttons */
.action-buttons {
  display: flex;
  gap: 8px;
  justify-content: center;
}

.action-btn {
  padding: 8px 16px;
  border-radius: 4px;
  border: none;
  cursor: pointer;
  margin: 0 4px;
  display: inline-flex;
  align-items: center;
  font-size: 0.9rem;
  font-weight: 500;
  transition: all 0.3s ease;
}

.status-btn {
  min-width: 120px;
  justify-content: center;
}

.status-btn:not(.disabled) {
  background-color: #4CAF50;
  color: white;
  border: 1px solid #43A047;
}

.status-btn.disabled {
  background-color: #f44336;
  color: white;
  border: 1px solid #e53935;
}

.status-btn:hover:not(.disabled) {
  background-color: #43A047;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.status-btn:hover.disabled {
  background-color: #e53935;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.btn-content {
  display: flex;
  align-items: center;
  gap: 8px;
}

.btn-content i {
  font-size: 1.1em;
}

/* เพิ่มสีพื้นหลังสำหรับปุ่มอื่นๆ */
.edit-btn {
  background-color: #2196F3;
  color: white;
  border: 1px solid #1E88E5;
}

.delete-btn {
  background-color: #f44336;
  color: white;
  border: 1px solid #e53935;
}

.edit-btn:hover {
  background-color: #1E88E5;
}

.delete-btn:hover {
  background-color: #e53935;
}

/* Animation for button hover */
.action-btn::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 120%;
  height: 120%;
  background: rgba(255, 255, 255, 0.2);
  transform: translate(-50%, -50%) scale(0);
  border-radius: 50%;
  transition: transform 0.4s ease;
}

.action-btn:hover::after {
  transform: translate(-50%, -50%) scale(1);
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .btn-label {
    display: none;
  }
  
  .action-btn {
    width: 36px;
    padding: 0;
  }
  
  .btn-content {
    justify-content: center;
  }
}

/* Add subtle animation for icons */
.action-btn i {
  transition: transform 0.3s ease;
}

.action-btn:hover i {
  transform: scale(1.1);
}

/* Animations */
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

.system-table tbody tr {
  animation: fadeIn 0.5s ease forwards;
}

/* Responsive Design */
@media (max-width: 1200px) {
  .header-stats {
    justify-content: space-between;
  }
  
  .stat-card {
    flex: 1 1 calc(33.333% - 20px);
  }
}

@media (max-width: 768px) {
  .dashboard-header {
    padding: 20px;
  }
  
  .header-title {
    flex-direction: column;
  }
  
  .stat-card {
    flex: 1 1 100%;
  }
  
  .header-actions {
    flex-direction: column;
  }
  
  .search-box {
    max-width: 100%;
  }
}

/* Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(5px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

.modal-card {
  background: white;
  border-radius: 20px;
  width: 100%;
  max-width: 500px;
  box-shadow: 0 15px 30px rgba(0,0,0,0.2);
  animation: modalSlideIn 0.3s ease-out;
}

.modal-header {
  padding: 20px 25px;
  border-bottom: 1px solid #eee;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: linear-gradient(135deg, #1a237e, #283593);
  border-radius: 20px 20px 0 0;
  color: white;
}

.modal-header.delete {
  background: linear-gradient(135deg, #c62828, #d32f2f);
}

.modal-header h3 {
  margin: 0;
  font-size: 1.4rem;
  display: flex;
  align-items: center;
  gap: 10px;
}

.close-btn {
  background: rgba(255,255,255,0.2);
  border: none;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  color: white;
  cursor: pointer;
  transition: all 0.3s ease;
}

.close-btn:hover {
  background: rgba(255,255,255,0.3);
  transform: rotate(90deg);
}

.modal-body {
  padding: 25px;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
  color: #1a237e;
  font-weight: 500;
}

.form-group input {
  width: 100%;
  padding: 12px 15px;
  border: 2px solid #e0e0e0;
  border-radius: 10px;
  font-size: 1rem;
  transition: all 0.3s ease;
}

.form-group input:focus {
  border-color: #1a237e;
  outline: none;
  box-shadow: 0 0 0 3px rgba(26,35,126,0.1);
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 25px;
}

.modal-actions button {
  padding: 12px 24px;
  border-radius: 10px;
  border: none;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.3s ease;
}

.cancel-btn {
  background: #f5f5f5;
  color: #666;
}

.submit-btn {
  background: linear-gradient(135deg, #1a237e, #283593);
  color: white;
}

.delete-btn {
  background: linear-gradient(135deg, #c62828, #d32f2f);
  color: white;
}

.modal-actions button:hover {
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(0,0,0,0.1);
}

.delete-content {
  text-align: center;
  padding: 20px 0;
}

.delete-content p {
  margin: 10px 0;
  font-size: 1.1rem;
  color: #333;
}

.delete-content span {
  font-weight: 600;
  color: #c62828;
}

.warning {
  color: #c62828 !important;
  font-size: 0.9rem !important;
  margin-top: 15px !important;
}

@keyframes modalSlideIn {
  from {
    transform: translateY(-50px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.important-info {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 8px;
}

.info-badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: rgba(25, 118, 210, 0.1);
  color: #1976d2;
  padding: 6px 12px;
  border-radius: 20px;
  font-weight: 500;
}

.info-badge i {
  color: #1976d2;
}

.info-text {
  font-size: 0.95rem;
}

.info-preview {
  font-size: 0.9rem;
  color: #666;
  margin-left: 4px;
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.more-info {
  color: #1976d2;
  font-style: italic;
}

.info-badge:hover {
  background: rgba(25, 118, 210, 0.15);
  transform: translateY(-1px);
  transition: all 0.3s ease;
}

.btn-view {
  background-color: #4CAF50;
  color: white;
  border: none;
  padding: 6px 12px;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.9rem;
}

.btn-view:hover {
  background-color: #45a049;
}

.modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 8px;
  width: 90%;
  max-width: 800px;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-header {
  padding: 16px;
  border-bottom: 1px solid #eee;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-body {
  padding: 20px;
}

.detail-item {
  margin-bottom: 16px;
}

.detail-item label {
  font-weight: bold;
  color: #666;
  display: block;
  margin-bottom: 4px;
}

.details-text {
  white-space: pre-wrap;
  background: #f8f9fa;
  padding: 12px;
  border-radius: 4px;
}

.file-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.file-link {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #2196F3;
  text-decoration: none;
  padding: 4px 8px;
  background: #f8f9fa;
  border-radius: 4px;
}

.file-link:hover {
  background: #e3f2fd;
}

.image-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 16px;
  margin-top: 8px;
}

.image-item img {
  width: 100%;
  height: 150px;
  object-fit: cover;
  border-radius: 4px;
  cursor: pointer;
  transition: transform 0.2s;
}

.image-item img:hover {
  transform: scale(1.05);
}

.image-modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.9);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1100;
  cursor: pointer;
}

.image-modal img {
  max-width: 90%;
  max-height: 90vh;
  object-fit: contain;
}

.close-btn {
  background: none;
  border: none;
  color: #666;
  cursor: pointer;
  font-size: 1.2rem;
  padding: 4px;
}

.close-btn:hover {
  color: #333;
}

/* เพิ่ม style สำหรับ select */
select {
  width: 100%;
  padding: 12px 15px;
  border: 2px solid #e0e0e0;
  border-radius: 10px;
  font-size: 1rem;
  transition: all 0.3s ease;
  background-color: white;
}

select:focus {
  border-color: #1a237e;
  outline: none;
  box-shadow: 0 0 0 3px rgba(26,35,126,0.1);
}
</style> 