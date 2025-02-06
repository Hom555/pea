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
                  {{ info.name }}
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
            <!-- Document Upload -->
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
                  accept=".pdf,.doc,.docx"
                  class="hidden"
                />
                <div class="upload-placeholder">
                  <i class="fas fa-cloud-upload-alt"></i>
                  <span>คลิกหรือลากไฟล์มาวางที่นี่</span>
                  <small>รองรับไฟล์ PDF, DOC, DOCX</small>
                </div>
              </div>
              <!-- File List -->
              <div class="file-list" v-if="files.length > 0">
                <div
                  v-for="(file, index) in files"
                  :key="index"
                  class="file-item"
                >
                  <i class="fas fa-file-alt"></i>
                  <span class="file-name">{{ file.name }}</span>
                  <button @click="removeFile(index)" class="remove-btn">
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
                  <small>รองรับไฟล์ JPG, PNG</small>
                </div>
              </div>
              <!-- Image Preview -->
              <div class="image-preview" v-if="images.length > 0">
                <div
                  v-for="(image, index) in images"
                  :key="index"
                  class="preview-item"
                >
                  <img
                    v-if="image"
                    :src="getImagePreviewUrl(image)"
                    alt="Preview"
                  />
                  <button
                    @click.prevent="removeImage(index)"
                    class="remove-btn"
                  >
                    <i class="fas fa-times"></i>
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Form Actions -->
          <div class="form-actions">
            <button type="button" @click="resetForm" class="btn-secondary">
              <i class="fas fa-redo"></i>
              ล้างฟอร์ม
            </button>
            <button type="submit" class="btn-primary">
              <i class="fas fa-save"></i>
              บันทึกกิจกรรม
            </button>
          </div>
        </form>
      </div>

      <!-- Activities List Section -->
      <div v-if="hasActivities" class="activities-section">
        <div class="section-header">
          <i class="fas fa-list-alt"></i>
          <span>รายการกิจกรรม</span>
        </div>

        <div class="activity-list">
          <div
            v-for="activity in activities"
            :key="activity.id"
            class="activity-card"
          >
            <div class="activity-header">
              <div class="activity-date">
                <i class="fas fa-calendar-alt"></i>
                {{ formatDate(activity.created_at) }}
              </div>
            </div>

            <div class="activity-body">
              <p class="activity-details">{{ activity.details }}</p>

              <!-- Attached Files -->
              <div v-if="activity.file_paths" class="attachments">
                <h4>
                  <i class="fas fa-paperclip"></i>
                  เอกสารแนบ
                </h4>
                <div class="attachment-list">
                  <a
                    v-for="(filePath, index) in activity.file_paths.split(',')"
                    :key="index"
                    :href="`http://localhost:8881${filePath}`"
                    target="_blank"
                    class="attachment-link"
                  >
                    <i class="fas fa-file"></i>
                    <span>{{ getFileName(filePath) }}</span>
                  </a>
                </div>
              </div>

              <!-- Attached Images -->
              <div v-if="activity.image_paths" class="activity-images">
                <h4>
                  <i class="fas fa-images"></i>
                  รูปภาพ
                </h4>
                <div class="image-grid">
                  <div
                    v-for="(imagePath, index) in activity.image_paths.split(
                      ','
                    )"
                    :key="index"
                    class="image-item"
                    @click="openImageViewer(imagePath)"
                  >
                    <img
                      :src="`http://localhost:8881${imagePath}`"
                      alt="Activity image"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from "axios";
