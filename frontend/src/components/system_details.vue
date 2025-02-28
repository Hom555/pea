<template>
  <div class="container">
    <div class="form-card">
      <!-- หัวข้อฟอร์ม -->
      <div class="form-header">
        <h1>แบบฟอร์มอัพเดตข้อมูลระบบ</h1>
        <p class="subtitle">กรุณากรอกข้อมูลให้ครบถ้วน ช่องที่มีเครื่องหมาย <span class="required">*</span> เป็นข้อมูลที่จำเป็น</p>
      </div>

      <form @submit.prevent="submitForm" class="official-form">
        <div class="form-grid">
          <!-- 1. ชื่อระบบงาน -->
          <div class="form-group">
            <label>
              <i class="fas fa-desktop"></i>
              ชื่อระบบงาน <span class="required">*</span>
            </label>
            <select v-model="selectedSystemId" required class="form-select">
              <option value="">-- กรุณาเลือกระบบงาน --</option>
              <option 
                v-for="system in systemList" 
                :key="system.id" 
                :value="system.id"
                :disabled="!system.is_active"
              >
                {{ system.name_th }} ({{ system.name_en }})
                {{ !system.is_active ? '- ปิดใช้งาน' : '' }}
              </option>
            </select>
          </div>

          <!-- 2. ข้อมูลสำคัญ -->
          <div class="form-group">
            <label>
              <i class="fas fa-exclamation-circle"></i>
              ข้อมูลสำคัญ <span class="required">*</span>
            </label>
            <textarea
              v-model="importantInfo"
              required
              class="form-textarea"
              placeholder="กรุณากรอกข้อมูลสำคัญของระบบ"
            ></textarea>
          </div>

          <!-- 3. เลขที่หนังสืออ้างอิง -->
          <div class="form-group">
            <label>
              <i class="fas fa-file-alt"></i>
              เลขที่หนังสืออ้างอิง <span class="required">*</span>
            </label>
            <input
              v-model="referenceNo"
              required
              class="form-input"
              placeholder="กรุณากรอกเลขที่หนังสือ"
            />
          </div>

          <!-- 4. ข้อมูลเพิ่มเติม -->
          <div class="form-group">
            <label>
              <i class="fas fa-align-left"></i>
              ข้อมูลเพิ่มเติม
            </label>
            <textarea
              v-model="additionalInfo"
              class="form-textarea"
              placeholder="กรุณากรอกข้อมูลเพิ่มเติม (ถ้ามี)"
            ></textarea>
          </div>

          <!-- 5. เอกสารแนบ -->
          <div class="form-group full-width">
            <label>
              <i class="fas fa-paperclip"></i>
              เอกสารแนบ
            </label>
            <div class="file-upload-area">
              <div class="upload-box" @click="triggerFileInput" @dragover.prevent @drop.prevent="handleFileDrop">
                <i class="fas fa-cloud-upload-alt"></i>
                <p>คลิกเพื่อเลือกไฟล์ หรือลากไฟล์มาวางที่นี่</p>
                <span class="file-type">รองรับไฟล์: PDF, DOCX, XLSX (ไม่เกิน 10MB)</span>
              </div>
              <input
                type="file"
                id="fileUpload"
                ref="fileInput"
                multiple
                @change="handleFileUpload"
                class="hidden-input"
                accept=".pdf,.docx,.xlsx"
              />

              <!-- แสดงรายการไฟล์ที่เลือก -->
              <div v-if="selectedFiles.length > 0" class="selected-files">
                <div v-for="(file, index) in selectedFiles" :key="index" class="file-item">
                  <div class="file-info">
                    <i :class="getFileIcon(file.name)"></i>
                    <span class="file-name">{{ file.name }}</span>
                    <span class="file-size">({{ formatFileSize(file.size) }})</span>
                  </div>
                  <button @click="removeFile(index)" class="btn-remove">
                    <i class="fas fa-times"></i>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- ปุ่มดำเนินการ -->
        <div class="form-actions">
          <button type="button" @click="resetForm" class="btn-reset">
            <i class="fas fa-undo"></i>
            ยกเลิก
          </button>
          <button type="submit" class="btn-submit">
            <i class="fas fa-save"></i>
            บันทึกข้อมูล
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script>
import axios from "axios";
import { useToast } from "vue-toastification";
import { mapGetters } from 'vuex';

