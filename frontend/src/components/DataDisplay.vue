<template>
  <div class="container">
    <div class="header">
      <h1>ระบบจัดการข้อมูล</h1>
    </div>

    <div class="controls">
      <div class="select-group">
        <label>ระบบงาน</label>
        <select v-model="selectedSystemId" @change="fetchSystemDetails">
          <option value="">-- กรุณาเลือกระบบงาน --</option>
          <option 
            v-for="system in systems" 
            :key="system.id" 
            :value="system.id"
            :disabled="!system.is_active"
          >
            {{ system.name_th }}-{{ system.name_en }}
            {{ !system.is_active ? '- ปิดใช้งาน' : '' }}
          </option>
        </select>
      </div>
      <div class="search-group">
        <label>ค้นหา</label>
        <input
          type="text"
          v-model="searchQuery"
          placeholder="ค้นหาจากข้อมูลสำคัญ, เลขที่อ้างอิง..."
          class="search-input"
        />
      </div>
    </div>

    <div class="details-container">
      <div class="table-wrapper">
        <table v-if="filteredDetails.length > 0" class="details-table">
          <thead>
            <tr>
              <th class="th-important">ข้อมูลสำคัญ</th>
              <th class="th-ref">เลขที่อ้างอิง</th>
              <th class="th-additional">ข้อมูลเพิ่มเติม</th>
              <th class="th-files">ไฟล์แนบ</th>
              <th class="th-date">วันที่สร้าง</th>
              <th class="th-actions"></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="detail in filteredDetails" :key="detail.id" :class="{ 'editing-row': detail.editing }">
              <td>
                <input
                  v-if="detail.editing"
                  v-model="detail.editedInfo.important_info"
                  type="text"
                  class="edit-input-same-cell"
                  :style="{ height: detail.editing ? '100%' : 'auto' }"
                  placeholder="ข้อมูลสำคัญ"
                />
                <span v-else class="cell-text">{{ detail.important_info }}</span>
              </td>
              <td>
                <input
                  v-if="detail.editing"
                  v-model="detail.editedInfo.reference_no"
                  type="text"
                  class="edit-input-same-cell"
                  :style="{ height: detail.editing ? '100%' : 'auto' }"
                  placeholder="เลขที่อ้างอิง"
                />
                <span v-else class="cell-text">{{ detail.reference_no }}</span>
              </td>
              <td>
                <input
                  v-if="detail.editing"
                  v-model="detail.editedInfo.additional_info"
                  type="text"
                  class="edit-input-same-cell"
                  :style="{ height: detail.editing ? '100%' : 'auto' }"
                  placeholder="ข้อมูลเพิ่มเติม"
                />
                <span v-else class="cell-text">{{ detail.additional_info || "-" }}</span>
              </td>
              <td>
                <div v-if="detail.editing" class="file-list">
                  <div class="edit-files-section">
                    <div class="file-upload-container">
                      <label class="file-upload-label">
                        <i class="fas fa-cloud-upload-alt"></i>
                        เลือกไฟล์แนบ
                        <input
                          type="file"
                          @change="handleFileChange($event, detail)"
                          multiple
                          class="file-input"
                          accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,.jpg,.jpeg,.png"
                        />
                      </label>
                    </div>
                    <div class="selected-files" v-if="detail.newFiles && detail.newFiles.length > 0">
                      <h4>ไฟล์ที่เลือกใหม่:</h4>
                      <div v-for="(file, index) in detail.newFiles" :key="index" class="file-item">
                        <span class="file-name">
                          <i class="fas fa-file"></i>
                          {{ file.name }}
                        </span>
                        <button 
                          @click="removeNewFile(detail, index)"
                          class="delete-file-btn"
                          title="ลบไฟล์"
                        >
                          <i class="fas fa-times"></i>
                        </button>
                      </div>
                    </div>
                    <div class="current-files" v-if="detail.file_path">
                      <h4>ไฟล์ที่มีอยู่:</h4>
                      <div v-for="(filePath, fileIndex) in detail.file_path.split(',')"
                        :key="filePath"
                        class="file-item">
                        <a
                          :href="`http://localhost:8088${filePath}`"
                          target="_blank"
                          class="file-link"
                        >
                          <i class="fas fa-file-alt"></i>
                          {{ getFileName(filePath) }}
                        </a>
                        <button 
                          @click="deleteFile(detail, fileIndex)"
                          class="delete-file-btn"
                          title="ลบไฟล์"
                        >
                          <i class="fas fa-times"></i>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
                <div v-else class="file-list">
                  <template v-if="detail.file_path">
                    <div v-for="(filePath, fileIndex) in detail.file_path.split(',')"
                      :key="filePath"
                      class="file-item">
                      <a
                        :href="`http://localhost:8088${filePath}`"
                        target="_blank"
                        class="file-link"
                      >
                        <i class="fas fa-file-alt"></i>
                        {{ getFileName(filePath) }}
                      </a>
                    </div>
                  </template>
                  <div v-else class="no-files">ไม่มีไฟล์แนบ</div>
                </div>
              </td>
              <td>{{ formatDate(detail.created_at) }}</td>
              <td class="action-column">
                <div class="action-buttons">
                  <template v-if="!detail.editing">
                    <button @click="startEditing(detail)" class="edit-btn">
                      <i class="fas fa-edit"></i>
                    </button>
                    <button @click="confirmDeletePrompt(detail)" class="delete-btn">
                      <i class="fas fa-trash"></i>
                    </button>
                  </template>
                  <template v-else>
                    <button @click="saveChanges(detail)" class="save-btn">
                      <i class="fas fa-save"></i>
                    </button>
                    <button @click="cancelEditing(detail)" class="cancel-btn">
                      <i class="fas fa-times"></i>
                    </button>
                  </template>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
        <div v-else-if="selectedSystemId" class="no-data">ไม่พบข้อมูล</div>
      </div>
    </div>

    <div class="modal-overlay" v-if="showDeleteModal">
      <div class="modal-card delete-modal">
        <div class="modal-header delete">
          <h3><i class="fas fa-exclamation-triangle"></i> ยืนยันการลบ</h3>
          <button class="close-btn" @click="closeModal">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="modal-body">
          <div class="delete-content">
            <p>คุณต้องการลบข้อมูล "<span>{{ selectedDetail?.important_info }}</span>" ใช่หรือไม่?</p>
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
  </div>