import { useToast } from 'vue-toastification';

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
    };
  },
  methods: {
    async fetchSystems() {
      try {
        const response = await axios.get('http://localhost:8881/api/system-records');
        if (response.data) {
          this.systemList = response.data.filter(system => system.is_active === 1);
        }
      } catch (error) {
        console.error('Error fetching systems:', error);
        this.toast.error('ไม่สามารถดึงข้อมูลระบบได้');
      }
    },
    async fetchImportantInfo() {
      if (!this.selectedSystemId) {
        this.importantInfoList = [];
        return;
      }

      try {
        const response = await axios.get(
          `http://localhost:8881/api/system-details/${this.selectedSystemId}`
        );

        const system = this.systemList.find(s => s.id === parseInt(this.selectedSystemId));
        if (!system) {
          this.toast.error('ระบบนี้ถูกปิดการใช้งาน');
          this.selectedSystemId = '';
          this.importantInfoList = [];
          return;
        }

        this.importantInfoList = response.data.map((item) => ({
          id: item.id,
          name: item.important_info,
        }));
      } catch (error) {
        console.error('Error fetching important info:', error);
        this.toast.error('ไม่สามารถดึงข้อมูลสำคัญได้');
      }
    },
    handleFileUpload(event) {
      const files = event.target.files;
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (this.isValidFileType(file)) {
          this.files.push(file);
        } else {
          this.toast.error('กรุณาเลือกไฟล์ PDF, DOC หรือ DOCX เท่านั้น');
        }
      }
    },
    handleImageUpload(event) {
      const files = event.target.files;
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (this.isValidImageType(file)) {
          file.preview = URL.createObjectURL(file);
          this.images.push(file);
        } else {
          this.toast.error('กรุณาเลือกไฟล์รูปภาพ JPG หรือ PNG เท่านั้น');
        }
      }
    },
    isValidImageType(file) {
      const validTypes = ['image/jpeg', 'image/png', 'image/jpg'];
      return validTypes.includes(file.type);
    },
    getImagePreviewUrl(image) {
      return image.preview || '';
    },
    removeImage(index) {
      const image = this.images[index];
      if (image.preview) {
        URL.revokeObjectURL(image.preview);
      }
      this.images.splice(index, 1);
    },
    handleImageDrop(event) {
      event.preventDefault();
      const files = event.dataTransfer.files;
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (this.isValidImageType(file)) {
          file.preview = URL.createObjectURL(file);
          this.images.push(file);
        } else {
          this.toast.error('กรุณาลากไฟล์รูปภาพ JPG หรือ PNG เท่านั้น');
        }
      }
    },
    async submitForm() {
      try {
        this.isSubmitted = true;
        if (!this.selectedSystemId || !this.importantInfo || !this.details) {
          this.toast.error('กรุณากรอกข้อมูลให้ครบถ้วน');
          return;
        }

        const formData = new FormData();
        
        formData.append('system_id', String(this.selectedSystemId));
        formData.append('important_info_id', String(this.importantInfo));
        formData.append('details', this.details);

        if (this.files && this.files.length > 0) {
          for (const file of this.files) {
            formData.append('files[]', file);
          }
        }

        if (this.images && this.images.length > 0) {
          for (const image of this.images) {
            formData.append('images[]', image);
          }
        }

        const response = await axios.post(
          'http://localhost:8881/api/activities',
          formData,
          {
            headers: {
              'Content-Type': 'multipart/form-data'
            }
          }
        );

        if (response.data.status === 'success') {
          this.toast.success('บันทึกกิจกรรมสำเร็จ');
          this.resetForm();
        }

      } catch (error) {
        console.error('Error saving activity:', error);
        this.toast.error(error.response?.data?.message || 'ไม่สามารถบันทึกกิจกรรมได้');
      } finally {
        this.isSubmitted = false;
      }
    },
    resetForm() {
      this.selectedSystemId = '';
      this.importantInfo = '';
      this.details = '';
      this.images.forEach(image => {
        if (image.preview) {
          URL.revokeObjectURL(image.preview);
        }
      });
      this.files = [];
      this.images = [];
      this.importantInfoList = [];
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
          `http://localhost:8881/api/activities/${this.selectedSystemId}/${this.importantInfo}`
        );
        
        console.log('API Response:', response.data);
        
        this.activities = response.data;
        
        if (this.activities.length === 0) {
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
    removeFile(index) {
      this.files.splice(index, 1);
    },
    handleFileDrop(event) {
      const files = event.dataTransfer.files;
      for (let i = 0; i < files.length; i++) {
        if (this.isValidFileType(files[i])) {
          this.files.push(files[i]);
        }
      }
    },
    isValidFileType(file) {
      const validTypes = ['.pdf', '.doc', '.docx'];
      const extension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
      return validTypes.includes(extension);
    },
  },
  watch: {
    selectedSystemId(newVal) {
      if (newVal) {
        this.fetchImportantInfo();
      } else {
        this.importantInfo = '';
        this.importantInfoList = [];
        this.activities = [];
      }
    },
    importantInfo(newVal) {
      if (newVal) {
        this.fetchActivities();
      } else {
        this.activities = [];
      }
    }
  },
  mounted() {
    this.fetchSystems();
  },
  beforeUnmount() {
    this.images.forEach(image => {
      if (image.preview) {
        URL.revokeObjectURL(image.preview);
      }
    });
  },
  computed: {
    hasActivities() {
      return this.activities && this.activities.length > 0;
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
  background: #f8f9fa;
  padding: 16px;
  border-radius: 6px;
  border: 2px dashed #ddd;
}

.upload-area {
  padding: 24px 16px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
}

.upload-area:hover {
  background: rgba(52, 152, 219, 0.1);
}

.upload-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  color: #666;
}

.upload-placeholder i {
  font-size: 1.5rem;
  color: #3498db;
}

.hidden {
  display: none;
}

.file-list,
.image-preview {
  margin-top: 16px;
}

.file-item,
.preview-item {
  background: white;
  padding: 8px;
  border-radius: 8px;
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  gap: 12px;
}

.preview-item img {
  width: 50px;
  height: 50px;
  object-fit: cover;
  border-radius: 4px;
}

.remove-btn {
  background: none;
  border: none;
  color: #e74c3c;
  cursor: pointer;
  padding: 4px;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 24px;
}

.btn-primary,
.btn-secondary {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  border: none;
  border-radius: 6px;
  font-size: 0.95rem;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-primary {
  background: #3498db;
  color: white;
}

.btn-primary:hover {
  background: #2980b9;
}

.btn-secondary {
  background: #95a5a6;
  color: white;
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

  .btn-primary,
  .btn-secondary {
    width: 100%;
    justify-content: center;
  }
}
</style>
