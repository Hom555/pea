<template>
  <div class="page-container">
    <!-- Header Section -->
    <div class="page-header">
      <h1>บันทึกกิจกรรม</h1>
      <p class="subtitle">บันทึกและติดตามกิจกรรมการดำเนินงานของระบบ</p>
    </div>

    <div class="content-wrapper">
      <!-- Form Section -->
      <div class="form-section">
        <form @submit.prevent="submitForm" class="activity-form">
          <div class="form-header">
            <i class="fas fa-edit"></i>
            <span>แบบฟอร์มบันทึกกิจกรรม</span>
          </div>

          <div class="form-grid">
            <!-- System Selection -->
            <div class="form-group">
              <label>
                <i class="fas fa-server"></i>
                ระบบงาน
              </label>
              <select
                v-model="selectedSystemId"
                @change="fetchImportantInfo"
                :class="{ error: isSubmitted && !selectedSystemId }"
              >
                <option value="">-- เลือกระบบงาน --</option>
                <option
                  v-for="system in systemList"
                  :key="system.id"
                  :value="system.id"
                >
                  {{ system.name_th }}-{{ system.name_en }}

                </option>
              </select>
            </div>

            <!-- Important Info Selection -->
            <div class="form-group">
              <label>
                <i class="fas fa-info-circle"></i>
                ข้อมูลสำคัญ
              </label>
              <select
                v-model="importantInfo"
                :class="{ error: isSubmitted && !importantInfo }"
              >
                <option value="">-- เลือกข้อมูลสำคัญ --</option>
                <option
                  v-for="info in importantInfoList"
                  :key="info.id"
                  :value="info.id"
                >
                  {{ info.important_info }}
                </option>
              </select>
            </div>
          </div>

          <!-- Details Input -->
          <div class="form-group">
            <label>
              <i class="fas fa-align-left"></i>
              รายละเอียด
            </label>
            <textarea
              v-model="details"
              :class="{ error: isSubmitted && !details }"
              placeholder="กรอกรายละเอียดกิจกรรมที่ดำเนินการ..."
              rows="4"
            ></textarea>
          </div>

          <!-- File Upload Section -->
          <div class="upload-grid">
            <div class="upload-section">
              <label>
                <i class="fas fa-file-upload"></i>
                เอกสารแนบ
              </label>
              <div
                class="upload-area"
                @drop.prevent="handleFileDrop"
                @dragover.prevent
                @click="$refs.fileInput.click()"
              >
                <input
                  ref="fileInput"
                  type="file"
                  multiple
                  @change="handleFileUpload"
                  accept=".pdf,.doc,.docx,.xls,.xlsx"
                  class="hidden"
                />
                <div class="upload-placeholder">
                  <i class="fas fa-file"></i>
                  <span>คลิกหรือลากไฟล์มาวางที่นี่</span>
                  <small>รองรับไฟล์ PDF, DOCX, XLSX (ไม่เกิน 10MB)</small>
                </div>
              </div>
              <!-- File Preview -->
              <div class="file-preview" v-if="files.length > 0">
                <div v-for="(file, index) in files" :key="index" class="preview-item">
                  <div class="file-info">
                    <i :class="getFileIcon(file.name)"></i>
                    <span class="file-name">{{ file.name }}</span>
                    <span class="file-size">({{ formatFileSize(file.size) }})</span>
                  </div>
                  <button @click.prevent="removeFile(index)" class="remove-btn">
                    <i class="fas fa-times"></i>
                  </button>
                </div>
              </div>
            </div>

            <!-- Image Upload -->
            <div class="upload-section">
              <label>
                <i class="fas fa-images"></i>
                รูปภาพ
              </label>
              <div
                class="upload-area"
                @drop.prevent="handleImageDrop"
                @dragover.prevent
                @click="$refs.imageInput.click()"
              >
                <input
                  ref="imageInput"
                  type="file"
                  multiple
                  @change="handleImageUpload"
                  accept="image/*"
                  class="hidden"
                />
                <div class="upload-placeholder">
                  <i class="fas fa-image"></i>
                  <span>คลิกหรือลากรูปภาพมาวางที่นี่</span>
                  <small>รองรับไฟล์ JPG, PNG (ไม่เกิน 5MB)</small>
                </div>
              </div>
              <!-- Image Preview -->
              <div class="image-preview" v-if="images.length > 0">
                <div v-for="(image, index) in images" :key="index" class="preview-item">
                  <img :src="getImagePreviewUrl(image)" alt="Preview" />
                  <button @click.prevent="removeImage(index)" class="remove-btn">
                    <i class="fas fa-times"></i>
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Form Actions -->
          <div class="form-actions">
            <button type="button" @click="resetForm" class="btn-secondary" :disabled="isSubmitting">
              <i class="fas fa-redo"></i>
              ล้างฟอร์ม
            </button>
            <button type="submit" class="btn-submit" :disabled="isSubmitting">
              <i :class="isSubmitting ? 'fas fa-spinner fa-spin' : 'fas fa-save'"></i>
              {{ isSubmitting ? 'กำลังบันทึก...' : 'บันทึกกิจกรรม' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script>
import axios from "axios";
import { useToast } from 'vue-toastification';
import { mapGetters } from 'vuex';

export default {
  setup() {
    const toast = useToast();
    return { toast }
  },
  data() {
    return {
      systemList: [],
      selectedSystemId: "",
      importantInfo: "",
      importantInfoList: [],
      details: "",
      files: [],
      images: [],
      isSubmitted: false,
      activities: [],
      deptInfo: null,
      isSubmitting: false
    };
  },
  computed: {
    ...mapGetters(['getUserDepartment']),
  },
  methods: {
    async fetchDeptInfo() {
      try {
        // เรียก API เพื่อดึงข้อมูลแผนก
        const response = await axios.get("http://localhost:8088/api/check-connection");

        if (response.data.success) {
          this.deptInfo = {
            dept_change_code: response.data.user.dept_change_code,
            dept_full: response.data.user.dept_full
          };
          await this.fetchSystems();
        } else {
          this.toast.error("ไม่สามารถดึงข้อมูลแผนกได้");
        }
      } catch (error) {
        console.error("Error in fetchDeptInfo:", error);
        this.toast.error("ไม่สามารถดึงข้อมูลแผนกได้ กรุณาลองใหม่อีกครั้ง");
      }
    },

    async fetchSystems() {
      try {
        const response = await axios.get("http://localhost:8088/api/system-records");
        console.log('Systems API Response:', response.data);
        
        // กรองระบบตามแผนก
        if (this.deptInfo) {
          this.systemList = response.data.filter(
            system => system.is_active === 1 && 
            system.dept_change_code === this.deptInfo.dept_change_code
          );
          
          if (this.systemList.length === 0) {
            this.toast.info("ไม่พบระบบที่เกี่ยวข้องกับแผนกของคุณ");
          }
        } else {
          this.toast.error("ไม่พบข้อมูลแผนก");
        }
      } catch (error) {
        console.error("Error fetching systems:", error);
        this.toast.error("ไม่สามารถดึงข้อมูลระบบได้");
      }
    },

    async fetchImportantInfo() {
      if (!this.selectedSystemId) {
        this.importantInfoList = [];
        return;
      }

      try {
        console.log('Fetching important info for system:', this.selectedSystemId);
        
        const response = await axios.get(
          `http://localhost:8088/api/system-details/${this.selectedSystemId}`
        );

        console.log('Important Info API Response:', response.data);

        const system = this.systemList.find(s => s.id === parseInt(this.selectedSystemId));
        if (!system?.is_active) {
          this.toast.error('ระบบนี้ถูกปิดการใช้งาน');
          this.selectedSystemId = '';
          this.importantInfoList = [];
          return;
        }

        if (response.data && response.data.length > 0) {
          this.importantInfoList = response.data;
        } else {
          this.importantInfoList = [];
          this.toast.info('ไม่พบข้อมูลสำคัญสำหรับระบบนี้');
        }
      } catch (error) {
        // console.error('Error fetching important info:', error);
        // this.toast.error('ไม่สามารถดึงข้อมูลสำคัญได้');
        this.importantInfoList = [];
      }
    },
    handleFileUpload(event) {
      const files = Array.from(event.target.files);
      this.addFiles(files);
    },
    handleFileDrop(event) {
      const files = Array.from(event.dataTransfer.files);
      this.addFiles(files);
    },
    addFiles(files) {
      for (const file of files) {
        // ตรวจสอบนามสกุลไฟล์
        const extension = file.name.split('.').pop().toLowerCase();
        const allowedTypes = ['pdf', 'doc', 'docx', 'xls', 'xlsx'];
        
        if (!allowedTypes.includes(extension)) {
          this.toast.error(`ไฟล์ ${file.name} ไม่ได้รับการสนับสนุน`);
          continue;
        }

        // ตรวจสอบขนาดไฟล์ (10MB)
        if (file.size > 10 * 1024 * 1024) {
          this.toast.error(`ไฟล์ ${file.name} มีขนาดใหญ่เกินไป (ไม่เกิน 10MB)`);
          continue;
        }

        this.files.push(file);
      }
    },
    handleImageUpload(event) {
      const files = Array.from(event.target.files);
      this.addImages(files);
    },
    handleImageDrop(event) {
      const files = Array.from(event.dataTransfer.files);
      this.addImages(files);
    },
    addImages(files) {
      for (const file of files) {
        // ตรวจสอบว่าเป็นรูปภาพหรือไม่
        if (!file.type.startsWith('image/')) {
          this.toast.error(`ไฟล์ ${file.name} ไม่ใช่รูปภาพ`);
          continue;
        }

        // ตรวจสอบขนาดไฟล์ (5MB)
        if (file.size > 5 * 1024 * 1024) {
          this.toast.error(`รูปภาพ ${file.name} มีขนาดใหญ่เกินไป (ไม่เกิน 5MB)`);
          continue;
        }

        this.images.push(file);
      }
    },
    removeFile(index) {
      this.files.splice(index, 1);
    },
    removeImage(index) {
      if (this.images[index]) {
        URL.revokeObjectURL(this.getImagePreviewUrl(this.images[index]));
        this.images.splice(index, 1);
      }
    },
    getFileIcon(fileName) {
      const extension = fileName.split('.').pop().toLowerCase();
      switch (extension) {
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
      if (bytes === 0) return '0 Bytes';
      const k = 1024;
      const sizes = ['Bytes', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    },
    getImagePreviewUrl(image) {
      try {
        return image ? URL.createObjectURL(image) : "";
      } catch (error) {
        console.error("Error creating image URL:", error);
        return "";
      }
    },
    async submitForm() {
      if (this.isSubmitting) {
        return;
      }

      this.isSubmitted = true;

      // Validate required fields
      if (!this.selectedSystemId || !this.details?.trim() || !this.importantInfo) {
        this.toast.error("กรุณากรอกข้อมูลให้ครบถ้วน");
        return;
      }

      try {
        this.isSubmitting = true;
        console.log('Submitting form with data:', {
          systemId: this.selectedSystemId,
          importantInfo: this.importantInfo,
          details: this.details,
          deptInfo: this.deptInfo
        });

        const formData = new FormData();
        formData.append('system_id', this.selectedSystemId);
        formData.append('details', this.details.trim());
        formData.append('important_info', this.importantInfo);
        
        // เพิ่มข้อมูลแผนก
        if (!this.deptInfo?.dept_change_code || !this.deptInfo?.dept_full) {
          this.toast.error('ไม่พบข้อมูลแผนก กรุณาเข้าสู่ระบบใหม่');
          this.isSubmitting = false;
          return;
        }

        formData.append('dept_change_code', this.deptInfo.dept_change_code);
        formData.append('dept_full', this.deptInfo.dept_full);

        // Add files
        if (this.files && this.files.length > 0) {
          for (let i = 0; i < this.files.length; i++) {
            const file = this.files[i];
            if (file.size > 10 * 1024 * 1024) { // 10MB limit
              this.toast.error(`ไฟล์ ${file.name} มีขนาดใหญ่เกินไป (ไม่เกิน 10MB)`);
              this.isSubmitting = false;
              return;
            }
            formData.append('files[]', file);
          }
        }

        // Add images
        if (this.images && this.images.length > 0) {
          for (let i = 0; i < this.images.length; i++) {
            const image = this.images[i];
            if (image.size > 5 * 1024 * 1024) { // 5MB limit
              this.toast.error(`รูปภาพ ${image.name} มีขนาดใหญ่เกินไป (ไม่เกิน 5MB)`);
              this.isSubmitting = false;
              return;
            }
            formData.append('images[]', image);
          }
        }

        // ดึง emp_id จาก localStorage
        const userData = JSON.parse(localStorage.getItem('userData'));
        if (userData?.emp_id) {
          formData.append('created_by', userData.emp_id);
        }

        console.log('Sending request to server...');
        const response = await axios.post(
          'http://localhost:8088/api/activities',
          formData,
          {
            headers: {
              'Content-Type': 'multipart/form-data'
            }
          }
        );

        console.log('Server response:', response.data);

        if (response.data.status === 'success') {
          this.toast.success('บันทึกข้อมูลสำเร็จ');
          this.resetForm();
          this.$emit('activity-added');
        } else {
          throw new Error(response.data.message || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล');
        }
      } catch (error) {
        console.error('Error submitting form:', error);
        if (error.code === 'ECONNABORTED') {
          this.toast.error("การเชื่อมต่อกับเซิร์ฟเวอร์หมดเวลา กรุณาลองใหม่อีกครั้ง");
        } else {
          this.toast.error(error.response?.data?.message || "เกิดข้อผิดพลาดในการบันทึกข้อมูล");
        }
      } finally {
        this.isSubmitting = false;
      }
    },
    resetForm() {
      this.selectedSystemId = "";
      this.importantInfo = "";
      this.details = "";
      this.files = [];
      this.images = [];
      this.importantInfoList = [];
      this.isSubmitted = false;
     
    },
    async fetchActivities() {
      if (!this.selectedSystemId || !this.importantInfo) {
        console.log('Missing required params:', { 
          systemId: this.selectedSystemId, 
          infoId: this.importantInfo 
        });
        return;
      }

      try {
        console.log('Fetching activities for:', {
          systemId: this.selectedSystemId,
          infoId: this.importantInfo
        });

        const response = await axios.get(
          `http://localhost:8088/api/activities/${this.selectedSystemId}/${this.importantInfo}`
        );
        
        console.log('API Response:', response.data);
        
        if (response.data) {
          this.activities = response.data;
        } else {
          this.activities = [];
          this.toast.info('ยังไม่มีข้อมูลกิจกรรม');
        }

      } catch (error) {
        console.error('Error fetching activities:', error);
        if (error.response) {
          console.error('Error response:', error.response.data);
          this.toast.error(error.response.data.message || 'ไม่สามารถดึงข้อมูลกิจกรรมได้');
        } else {
          this.toast.error('ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์');
        }
        this.activities = [];
      }
    },
    formatDate(dateString) {
      return new Date(dateString).toLocaleString("th-TH");
    },
    getFileName(filePath) {
      if (!filePath) return "";
      const parts = filePath.split("/");
      return parts[parts.length - 1];
    },
  },
  watch: {
    importantInfo() {
      this.fetchActivities();
    },
  },
  async mounted() {
    await this.fetchDeptInfo();
  },
  beforeUnmount() {
    // Cleanup image URLs
    this.images.forEach((image) => {
      if (image) {
        URL.revokeObjectURL(this.getImagePreviewUrl(image));
      }
    });
  },
  async created() {
    try {
      const response = await axios.get("http://localhost:3007/api/data", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (response.data?.data?.dataDetail?.length > 0) {
        const user = response.data.data.dataDetail[0];
        // เก็บข้อมูลผู้ใช้ใน localStorage
        localStorage.setItem('userData', JSON.stringify({
          emp_id: user.emp_id,
          // ข้อมูลอื่นๆ
        }));
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  },
};
</script>

<style scoped>
.page-container {
  padding: 24px;
  background: #f8f9fa;
  min-height: 100vh;
}

.page-header {
  text-align: center;
  margin-bottom: 24px;
}

.page-header h1 {
  font-size: 1.75rem;
  color: #2c3e50;
  margin-bottom: 8px;
}

.subtitle {
  color: #666;
  font-size: 0.95rem;
}

.content-wrapper {
  max-width: 900px;
  margin: 0 auto;
}

.form-section {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  margin-bottom: 24px;
}

.activity-form {
  padding: 20px;
}

.form-header {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 1.2rem;
  color: #2c3e50;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid #eee;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
  margin-bottom: 20px;
}

.form-group {
  margin-bottom: 16px;
}

.form-group label {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
  color: #2c3e50;
  font-weight: 500;
}

select,
textarea {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 0.95rem;
  transition: all 0.3s ease;
}

select:focus,
textarea:focus {
  border-color: #3498db;
  box-shadow: 0 0 0 2px rgba(52, 152, 219, 0.2);
  outline: none;
}

.upload-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
  margin-bottom: 20px;
}

.upload-section {
  background: #f8fafc;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 20px;
}

.upload-area {
  border: 2px dashed #e2e8f0;
  border-radius: 8px;
  padding: 30px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
  background: white;
}

.upload-area:hover {
  border-color: #3b82f6;
  background: #f8fafc;
}

.upload-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.upload-placeholder i {
  font-size: 2rem;
  color: #3b82f6;
}

.upload-placeholder small {
  color: #64748b;
  font-size: 0.875rem;
}

.hidden {
  display: none;
}

.file-preview, .image-preview {
  margin-top: 16px;
  background: white;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.preview-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px;
  border-bottom: 1px solid #f1f5f9;
}

.preview-item:last-child {
  border-bottom: none;
}

.file-info {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
}

.file-info i {
  font-size: 1.25rem;
}

.file-info i.fa-file-pdf {
  color: #ef4444;
}

.file-info i.fa-file-word {
  color: #2563eb;
}

.file-info i.fa-file-excel {
  color: #16a34a;
}

.file-name {
  font-size: 0.95rem;
  color: #1e293b;
  flex: 1;
}

.file-size {
  color: #64748b;
  font-size: 0.875rem;
}

.image-preview .preview-item {
  position: relative;
  padding: 0;
}

.image-preview img {
  width: 120px;
  height: 120px;
  object-fit: cover;
}

.remove-btn {
  background: #fee2e2;
  color: #ef4444;
  border: none;
  width: 28px;
  height: 28px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
}

.remove-btn:hover {
  background: #ef4444;
  color: white;
}

.image-preview .remove-btn {
  position: absolute;
  top: 8px;
  right: 8px;
  background: rgba(239, 68, 68, 0.9);
  color: white;
}

.image-preview .remove-btn:hover {
  background: #ef4444;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 24px;
}

.btn-secondary {
  background: #95a5a6;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 0.95rem;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-secondary:hover {
  background: #7f8c8d;
}

.activities-section {
  background: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.section-header {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 1.2rem;
  color: #2c3e50;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid #eee;
}

.activity-card {
  background: #f8f9fa;
  border-radius: 6px;
  padding: 16px;
  margin-bottom: 12px;
}

.activity-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.activity-date {
  color: #666;
  display: flex;
  align-items: center;
  gap: 8px;
}

.activity-details {
  color: #2c3e50;
  line-height: 1.6;
  margin-bottom: 16px;
}

.attachments,
.activity-images {
  margin-top: 16px;
}

.attachments h4,
.activity-images h4 {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #666;
  margin-bottom: 12px;
}

.attachment-list {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.attachment-link {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: white;
  border-radius: 6px;
  color: #2c3e50;
  text-decoration: none;
  transition: all 0.3s ease;
}

.attachment-link:hover {
  background: #eee;
}

.image-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 8px;
}

.image-item {
  position: relative;
  aspect-ratio: 1;
  overflow: hidden;
  border-radius: 8px;
  cursor: pointer;
}

.image-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
}

.image-item:hover img {
  transform: scale(1.05);
}

@media (max-width: 768px) {
  .page-container {
    padding: 16px;
  }

  .form-grid,
  .upload-grid {
    grid-template-columns: 1fr;
  }

  .form-actions {
    flex-direction: column;
  }

  .btn-secondary {
    width: 100%;
    justify-content: center;
  }
}

.btn-submit {
  background-color: #4f46e5;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 0.95rem;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 8px;
}

.btn-submit:hover:not(:disabled) {
  background-color: #4338ca;
}

.btn-submit:disabled {
  background-color: #9ca3af;
  cursor: not-allowed;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.fa-spinner {
  animation: spin 1s linear infinite;
}
</style>
