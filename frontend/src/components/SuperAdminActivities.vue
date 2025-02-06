<template>
  <div class="page-container">
    <!-- Header Section -->
    <div class="header-section">
      <div class="title">
        <div class="title-icon">
          <i class="fas fa-shield-alt"></i>
        </div>
        <div class="title-text">
          <h1>การจัดการกิจกรรมทั้งหมด</h1>
          <p>Super Admin Dashboard</p>
        </div>
      </div>

      <!-- Filter Section -->
      <div class="filter-section">
        <div class="filter-row">
          <div class="search-box">
            <i class="fas fa-search"></i>
            <input 
              type="text" 
              v-model="searchTerm"
              placeholder="ค้นหากิจกรรม..."
            >
          </div>
          <select v-model="selectedDepartment" class="filter-select">
            <option value="">เลือกแผนก</option>
            <option v-for="dept in departments" :key="dept.id" :value="dept.id">
              {{ dept.name }}
            </option>
          </select>
          <select v-model="selectedSystem" class="filter-select" @change="handleSystemChange">
            <option value="">เลือกระบบ</option>
            <option v-for="system in systems" :key="system.id" :value="system.id">
              {{ system.name_th }}
            </option>
          </select>
        </div>
      </div>
    </div>

    <!-- Content Section -->
    <div class="content-section">
      <div v-if="loading" class="loading">
        <i class="fas fa-spinner fa-spin"></i> กำลังโหลดข้อมูล...
      </div>
      
      <div v-else-if="error" class="error-message">
        <i class="fas fa-exclamation-circle"></i>
        {{ error }}
      </div>

      <div v-else>
        <div class="table-container">
          <table v-if="activities.length > 0">
            <thead>
              <tr>
                <th>ข้อมูลสำคัญ</th>
                <th>รายละเอียด</th>
                <th>ไฟล์/รูปภาพ</th>
                <th>ผู้บันทึก/แก้ไข</th>
                <th>วันที่</th>
                <th>การจัดการ</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="activity in filteredActivities" :key="activity.id">
                <!-- ข้อมูลสำคัญ -->
                <td>
                  <div class="importance-info">
                    <span :class="getImportanceClass(activity.important_info)">
                      {{ activity.important_info }}
                    </span>
                  </div>
                </td>

                <!-- รายละเอียด -->
                <td class="details-cell">
                  <div class="details-content">
                    {{ activity.details }}
                  </div>
                </td>

                <!-- ไฟล์และรูปภาพ -->
                <td>
                  <div class="attachments">
                    <!-- ไฟล์ -->
                    <div v-if="activity.file_paths" class="files">
                      <a v-for="file in getFiles(activity.file_paths)" 
                         :key="file.path"
                         :href="file.path"
                         target="_blank"
                         class="file-link">
                        <i :class="getFileIcon(file.path)"></i>
                      </a>
                    </div>
                    <!-- รูปภาพ -->
                    <div v-if="activity.image_paths" class="images">
                      <div v-for="image in getFiles(activity.image_paths)"
                           :key="image.path"
                           class="image-thumbnail"
                           @click="showFullImage(image.path)">
                        <img :src="image.path" :alt="image.name">
                      </div>
                    </div>
                  </div>
                </td>

                <!-- ผู้บันทึก/แก้ไข -->
                <td>
                  <div class="user-info">
                    <div class="created-by">
                      <i class="fas fa-user-edit"></i>
                      <span>{{ activity.first_name }} {{ activity.last_name }}</span>
                    </div>
                    <div v-if="activity.updated_by" class="updated-by">
                      <i class="fas fa-history"></i>
                      <span>แก้ไขโดย: {{ activity.updated_by }}</span>
                    </div>
                  </div>
                </td>

                <!-- วันที่ -->
                <td>
                  <div class="date-info">
                    <div class="created-date">
                      <i class="far fa-calendar-plus"></i>
                      <span>{{ formatDate(activity.created_at) }}</span>
                    </div>
                    <div v-if="activity.updated_at" class="updated-date">
                      <i class="far fa-calendar-check"></i>
                      <span>{{ formatDate(activity.updated_at) }}</span>
                    </div>
                  </div>
                </td>

                <!-- การจัดการ -->
                <td>
                  <div class="action-buttons">
                    <button @click="editActivity(activity)" class="btn-edit">
                      <i class="fas fa-edit"></i>
                    </button>
                    <button @click="deleteActivity(activity)" class="btn-delete">
                      <i class="fas fa-trash"></i>
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
          <div v-else class="no-data">
            <i class="fas fa-inbox"></i>
            <p>{{ searchTerm ? 'ไม่พบข้อมูลที่ค้นหา' : 'ไม่พบข้อมูลกิจกรรม' }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Edit Modal -->
    <div v-if="editingActivity" class="modal">
      <div class="modal-content">
        <div class="modal-header">
          <div class="modal-title">
            <i class="fas fa-edit"></i>
            <h2>แก้ไขกิจกรรม</h2>
          </div>
          <button @click="closeEditModal" class="btn-close">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label>ข้อมูลสำคัญ:</label>
            <select v-model="editingActivity.important_info" class="form-control">
              <option value="152">152</option>
              <option value="45">45</option>
              <option value="กิจกรรมที่ 1">กิจกรรมที่ 1</option>
              <option value="กิจกรรมที่ 2">กิจกรรมที่ 2</option>
            </select>
          </div>
          <div class="form-group">
            <label>รายละเอียด:</label>
            <textarea 
              v-model="editingActivity.details" 
              rows="4" 
              class="form-control"
              placeholder="กรอกรายละเอียด..."
            ></textarea>
          </div>
        </div>
        <div class="modal-footer">
          <button @click="closeEditModal" class="btn-cancel">
            <i class="fas fa-times"></i>
            ยกเลิก
          </button>
          <button @click="saveActivity" class="btn-save">
            <i class="fas fa-check"></i>
            บันทึก
          </button>
        </div>
      </div>
    </div>

    <!-- Modal แสดงรายละเอียด -->
    <div v-if="showModal" class="modal">
      <div class="modal-content">
        <div class="modal-header">
          <h2>รายละเอียดกิจกรรม</h2>
          <button class="close-btn" @click="closeModal">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="modal-body">
          <div class="detail-item">
            <label>วันที่บันทึก:</label>
            <span>{{ formatDate(selectedActivity.created_at) }}</span>
          </div>
          <div class="detail-item">
            <label>ระบบ:</label>
            <span>{{ selectedActivity.system_name }}</span>
          </div>
          <div class="detail-item">
            <label>ข้อมูลสำคัญ:</label>
            <span>{{ selectedActivity.important_info }}</span>
          </div>
          <div class="detail-item">
            <label>ผู้บันทึก:</label>
            <span>{{ selectedActivity.first_name }} {{ selectedActivity.last_name }}</span>
          </div>
          <div class="detail-item">
            <label>แผนก:</label>
            <span>{{ selectedActivity.dept_full }}</span>
          </div>
          <div class="detail-item">
            <label>รายละเอียด:</label>
            <p class="details-text">{{ selectedActivity.details }}</p>
          </div>

          <!-- แสดงไฟล์แนบ -->
          <div v-if="selectedActivity.file_paths" class="detail-item">
            <label>ไฟล์แนบ:</label>
            <div class="file-list">
              <a 
                v-for="(file, index) in getFiles(selectedActivity.file_paths)" 
                :key="index"
                :href="file.path"
                target="_blank"
                class="file-link"
              >
                <i class="fas fa-file-alt"></i>
                {{ file.name }}
              </a>
            </div>
          </div>

          <!-- แสดงรูปภาพ -->
          <div v-if="selectedActivity.image_paths" class="detail-item">
            <label>รูปภาพ:</label>
            <div class="image-grid">
              <div 
                v-for="(image, index) in getFiles(selectedActivity.image_paths)"
                :key="index"
                class="image-item"
              >
                <img :src="image.path" :alt="image.name" @click="showFullImage(image.path)">
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal แสดงรูปภาพเต็ม -->
    <div v-if="showImageModal" class="image-modal" @click="closeImageModal">
      <img :src="selectedImage" alt="Full size image">
    </div>
  </div>
</template>

<script>
import axios from 'axios';
import { useToast } from 'vue-toastification';

export default {
  name: 'SuperAdminActivities',
  
  setup() {
    const toast = useToast();
    return { toast }
  },

  data() {
    return {
      activities: [],
      systems: [],
      selectedSystem: '',
      searchTerm: '',
      loading: false,
      error: null,
      editingActivity: null,
      showModal: false,
      showImageModal: false,
      selectedActivity: null,
      selectedImage: null,
      departments: [],
      selectedDepartment: ''
    }
  },

  computed: {
    filteredActivities() {
      let filtered = [...this.activities];

      if (this.searchTerm) {
        const search = this.searchTerm.toLowerCase();
        filtered = filtered.filter(activity => 
          activity.details?.toLowerCase().includes(search) ||
          activity.important_info?.toLowerCase().includes(search) ||
          activity.first_name?.toLowerCase().includes(search) ||
          activity.last_name?.toLowerCase().includes(search)
        );
      }

      if (this.selectedSystem) {
        filtered = filtered.filter(activity => 
          activity.system_id === this.selectedSystem
        );
      }

      return filtered;
    },

    stats() {
      return [
        { title: 'กิจกรรมทั้งหมด', value: this.activities.length },
        { title: 'กิจกรรมสำคัญ', value: this.importantActivities.length },
        { title: 'ผู้บันทึกทั้งหมด', value: this.uniqueDepartments.length }
      ];
    }
  },

  methods: {
    async fetchSystems() {
      try {
        const response = await axios.get('http://localhost:8881/api/system-records');
        this.systems = response.data;
      } catch (error) {
        console.error('Error fetching systems:', error);
        this.toast.error('ไม่สามารถดึงข้อมูลระบบได้');
      }
    },

    async handleSystemChange() {
      await this.fetchActivities();
    },

    async fetchActivities() {
      this.loading = true;
      try {
        let url = 'http://localhost:8881/api/activities';
        const params = {};
        
        if (this.selectedSystem) {
          params.system_id = this.selectedSystem;
        }
        
        const response = await axios.get(url, { params });
        this.activities = response.data;
      } catch (error) {
        console.error('Error fetching activities:', error);
        this.error = 'ไม่สามารถดึงข้อมูลกิจกรรมได้';
      } finally {
        this.loading = false;
      }
    },

    formatDate(date) {
      if (!date) return '';
      try {
        const d = new Date(date);
        const year = d.getFullYear() + 543; // แปลงเป็น พ.ศ.
        const month = d.getMonth() + 1;
        const day = d.getDate();
        const hours = d.getHours().toString().padStart(2, '0');
        const minutes = d.getMinutes().toString().padStart(2, '0');
        return `${day}/${month}/${year} ${hours}:${minutes} น.`;
      } catch (error) {
        return 'Invalid Date';
      }
    },

    getFiles(paths) {
      if (!paths) return [];
      return paths.split(',').map(path => ({
        path: `http://localhost:8881${path}`,
        name: path.split('/').pop()
      }));
    },

    getFileIcon(path) {
      const ext = path.split('.').pop().toLowerCase();
      if (['jpg', 'jpeg', 'png', 'gif'].includes(ext)) return 'fas fa-image';
      if (['pdf'].includes(ext)) return 'fas fa-file-pdf';
      if (['doc', 'docx'].includes(ext)) return 'fas fa-file-word';
      return 'fas fa-file';
    },

    editActivity(activity) {
      this.editingActivity = { ...activity };
    },

    closeEditModal() {
      this.editingActivity = null;
    },

    async saveActivity() {
      try {
        await axios.put(`http://localhost:8881/api/activities/${this.editingActivity.id}`, {
          important_info: this.editingActivity.important_info,
          details: this.editingActivity.details
        });
        
        this.toast.success('บันทึกการแก้ไขสำเร็จ');
        await this.fetchActivities();
        this.closeEditModal();
      } catch (error) {
        console.error('Error:', error);
        this.toast.error('ไม่สามารถบันทึกการแก้ไขได้');
      }
    },

    async deleteActivity(activity) {
      if (!confirm('ต้องการลบกิจกรรมนี้ใช่หรือไม่?')) return;

      try {
        await axios.delete(`http://localhost:8881/api/activities/${activity.id}`);
        this.toast.success('ลบกิจกรรมสำเร็จ');
        await this.fetchActivities();
      } catch (error) {
        console.error('Error:', error);
        this.toast.error('ไม่สามารถลบกิจกรรมได้');
      }
    },

    getImportanceClass(importance) {
      if (!importance) return 'importance-normal';
      const text = importance.toLowerCase();
      if (text.includes('152')) return 'importance-high';
      if (text.includes('45')) return 'importance-medium';
      return 'importance-normal';
    },

    getStatCardStyle(index) {
      const gradients = [
        'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
        'linear-gradient(135deg, #f43f5e 0%, #e11d48 100%)',
        'linear-gradient(135deg, #10b981 0%, #059669 100%)'
      ];
      return {
        background: gradients[index]
      };
    },

    viewActivityDetails(activity) {
      this.selectedActivity = activity;
      this.showModal = true;
    },

    closeModal() {
      this.showModal = false;
      this.selectedActivity = null;
    },

    showFullImage(imagePath) {
      this.selectedImage = imagePath;
      this.showImageModal = true;
    },

    closeImageModal() {
      this.showImageModal = false;
      this.selectedImage = null;
    }
  },

  created() {
    this.fetchSystems();
    this.fetchActivities();
  }
}
</script>

<style scoped>
/* Container */
.page-container {
  padding: 30px;
  background: #f0f2f5;
  min-height: 100vh;
}

/* Header Section */
.header-section {
  background: white;
  padding: 30px;
  border-radius: 16px;
  box-shadow: 0 2px 20px rgba(0, 0, 0, 0.06);
  margin-bottom: 30px;
  border: 1px solid rgba(255, 255, 255, 0.8);
  animation: fadeIn 0.5s ease-out;
}

/* Title Section */
.title {
  display: flex;
  align-items: center;
  gap: 20px;
  margin-bottom: 30px;
  padding-bottom: 25px;
  border-bottom: 1px solid #eef2ff;
}

.title-icon {
  background: linear-gradient(135deg, #4f46e5 0%, #6366f1 100%);
  width: 60px;
  height: 60px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 10px 20px rgba(79, 70, 229, 0.15);
}

.title-icon i {
  font-size: 24px;
  color: white;
}

.title-text h1 {
  font-size: 24px;
  font-weight: 600;
  color: #1e293b;
  margin: 0;
  margin-bottom: 4px;
}

.title-text p {
  color: #64748b;
  margin: 0;
  font-size: 0.9rem;
}

/* Filter Section */
.filter-section {
  background: #f8fafc;
  padding: 20px;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  animation: fadeIn 0.5s ease-out 0.2s both;
}

.filter-row {
  display: flex;
  gap: 20px;
  align-items: center;
}

/* Search Box */
.search-box {
  flex: 2;
  position: relative;
}

.search-box i {
  position: absolute;
  left: 16px;
  top: 50%;
  transform: translateY(-50%);
  color: #64748b;
  font-size: 16px;
}

.search-box input {
  width: 100%;
  padding: 14px 14px 14px 45px;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  font-size: 0.95rem;
  transition: all 0.3s ease;
  background: white;
}

.search-box input:focus {
  border-color: #4f46e5;
  box-shadow: 0 0 0 4px rgba(79, 70, 229, 0.1);
  outline: none;
}

/* Select Boxes */
.filter-select {
  flex: 1;
  padding: 14px 16px;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  font-size: 0.95rem;
  color: #1e293b;
  background: white;
  cursor: pointer;
  transition: all 0.3s ease;
  min-width: 200px;
  -webkit-appearance: none;
  -moz-appearance: none;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%236b7280'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 16px center;
  background-size: 16px;
  padding-right: 45px;
}

.filter-select:hover {
  border-color: #4f46e5;
  background-color: #fafafa;
}

.filter-select:focus {
  border-color: #4f46e5;
  box-shadow: 0 0 0 4px rgba(79, 70, 229, 0.1);
  outline: none;
}

/* Custom Scrollbar */
::-webkit-scrollbar {
  width: 10px;
}

::-webkit-scrollbar-track {
  background: #f1f5f9;
  border-radius: 5px;
}

::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 5px;
  border: 2px solid #f1f5f9;
}

::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}