</template>

<script>
import axios from "axios";
import { useToast } from "vue-toastification";
import { mapGetters } from 'vuex';

export default {
  name: 'DataDisplay',
  setup() {
    const toast = useToast();
    return { toast }
  },
  data() {
    return {
      systems: [],
      selectedSystemId: "",
      systemDetails: [],
      searchQuery: "",
      loading: false,
      error: null,
      showDeleteModal: false,
      selectedDetail: null,
    };
  },
  computed: {
    ...mapGetters(['getUserDepartment']),
    filteredDetails() {
      if (!this.searchQuery) return this.systemDetails;

      const query = this.searchQuery.toLowerCase();
      return this.systemDetails.filter(
        (detail) =>
          detail.important_info.toLowerCase().includes(query) ||
          detail.reference_no.toLowerCase().includes(query) ||
          (detail.additional_info &&
            detail.additional_info.toLowerCase().includes(query))
      );
    },
  },
  methods: {
    async fetchSystems() {
      this.loading = true;
      try {
        const response = await axios.get("http://localhost:8088/api/system-records");
        // กรองเฉพาะระบบของแผนกตัวเอง
        this.systems = response.data.filter(system => 
          system.is_active === 1 && 
          system.dept_change_code === this.getUserDepartment?.dept_change_code
        );
      } catch (error) {
        console.error("Error fetching systems:", error);
        this.toast.error("ไม่สามารถดึงข้อมูลระบบได้");
      } finally {
        this.loading = false;
      }
    },
    async fetchSystemDetails() {
      if (!this.selectedSystemId) return;
      
      this.loading = true;
      try {
        console.log('Fetching details for system:', this.selectedSystemId);
        
        const selectedSystem = this.systems.find(
          system => system.id === parseInt(this.selectedSystemId)
        );
        
        if (!selectedSystem?.is_active) {
          this.toast.error("ระบบนี้ถูกปิดการใช้งาน");
          this.selectedSystemId = '';
          this.systemDetails = [];
          return;
        }

        const response = await axios.get(
          `http://localhost:8088/api/system-details/${this.selectedSystemId}`
        );
        console.log('Response:', response.data);
        
        if (response.data) {
          this.systemDetails = response.data;
        }
      } catch (error) {
        console.error("Error fetching system details:", error);
        this.toast.error("ไม่สามารถดึงข้อมูลระบบได้");
      } finally {
        this.loading = false;
      }
    },
    startEditing(detail) {
      detail.editing = true;
      detail.editedInfo = {
        important_info: detail.important_info,
        reference_no: detail.reference_no,
        additional_info: detail.additional_info,
      };
    },
    async saveChanges(detail) {
      try {
        // Validate input
        if (!detail.editedInfo.important_info?.trim()) {
          this.toast.error("กรุณากรอกข้อมูลสำคัญ");
          return;
        }

        if (!detail.editedInfo.reference_no?.trim()) {
          this.toast.error("กรุณากรอกเลขที่อ้างอิง");
          return;
        }

        const formData = new FormData();
        formData.append("systemId", this.selectedSystemId);
        formData.append("importantInfo", detail.editedInfo.important_info);
        formData.append("referenceNo", detail.editedInfo.reference_no);
        formData.append("additionalInfo", detail.editedInfo.additional_info || "");
        
        // Handle file upload - only keep the latest file
        if (detail.newFiles && detail.newFiles.length > 0) {
          for (const file of detail.newFiles) {
            if (file.size > 10 * 1024 * 1024) { // 10MB limit
              this.toast.error(`ไฟล์ ${file.name} มีขนาดใหญ่เกินไป (ไม่เกิน 10MB)`);
              return;
            }
            formData.append("files", file);
          }
        }

        // If there are existing files and no new files are being added, keep the existing file path
        if (detail.file_path && (!detail.newFiles || detail.newFiles.length === 0)) {
          formData.append("existingFiles", detail.file_path);
        }

        // Send update request
        const response = await axios.put(
          `http://localhost:8088/api/system-details/${detail.id}`,
          formData,
          {
            headers: { 
              "Content-Type": "multipart/form-data"
            },
            timeout: 30000 // 30 seconds timeout
          }
        );

        if (response.data.success) {
          // Update local state
          detail.important_info = detail.editedInfo.important_info;
          detail.reference_no = detail.editedInfo.reference_no;
          detail.additional_info = detail.editedInfo.additional_info;
          detail.file_path = response.data.file_path;
          
          detail.editing = false;
          detail.newFiles = [];
          
          this.toast.success("บันทึกการแก้ไขสำเร็จ");
          
          // Refresh data
          await this.fetchSystemDetails();
        } else {
          throw new Error(response.data.message || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล');
        }
      } catch (error) {
        console.error("Error saving changes:", error);
        this.toast.error(error.response?.data?.message || "ไม่สามารถบันทึกการแก้ไขได้");
      }
    },
    cancelEditing(detail) {
      detail.editing = false;
      detail.newFiles = [];
    },
    handleFileChange(event, detail) {
      const files = Array.from(event.target.files);
      let validFiles = [];
      
      for (const file of files) {
        if (file.size > 10 * 1024 * 1024) { // 10MB limit
          this.toast.error(`ไฟล์ ${file.name} มีขนาดใหญ่เกินไป (ไม่เกิน 10MB)`);
          continue;
        }
        validFiles.push(file);
      }
      
      if (!detail.newFiles) {
        detail.newFiles = [];
      }
      detail.newFiles.push(...validFiles);
    },
    formatDate(dateString) {
      return new Date(dateString).toLocaleString("th-TH");
    },
    getFileName(filePath) {
      if (!filePath) return "";
      try {
        const parts = filePath.split("/");
        const filename = parts[parts.length - 1];
        // Split on the first hyphen only to separate timestamp from filename
        const firstHyphenIndex = filename.indexOf('-');
        if (firstHyphenIndex === -1) return filename;
        // Return everything after the first hyphen
        return filename.substring(firstHyphenIndex + 1);
      } catch (error) {
        console.error("Error getting filename:", error);
        return "Unknown file";
      }
    },
    confirmDeletePrompt(detail) {
      this.selectedDetail = detail;
      this.showDeleteModal = true;
    },
    
    async confirmDelete() {
      try {
        if (!this.selectedDetail) {
          this.toast.error('ไม่พบข้อมูลที่ต้องการลบ');
          return;
        }
        
        const response = await axios.delete(
          `http://localhost:8088/api/system-details/${this.selectedDetail.id}`
        );

        if (response.data.success) {
          this.systemDetails = this.systemDetails.filter(
            detail => detail.id !== this.selectedDetail.id
          );
          this.toast.success('ลบข้อมูลสำเร็จ');
          this.closeModal();
        } else {
          throw new Error(response.data.message || 'ไม่สามารถลบข้อมูลได้');
        }
      } catch (error) {
        console.error('Error deleting detail:', error);
        this.toast.error(error.response?.data?.message || 'ไม่สามารถลบข้อมูลได้');
      }
      this.showDeleteModal = false;
      this.selectedDetail = null;
    },

    closeModal() {
      this.showDeleteModal = false;
      this.selectedDetail = null;
    },

    async deleteFile(detail, fileIndex) {
      if (!confirm('คุณต้องการลบไฟล์นี้ใช่หรือไม่?')) {
        return;
      }

      const filePaths = detail.file_path.split(',');
      filePaths.splice(fileIndex, 1);
      detail.file_path = filePaths.join(',');
    },
    removeNewFile(detail, index) {
      detail.newFiles.splice(index, 1);
    }
  },
  watch: {
    selectedSystemId(newVal) {
      if (newVal) {
        const selectedSystem = this.systems.find(
          system => system.id === parseInt(newVal)
        );
        if (selectedSystem?.is_active) {
          this.fetchSystemDetails();
        } else {
          this.selectedSystemId = '';
          this.systemDetails = [];
          this.toast.error("ระบบนี้ถูกปิดการใช้งาน");
        }
      } else {
        this.systemDetails = [];
      }
    }
  },
  async created() {
    await this.fetchSystems();
    if (this.selectedSystemId) {
      const selectedSystem = this.systems.find(
        system => system.id === parseInt(this.selectedSystemId)
      );
      if (selectedSystem?.is_active) {
        await this.fetchSystemDetails();
      } else {
        this.selectedSystemId = '';
        this.systemDetails = [];
      }
    }
  },
};
</script>

<style scoped>
.container {
  max-width: 1200px;
  margin: 20px auto;
  padding: 30px;
  background-color: #ffffff;
  border-radius: 15px;
  box-shadow: 0 0 20px rgba(0, 0, 0, 0.05);
}

.header {
  margin-bottom: 30px;
}

.header h1 {
  color: #2c3e50;
  font-size: 28px;
  font-weight: 600;
  text-align: center;
  margin-bottom: 10px;
}

.controls {
  display: flex;
  gap: 20px;
  margin-bottom: 30px;
  padding: 20px;
  background: #f8f9fa;
  border-radius: 10px;
  align-items: flex-end;
}

.select-group, .search-group {
  flex: 1;
}

.select-group label, .search-group label {
  display: block;
  margin-bottom: 8px;
  color: #2c3e50;
  font-weight: 500;
  font-size: 14px;
}

select, .search-input {
  width: 100%;
  padding: 12px 15px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  font-size: 14px;
  color: #2c3e50;
  background-color: white;
  transition: all 0.3s ease;
}

select:focus, .search-input:focus {
  border-color: #3498db;
  box-shadow: 0 0 0 2px rgba(52, 152, 219, 0.1);
  outline: none;
}

.table-wrapper {
  overflow-x: auto;
  background: white;
  border-radius: 10px;
  box-shadow: 0 0 15px rgba(0, 0, 0, 0.05);
}

.details-table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  background: white;
}