export default {
  name: 'SystemDetails',
  
  data() {
    return {
      systemList: [],
      selectedSystemId: "",
      importantInfo: "",
      referenceNo: "",
      additionalInfo: "",
      files: null,
      fileInput: null,
      loading: false,
      selectedFiles: [],
    };
  },

  setup() {
    const toast = useToast();
    return { toast };
  },

  computed: {
    ...mapGetters(['getUserDepartment'])
  },

  methods: {
    async fetchSystems() {
      this.loading = true;
      try {
        const response = await axios.get("http://localhost:8088/api/system-records");
        // กรองระบบที่เปิดใช้งานและอยู่ในแผนกของผู้ใช้
        this.systemList = response.data.filter(system => 
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

    async submitForm() {
      try {
        // Validation
        if (!this.selectedSystemId) {
          this.toast.error("กรุณาเลือกระบบงาน");
          return;
        }
        if (!this.importantInfo?.trim()) {
          this.toast.error("กรุณากรอกข้อมูลสำคัญ");
          return;
        }
        if (!this.referenceNo?.trim()) {
          this.toast.error("กรุณากรอกเลขที่หนังสืออ้างอิง");
          return;
        }

        const formData = new FormData();
        formData.append('systemId', this.selectedSystemId);
        formData.append('importantInfo', this.importantInfo.trim());
        formData.append('referenceNo', this.referenceNo.trim());
        formData.append('additionalInfo', this.additionalInfo?.trim() || '');

        // เพิ่มไฟล์ทั้งหมดที่เลือกไว้
        if (this.selectedFiles && this.selectedFiles.length > 0) {
          this.selectedFiles.forEach(file => {
            formData.append('files', file);
          });
        }

        // Log FormData content for debugging
        for (let [key, value] of formData.entries()) {
          console.log(`${key}: ${value}`);
        }

        const response = await axios.post(
          'http://localhost:8088/api/system-details',
          formData,
          {
            headers: {
              'Content-Type': 'multipart/form-data'
            }
          }
        );

        if (response.data.success) {
          this.toast.success('บันทึกข้อมูลสำเร็จ');
          this.resetForm();
          this.$emit('refresh');
        } else {
          throw new Error(response.data.message || 'ไม่สามารถบันทึกข้อมูลได้');
        }

      } catch (error) {
        console.error('Error:', error);
        this.toast.error(
          error.response?.data?.message || 
          'เกิดข้อผิดพลาดในการบันทึกข้อมูล'
        );
      }
    },

    resetForm() {
      this.selectedSystemId = '';
      this.importantInfo = '';
      this.referenceNo = '';
      this.additionalInfo = '';
      this.files = null;
      this.selectedFiles = [];
      if (this.$refs.fileInput) {
        this.$refs.fileInput.value = '';
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
        const allowedTypes = ['pdf', 'docx', 'xlsx'];
        
        if (!allowedTypes.includes(extension)) {
          this.toast.error(`ไฟล์ ${file.name} ไม่ได้รับการสนับสนุน`);
          continue;
        }

        // ตรวจสอบขนาดไฟล์ (10MB)
        if (file.size > 10 * 1024 * 1024) {
          this.toast.error(`ไฟล์ ${file.name} มีขนาดใหญ่เกินไป (ไม่เกิน 10MB)`);
          continue;
        }

        this.selectedFiles.push(file);
      }
    },

    removeFile(index) {
      this.selectedFiles.splice(index, 1);
    },

    getFileIcon(fileName) {
      const extension = fileName.split('.').pop().toLowerCase();
      switch (extension) {
        case 'pdf':
          return 'fas fa-file-pdf';
        case 'docx':
          return 'fas fa-file-word';
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

    triggerFileInput() {
      this.$refs.fileInput.click();
    },

    async onSystemChange() {
      if (this.selectedSystemId) {
        const selectedSystem = this.systemList.find(
          system => system.id === parseInt(this.selectedSystemId)
        );
        if (!selectedSystem?.is_active) {
          this.selectedSystemId = '';
          this.toast.error("ระบบนี้ถูกปิดการใช้งาน");
        }
      }
    }
  },

  watch: {
    selectedSystemId: {
      handler: 'onSystemChange',
      immediate: true
    }
  },

  mounted() {
    this.fetchSystems();
  }
};
</script>

<style scoped>
.container {
  max-width: 800px;
  margin: 1.5rem auto;
  padding: 0 1rem;
}

.form-card {
  background: white;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  padding: 1.5rem;
}

.form-header {
  margin-bottom: 2rem;
  text-align: center;
}

.form-header h1 {
  font-size: 1.5rem;
  color: #424242;
  margin-bottom: 0.5rem;
}

.subtitle {
  color: #666;
  font-size: 0.9rem;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1.5rem;
}

.form-group {
  margin: 0;
}

.form-group.full-width {
  grid-column: 1 / -1;
}

.form-group label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
  color: #000000;
  font-size: 0.95rem;
}

.form-group label i {
  color: #666;
  width: 16px;
  text-align: center;
}

.required {
  color: #dc2626;
  margin-left: 4px;
}

.form-input,
.form-select,
.form-textarea {
  width: 100%;
  padding: 0.6rem 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 0.9rem;
  color: #000;
  background: #fff;
}

.form-input:focus,
.form-select:focus,
.form-textarea:focus {
  outline: none;
  border-color: #666;
}

.file-upload-area {
  background: #f8fafc;
  border-radius: 12px;
  padding: 20px;
}

.upload-box {
  border: 2px dashed #e2e8f0;
  border-radius: 8px;
  padding: 30px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
  background: white;
}

.upload-box:hover {
  border-color: #3b82f6;
  background: #f8fafc;
}

.upload-box i {
  font-size: 2.5rem;
  color: #3b82f6;
  margin-bottom: 15px;
}

.upload-box p {
  color: #1e293b;
  font-size: 1rem;
  margin: 10px 0;
}

.file-type {
  display: block;
  color: #64748b;
  font-size: 0.875rem;
  margin-top: 8px;
}

.hidden-input {
  display: none;
}

.selected-files {
  margin-top: 20px;
  background: white;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.file-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-bottom: 1px solid #f1f5f9;
  transition: background-color 0.2s ease;
}

.file-item:last-child {
  border-bottom: none;
}

.file-item:hover {
  background-color: #f8fafc;
}

.file-info {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
}

.file-info i {
  font-size: 1.25rem;
  width: 24px;
  text-align: center;
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

.btn-remove {
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

.btn-remove:hover {
  background: #ef4444;
  color: white;
  transform: scale(1.05);
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  margin-top: 2rem;
}

.btn-submit,
.btn-reset {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.6rem 1.25rem;
  border-radius: 4px;
  font-size: 0.95rem;
  font-weight: 500;
  cursor: pointer;
}

.btn-submit {
  background: #266ecc;
  color: rgb(255, 255, 255);
  border: none;
}

.btn-reset {
  background: white;
  color: #666;
  border: 1px solid #ddd;
}

.btn-submit:hover {
  background: #1994ff;
}

.btn-reset:hover {
  background: #f5f5f5;
}

@media (max-width: 768px) {
  .form-grid {
    grid-template-columns: 1fr;
  }
  
  .form-card {
    padding: 1rem;
  }
}

.form-textarea {
  resize: vertical;
  min-height: 38px; /* ให้ความสูงเท่ากับ input ปกติ */
  max-height: 150px;
}
</style>