/* Hover Effects */
.filter-select option {
  padding: 12px;
  font-size: 0.95rem;
  background: white;
}

/* Animation */
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* ปรับแต่งตาราง */
.table-container {
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  border-radius: 24px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.7);
  overflow: hidden;
  margin-top: 25px;
  overflow-x: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
}

th {
  background: #f8f9fa;
  padding: 12px;
  text-align: left;
  font-weight: 600;
  color: #2c3e50;
}

td {
  padding: 12px;
  border-bottom: 1px solid #eee;
  vertical-align: top;
}

/* ข้อมูลสำคัญ */
.importance-info span {
  padding: 4px 12px;
  border-radius: 16px;
  font-size: 0.9rem;
  font-weight: 500;
}

/* รายละเอียด */
.details-cell {
  max-width: 300px;
}

.details-content {
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
  font-size: 0.95rem;
}

/* ไฟล์และรูปภาพ */
.attachments {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.file-link {
  color: #2196F3;
  font-size: 1.1rem;
}

.image-thumbnail {
  width: 40px;
  height: 40px;
  border-radius: 4px;
  overflow: hidden;
  cursor: pointer;
}

.image-thumbnail img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* ผู้บันทึก/แก้ไข */
.user-info {
  font-size: 0.9rem;
}

.created-by, .updated-by {
  display: flex;
  align-items: center;
  gap: 6px;
}

.updated-by {
  margin-top: 4px;
  color: #666;
  font-size: 0.85rem;
}

/* วันที่ */
.date-info {
  font-size: 0.9rem;
}

.created-date, .updated-date {
  display: flex;
  align-items: center;
  gap: 6px;
}

.updated-date {
  margin-top: 4px;
  color: #666;
  font-size: 0.85rem;
}

/* ปุ่มจัดการ */
.action-buttons {
  display: flex;
  gap: 8px;
}

.btn-edit, .btn-delete {
  padding: 6px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-edit {
  background: #e3f2fd;
  color: #1976d2;
}

.btn-delete {
  background: #ffebee;
  color: #d32f2f;
}

.btn-edit:hover {
  background: #bbdefb;
}

.btn-delete:hover {
  background: #ffcdd2;
}

/* ปรับแต่ง Loading และ Error */
.loading,
.error-message {
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  padding: 40px;
  border-radius: 24px;
  text-align: center;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.7);
}

.loading i {
  font-size: 30px;
  color: #4f46e5;
  margin-right: 15px;
}

.error-message {
  color: #dc2626;
}

/* ปรับแต่ง Stats Section */
.stats-section {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 25px;
  margin-bottom: 30px;
}

.stat-card {
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  padding: 25px;
  border-radius: 24px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.7);
  transition: all 0.3s ease;
  display: flex;
  gap: 20px;
  position: relative;
  overflow: hidden;
}