.details-table th {
  background: #f8f9fa;
  color: #2c3e50;
  font-weight: 600;
  padding: 15px;
  text-align: left;
  border-bottom: 2px solid #e0e0e0;
  white-space: nowrap;
}

.details-table td {
  padding: 15px;
  border-bottom: 1px solid #e0e0e0;
  color: #2c3e50;
  vertical-align: top;
  min-width: 150px;
}

.th-important { width: 25%; }
.th-ref { width: 20%; }
.th-additional { width: 30%; }
.th-files { width: 15%; }
.th-date { width: 10%; }
.th-actions { width: 100px; }

.action-buttons {
  display: flex;
  gap: 8px;
  justify-content: center;
}

.action-buttons button {
  width: 32px;
  height: 32px;
  margin: 0 2px;
  border: none;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
}

.edit-btn {
  background-color: #3498db;
  color: white;
}

.delete-btn {
  background-color: #e74c3c;
  color: white;
}

.save-btn {
  background-color: #2ecc71;
  color: white;
}

.cancel-btn {
  background-color: #95a5a6;
  color: white;
}

.action-buttons button:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
}

.file-list {
  padding: 4px 0;
}

.file-link {
  margin: 4px 0;
  padding: 6px 10px;
  display: inline-flex;
  align-items: center;
  text-decoration: none;
  color: #2c3e50;
  transition: all 0.2s ease;
}

.file-link:hover {
  background: #e9ecef;
}

.file-link i {
  margin-right: 8px;
  color: #3498db;
}

.edit-input-same-cell {
  width: 100%;
  height: 100%;
  padding: 8px;
  margin: 0;
  border: none;
  background: transparent;
  font-size: inherit;
  color: inherit;
  font-family: inherit;
}

.edit-input-same-cell:focus {
  outline: 2px solid #3498db;
  background-color: white;
}

.cell-text {
  display: block;
  padding: 8px;
}

.editing-row td {
  padding: 0 !important;
  background-color: rgba(52, 152, 219, 0.05);
}

td {
  position: relative;
  height: 45px;
  transition: all 0.2s ease;
}

.details-table td {
  vertical-align: middle;
}

.no-files {
  color: #666;
  font-style: italic;
  padding: 8px 0;
}

@media (max-width: 1024px) {
  .container {
    padding: 20px;
    margin: 10px;
  }

  .controls {
    flex-direction: column;
    gap: 15px;
  }

  .select-group, .search-group {
    width: 100%;
  }
}

@media (max-width: 768px) {
  .table-wrapper {
    overflow-x: auto;
  }

  .details-table {
    min-width: 800px;
  }
}

.no-data {
  text-align: center;
  padding: 40px;
  color: #666;
  font-size: 16px;
  background: #f8f9fa;
  border-radius: 10px;
}