.stat-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: #4f46e5;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.stat-card:hover::before {
  opacity: 1;
}

.stat-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.08);
}

.stat-icon {
  width: 64px;
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 20px;
  background: linear-gradient(135deg, #4f46e5 0%, #6366f1 100%);
  box-shadow: 0 10px 20px rgba(79, 70, 229, 0.15);
}

.stat-icon.warning {
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
  box-shadow: 0 10px 20px rgba(245, 158, 11, 0.15);
}

.stat-icon.success {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  box-shadow: 0 10px 20px rgba(16, 185, 129, 0.15);
}

.stat-icon i {
  font-size: 24px;
  color: white;
}

.stat-info {
  flex: 1;
}

.stat-info h3 {
  color: #64748b;
  font-size: 0.9rem;
  font-weight: 500;
  margin: 0 0 8px 0;
}

.stat-info p {
  color: #1e293b;
  font-size: 32px;
  font-weight: 600;
  margin: 0 0 15px 0;
}

.stat-progress {
  height: 6px;
  background: #f1f5f9;
  border-radius: 3px;
  overflow: hidden;
}

.progress-bar {
  height: 100%;
  background: linear-gradient(to right, #4f46e5, #6366f1);
  border-radius: 3px;
  transition: width 0.5s ease;
}

.progress-bar.warning {
  background: linear-gradient(to right, #f59e0b, #d97706);
}

.progress-bar.success {
  background: linear-gradient(to right, #10b981, #059669);
}

/* เพิ่ม Animation */
@keyframes slideIn {
  from {
    transform: translateY(20px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.stat-card {
  animation: slideIn 0.5s ease forwards;
}

.stat-card:nth-child(1) { animation-delay: 0.1s; }
.stat-card:nth-child(2) { animation-delay: 0.2s; }
.stat-card:nth-child(3) { animation-delay: 0.3s; }

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
  backdrop-filter: blur(5px);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  animation: modalFadeIn 0.3s ease;
}

.modal-content {
  background: white;
  border-radius: 16px;
  width: 90%;
  max-width: 600px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
  animation: modalSlideIn 0.3s ease;
}

.modal-header {
  padding: 20px 24px;
  border-bottom: 1px solid #eef2ff;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-title {
  display: flex;
  align-items: center;
  gap: 12px;
}

.modal-title i {
  font-size: 24px;
  color: #4f46e5;
  background: #eef2ff;
  padding: 8px;
  border-radius: 8px;
}

.modal-title h2 {
  font-size: 20px;
  font-weight: 600;
  color: #1e293b;
  margin: 0;
}

.btn-close {
  background: none;
  border: none;
  color: #64748b;
  cursor: pointer;
  font-size: 20px;
  padding: 8px;
  border-radius: 8px;
  transition: all 0.2s;
}

.btn-close:hover {
  background: #f1f5f9;
  color: #1e293b;
}

.modal-body {
  padding: 24px;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  font-size: 0.95rem;
  font-weight: 500;
  color: #1e293b;
  margin-bottom: 8px;
}

.form-control {
  width: 100%;
  padding: 12px 16px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 0.95rem;
  color: #1e293b;
  background: white;
  transition: all 0.2s;
}

.form-control:focus {
  border-color: #4f46e5;
  box-shadow: 0 0 0 4px rgba(79, 70, 229, 0.1);
  outline: none;
}

textarea.form-control {
  resize: vertical;
  min-height: 120px;
}

.modal-footer {
  padding: 20px 24px;
  border-top: 1px solid #eef2ff;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.btn-cancel, .btn-save {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  border-radius: 8px;
  font-size: 0.95rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-cancel {
  background: #f1f5f9;
  color: #64748b;
  border: 1px solid #e2e8f0;
}

.btn-save {
  background: #4f46e5;
  color: white;
  border: none;
}

.btn-cancel:hover {
  background: #e2e8f0;
  color: #1e293b;
}

.btn-save:hover {
  background: #4338ca;
}

/* Modal Animations */
@keyframes modalFadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes modalSlideIn {
  from {
    transform: translateY(20px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
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
</style> 