.btn.delete {
  background-color: transparent;
  color: #dc3545;
  border: none;
  padding: 5px 10px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn.delete:hover {
  background-color: rgba(220, 53, 69, 0.1);
  transform: translateY(-1px);
}

.editing-row {
  background-color: #f8f9fa !important;
}

.editing-row td {
  padding: 8px 15px !important;
}

.details-table td {
  transition: all 0.3s ease;
  padding: 12px 15px;
  vertical-align: middle;
}

.file-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 8px;
}

.file-item:last-child {
  margin-bottom: 0;
}

.delete-file-btn {
  background: #fee2e2;
  color: #ef4444;
  border: none;
  border-radius: 4px;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
}

.delete-file-btn:hover {
  background: #ef4444;
  color: white;
}

.edit-files-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.current-files {
  margin-top: 10px;
  padding: 8px;
  background: #f8f9fa;
  border-radius: 6px;
}

.file-input {
  padding: 8px;
  border: 1px dashed #e0e0e0;
  border-radius: 6px;
  width: 100%;
}

.file-input:hover {
  border-color: #3498db;
}

.file-upload-container {
  margin-bottom: 15px;
}

.file-upload-label {
  display: inline-block;
  padding: 10px 20px;
  background-color: #3498db;
  color: white;
  border-radius: 5px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.file-upload-label:hover {
  background-color: #2980b9;
}

.file-upload-label i {
  margin-right: 8px;
}

.file-input {
  display: none;
}

.selected-files {
  margin: 15px 0;
  padding: 10px;
  background: #f8f9fa;
  border-radius: 5px;
}

.selected-files h4, .current-files h4 {
  margin: 0 0 10px 0;
  font-size: 14px;
  color: #2c3e50;
}

.file-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px;
  background: white;
  border-radius: 4px;
  margin-bottom: 5px;
}

.file-name {
  display: flex;
  align-items: center;
  gap: 8px;
}

.file-name i {
  color: #3498db;
}

.delete-file-btn {
  background: #fee2e2;
  color: #ef4444;
  border: none;
  border-radius: 4px;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
}

.delete-file-btn:hover {
  background: #ef4444;
  color: white;
}

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

.modal-actions {
  display: flex;
  justify-content: center;
  gap: 12px;
  margin-top: 25px;
}

.cancel-btn, .delete-btn {
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

.delete-btn {
  background: linear-gradient(135deg, #c62828, #d32f2f);
  color: white;
}

.modal-actions button:hover {
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(0,0,0,0.1);
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
</style>
