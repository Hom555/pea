<template>
  <div class="page-container">
    <!-- ส่วนค้นหา -->
    <div class="search-section">
      <div class="search-header">
        <i class="fas fa-search"></i>
        <h2>ค้นหาข้อมูลกิจกรรม</h2>
      </div>

      <div class="search-form">
        <div class="form-group">
          <label>
            <i class="fas fa-server"></i>
            เลือกระบบงาน
          </label>
          <select
            v-model="selectedSystemId"
            @change="handleSystemChange"
            class="form-select"
          >
            <option value="">-- กรุณาเลือกระบบงาน --</option>
            <option
              v-for="system in systemList"
              :key="system.id"
              :value="system.id"
            >
              {{ system.name_th }} ({{ system.name_en }})
            </option>
          </select>
        </div>

        <div class="form-group">
          <label>
            <i class="fas fa-info-circle"></i>
            เลือกข้อมูลสำคัญ
          </label>
          <select
            v-model="selectedImportantInfoId"
            @change="fetchActivities"
            :disabled="!selectedSystemId"
            class="form-select"
          >
            <option value="">-- กรุณาเลือกข้อมูลสำคัญ --</option>
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
    </div>

    <!-- ส่วนแสดงผลข้อมูล -->
    <div v-if="loading" class="loading">
      กำลังโหลดข้อมูล...
    </div>

    <div v-else-if="error" class="error">
      {{ error }}
    </div>

    <div v-else-if="activities.length > 0" class="table-section">
      <div class="table-header">
        <div class="header-title">
          <i class="fas fa-clipboard-list"></i>
          <div class="header-info">
            <h2>รายการกิจกรรม</h2>
            <div class="selected-info">
              <span class="system-name">{{
                getSystemName(selectedSystemId)
              }}</span>
              <span class="separator">•</span>
              <span class="important-info">{{
                getImportantInfo(selectedImportantInfoId)
              }}</span>
            </div>
          </div>
        </div>
        <div class="table-actions">
          <span class="record-count">{{ activities.length }} รายการ</span>
        </div>
      </div>

      <div class="table-container">
        <table>
          <thead>
            <tr>
              <th>ลำดับ</th>
              <th>วันที่</th>
              <th>รายละเอียด</th>
              <th>เอกสารแนบ</th>
              <th>รูปภาพ</th>
              <th class="text-center"></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(activity, index) in activities" :key="activity.id">
              <td class="text-center">{{ index + 1 }}</td>
              <td>{{ formatDate(activity.created_at) }}</td>
              <td>
                <div v-if="editingId === activity.id">
                  <textarea
                    v-model="editedDetails"
                    class="edit-textarea"
                    placeholder="รายละเอียด"
                    @keyup.enter="saveEdit(activity)"
                    @keyup.esc="cancelEdit"
                  ></textarea>
                  <div class="edit-actions">
                    <button
                      @click="saveEdit(activity)"
                      class="btn-save"
                      title="บันทึก"
                    >
                      <i class="fas fa-check"></i>
                    </button>
                    <button
                      @click="cancelEdit"
                      class="btn-cancel"
                      title="ยกเลิก"
                    >
                      <i class="fas fa-times"></i>
                    </button>
                  </div>
                  <div class="edit-files">
                    <label for="newFiles">อัพโหลดไฟล์ใหม่:</label>
                    <input type="file" id="newFiles" multiple @change="handleFileChange" />
                    <div class="files-preview">
                      <div v-for="(file, index) in newFiles" :key="index" class="file-item">
                        <span>{{ file.name }}</span>
                        <button @click="removeNewFile(index)">ลบ</button>
                      </div>
                    </div>
                  </div>
                  <div class="edit-images">
                    <label for="newImages">อัพโหลดรูปภาพใหม่:</label>
                    <input type="file" id="newImages" multiple accept="image/*" @change="handleImageChange" />
                    <div class="images-preview">
                      <div v-for="(image, index) in newImages" :key="index" class="image-item">
                        <img :src="getImagePreview(image)" alt="Preview" />
                        <button @click="removeNewImage(index)">ลบ</button>
                      </div>
                    </div>
                  </div>
                </div>
                <div v-else>
                  {{ activity.details }}
                </div>
              </td>
              <td>
                <div class="file-list" v-if="activity.file_paths">
                  <a
                    v-for="(file, fIndex) in activity.file_paths.split(',')"
                    :key="fIndex"
                    :href="`http://localhost:8881${file}`"
                    target="_blank"
                    class="file-link"
                  >
                    <i class="fas fa-file-alt"></i>
                    <span class="file-name">{{ getFileName(file) }}</span>
                  </a>
                </div>
                <span v-else class="no-files">-</span>
              </td>
              <td>
                <div class="image-thumbnails" v-if="activity.image_paths">
                  <div
                    v-for="(image, iIndex) in activity.image_paths.split(',')"
                    :key="iIndex"
                    class="thumbnail"
                    @click="openImage(`http://localhost:8881${image}`)"
                  >
                    <img
                      :src="`http://localhost:8881${image}`"
                      alt="Activity image"
                    />
                  </div>
                </div>
                <span v-else class="no-images">-</span>
              </td>
              <td class="text-center action-buttons">
                <button
                  class="btn-edit"
                  @click="startEdit(activity)"
                  title="แก้ไข"
                >
                  <i class="fas fa-edit"></i>
                </button>
                <button
                  class="btn-delete"
                  @click="confirmDelete(activity)"
                  title="ลบ"
                >
                  <i class="fas fa-trash-alt"></i>
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- แสดงเมื่อไม่มีข้อมูล -->
    <div
      v-else-if="selectedSystemId && selectedImportantInfoId"
      class="no-data"
    >
      <i class="fas fa-inbox"></i>
      <p>ไม่พบข้อมูลกิจกรรม</p>
    </div>
  </div>
</template>

<script>
import axios from "axios";
import { useToast } from 'vue-toastification';
import { mapGetters } from 'vuex';

export default {
  name: 'Dataactivities',
  setup() {
    const toast = useToast();
    return { toast }
  },
  data() {
    return {
      systemList: [],
      importantInfoList: [],
      selectedSystemId: "",
      selectedImportantInfoId: "",
      activities: [],
      editingId: null,
      editedDetails: "",
      newFiles: [],
      newImages: [],
      removedFiles: [],
      removedImages: [],
      loading: false,
      toastShown: false,
      error: null
    };
  },
  computed: {
    ...mapGetters(['getUserDepartment'])
  },
  methods: {
    showToast(message, type = 'error') {
      if (!this.toastShown) {
        this.toastShown = true;
        this.toast[type](message);
        setTimeout(() => {
          this.toastShown = false;
        }, 3000);
      }
    },
    async fetchSystems() {
      try {
        const response = await axios.get("http://localhost:8088/api/system-records");
        // กรองเฉพาะระบบของแผนกตัวเอง
        this.systemList = response.data.filter(system => 
          system.is_active === 1 && 
          system.dept_change_code === this.getUserDepartment?.dept_change_code
        );
      } catch (error) {
        console.error("Error fetching systems:", error);
        this.toast.error("ไม่สามารถดึงข้อมูลระบบได้");
      }
    },
    async handleSystemChange() {
      this.selectedImportantInfoId = "";
      this.activities = [];
      
      if (!this.selectedSystemId) return;

      const selectedSystem = this.systemList.find(
        s => s.id === parseInt(this.selectedSystemId)
      );

      if (!selectedSystem) {
        this.selectedSystemId = "";
        this.toast.error("ระบบนี้ถูกปิดการใช้งาน");
        return;
      }

      await this.fetchSystemDetails();
    },
    async fetchSystemDetails() {
      if (!this.selectedSystemId) return;

      try {
        this.loading = true;
        const response = await axios.get(`http://localhost:8088/api/system-details/${this.selectedSystemId}`);
        console.log("Response from system-details:", response.data);
        
        if (response.data) {
          this.importantInfoList = response.data;
          if (this.importantInfoList.length === 0) {
            this.showToast("ไม่พบข้อมูลสำคัญสำหรับระบบนี้", "warning");
          }
        } else {
          this.importantInfoList = [];
          this.showToast("ไม่พบข้อมูลสำคัญสำหรับระบบนี้", "warning");
        }
      } catch (error) {
        console.error("Error fetching system details:", error);
        this.showToast("ไม่สามารถดึงข้อมูลรายละเอียดได้");
        this.importantInfoList = [];
      } finally {
        this.loading = false;
      }
    },
    async fetchActivities() {
      if (!this.selectedSystemId || !this.selectedImportantInfoId) {
        console.log('Missing required params:', { 
          systemId: this.selectedSystemId, 
          importantInfoId: this.selectedImportantInfoId 
        });
        return;
      }

      try {
        this.loading = true;
        this.error = null;
        
        console.log('Fetching activities for:', {
          systemId: this.selectedSystemId,
          importantInfoId: this.selectedImportantInfoId,
          userDept: this.getUserDepartment?.dept_change_code
        });

        const response = await axios.get(
          `http://localhost:8088/api/activities/${this.selectedSystemId}/${this.selectedImportantInfoId}`
        );
        
        console.log('API Response:', response.data);
        
        if (Array.isArray(response.data)) {
          // กรองข้อมูลตามแผนกของผู้ใช้
          this.activities = response.data.filter(activity => 
            activity.dept_change_code === this.getUserDepartment?.dept_change_code
          );
          
          console.log('Filtered activities:', this.activities);
          
          if (this.activities.length === 0) {
            this.error = 'ไม่พบข้อมูลกิจกรรมของแผนกคุณ';
          }
        } else {
          this.activities = [];
          this.error = 'ไม่พบข้อมูลกิจกรรม';
        }

      } catch (error) {
        console.error('Error fetching activities:', error);
        this.error = 'ไม่สามารถดึงข้อมูลกิจกรรมได้';
        this.activities = [];
      } finally {
        this.loading = false;
      }
    },
    formatDate(date) {
      if (!date) return '';
      const d = new Date(date);
      return d.toLocaleString('th-TH', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    },
    getFileName(filePath) {
      if (!filePath) return "";
      try {
        const parts = filePath.split("/");
        const filename = parts[parts.length - 1];
        // แยกส่วนของ timestamp ออกจากชื่อไฟล์
        const [timestamp, ...nameParts] = filename.split('-');
        // รวมส่วนที่เหลือของชื่อไฟล์กลับเข้าด้วยกัน (กรณีที่ชื่อไฟล์มีเครื่องหมาย - อยู่ด้วย)
        const originalName = nameParts.join('-');
        return originalName;
      } catch (error) {
        console.error("Error getting filename:", error);
        return "Unknown file";
      }
    },
    openImage(imageUrl) {
      window.open(imageUrl, '_blank');
    },
    getSystemName(systemId) {
      const system = this.systemList.find(s => s.id === parseInt(systemId));
      return system ? `${system.name_th} (${system.name_en})` : '';
    },
    getImportantInfo(infoId) {
      const info = this.importantInfoList.find(i => i.id === infoId);
      return info ? info.important_info : '';
    },
    async editActivity(activity) {
      try {
        const newDetails = prompt("แก้ไขรายละเอียด:", activity.details);
        if (newDetails === null) return;

        if (newDetails.trim() === "") {
          alert("กรุณากรอกรายละเอียด");
          return;
        }

        await axios.put(
          `http://localhost:8088/api/activities/${activity.id}`,
          {
            details: newDetails,
          }
        );

        await this.fetchActivities();
        alert("แก้ไขข้อมูลสำเร็จ");
      } catch (error) {
        console.error("Error updating activity:", error);
        alert("ไม่สามารถแก้ไขข้อมูลได้");
      }
    },
    async confirmDelete(activity) {
      if (confirm("ต้องการลบรายการนี้ใช่หรือไม่?")) {
        try {
          await axios.delete(
            `http://localhost:8088/api/activities/${activity.id}`
          );
          await this.fetchActivities();
          alert("ลบข้อมูลสำเร็จ");
        } catch (error) {
          console.error("Error deleting activity:", error);
          alert("ไม่สามารถลบข้อมูลได้");
        }
      }
    },
    async startEdit(activity) {
      this.editingId = activity.id;
      this.editedDetails = activity.details;
      this.newFiles = [];
      this.newImages = [];
      this.removedFiles = [];
      this.removedImages = [];
      this.toast.info("เริ่มแก้ไขข้อมูล", {
        timeout: 2000
      });
    },
    cancelEdit() {
      this.editingId = null;
      this.editedDetails = "";
      this.newFiles = [];
      this.newImages = [];
      this.removedFiles = [];
      this.removedImages = [];
      this.toast.warning("ยกเลิกการแก้ไข", {
        timeout: 2000
      });
    },
    async saveEdit(activity) {
      if (!this.editedDetails.trim()) {
        alert("กรุณากรอกรายละเอียด");
        return;
      }

      try {
        const formData = new FormData();
        formData.append("details", this.editedDetails);

        this.newFiles.forEach((file) => {
          formData.append("files", file);
        });

        this.newImages.forEach((image) => {
          formData.append("images", image);
        });

        formData.append("removedFiles", JSON.stringify(this.removedFiles));
        formData.append("removedImages", JSON.stringify(this.removedImages));

        const response = await axios.put(
          `http://localhost:8088/api/activities/${activity.id}`,
          formData,
          {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          }
        );

        if (response.status === 200) {
          this.toast.success("บันทึกการแก้ไขสำเร็จ", {
            timeout: 3000
          });
          await this.fetchActivities();
          this.cancelEdit();
        }
      } catch (error) {
        console.error("Error saving edit:", error);
        this.toast.error("ไม่สามารถบันทึกการแก้ไขได้", {
          timeout: 3000
        });
      }
    },
    handleFileChange(event) {
      const files = Array.from(event.target.files);
      this.newFiles = files;
      this.toast.info(`เลือกไฟล์ ${files.length} ไฟล์`, {
        timeout: 2000
      });
    },
    handleImageChange(event) {
      const files = Array.from(event.target.files);
      const validImages = files.filter((file) =>
        file.type.startsWith("image/")
      );
      if (validImages.length !== files.length) {
        this.toast.error("กรุณาเลือกไฟล์รูปภาพเท่านั้น", {
          timeout: 3000
        });
        return;
      }
      this.newImages = validImages;
      this.toast.info(`เลือกรูปภาพ ${validImages.length} รูป`, {
        timeout: 2000
      });
    },
    removeFile(index) {
      const files = this.activity.file_paths.split(",");
      this.removedFiles.push(files[index]);
      files.splice(index, 1);
      this.activity.file_paths = files.join(",");
    },
    removeImage(index) {
      const images = this.activity.image_paths.split(",");
      this.removedImages.push(images[index]);
      images.splice(index, 1);
      this.activity.image_paths = images.join(",");
    },
    removeNewFile(index) {
      this.newFiles.splice(index, 1);
      this.toast.info("ลบไฟล์ที่เลือกแล้ว", {
        timeout: 2000
      });
    },
    removeNewImage(index) {
      this.newImages.splice(index, 1);
      this.toast.info("ลบรูปภาพที่เลือกแล้ว", {
        timeout: 2000
      });
    },
    getImagePreview(file) {
      return URL.createObjectURL(file);
    },
  },
  watch: {
    selectedSystemId: {
      async handler(newVal) {
        if (newVal) {
          const selectedSystem = this.systemList.find(
            s => s.id === parseInt(newVal)
          );
          
          if (!selectedSystem) {
            this.selectedSystemId = "";
            this.selectedImportantInfoId = "";
            this.activities = [];
            this.toast.error("ระบบนี้ถูกปิดการใช้งาน");
            return;
          }

          this.selectedImportantInfoId = "";
          this.activities = [];
          await this.fetchSystemDetails();
        } else {
          this.importantInfoList = [];
          this.activities = [];
        }
      }
    }
  },
  async created() {
    await this.fetchSystems();
    
    const { systemId, importantInfoId } = this.$route.query;
    if (systemId) {
      const system = this.systemList.find(s => s.id === parseInt(systemId));
      if (system) {
        this.selectedSystemId = systemId;
        if (importantInfoId) {
          this.selectedImportantInfoId = importantInfoId;
        }
      }
    }
  },
};
</script>

<style scoped>
.page-container {
  padding: 24px;
  background: #f0f2f5;
  min-height: 100vh;
}

.search-section {
  background: white;
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.search-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 24px;
  color: #2c3e50;
  border-bottom: 2px solid #f0f2f5;
  padding-bottom: 16px;
}

.search-header i {
  font-size: 1.4rem;
  color: #3498db;
}

.search-header h2 {
  font-size: 1.5rem;
  font-weight: 600;
}

.search-form {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
}

.form-group {
  margin: 0;
}

.form-group label {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
  color: #666;
}

.form-select {
  width: 100%;
  padding: 12px;
  border: 1px solid #e1e8ef;
  border-radius: 8px;
  font-size: 1rem;
  color: #2c3e50;
  background-color: #fff;
  transition: all 0.3s ease;
  cursor: pointer;
}

.form-select:focus {
  border-color: #3498db;
  box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.1);
  outline: none;
}

.form-select:disabled {
  background-color: #f8f9fa;
  cursor: not-allowed;
}

.table-section {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 2px solid #f0f2f5;
}

.header-title {
  display: flex;
  align-items: center;
  gap: 12px;
}

.header-title i {
  font-size: 1.4rem;
  color: #3498db;
}

.header-title h2 {
  font-size: 1.5rem;
  font-weight: 600;
  color: #2c3e50;
}

.record-count {
  background: #e1f0fa;
  padding: 6px 16px;
  border-radius: 20px;
  color: #3498db;
  font-weight: 500;
}

.table-container {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}

table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  min-width: 800px;
}

th,
td {
  padding: 16px;
  text-align: left;
  border-bottom: 1px solid #edf2f7;
}

th {
  background: #f8fafc;
  color: #64748b;
  font-weight: 600;
  font-size: 0.95rem;
  white-space: nowrap;
}

th:first-child {
  border-top-left-radius: 8px;
}

th:last-child {
  border-top-right-radius: 8px;
}

td {
  position: relative;
  color: #2c3e50;
  font-size: 0.95rem;
  white-space: normal;
  word-break: break-word;
}

tr:hover td {
  background: #f8fafc;
}

.text-center {
  text-align: center;
}

.file-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  align-items: flex-start;
}

.file-link {
  display: inline-flex;
  align-items: center;
  justify-content: flex-start;
  gap: 8px;
  padding: 6px 12px;
  background: #f1f5f9;
  border-radius: 6px;
  color: #3498db;
  text-decoration: none;
  font-size: 0.9rem;
  transition: all 0.2s ease;
  width: fit-content;
}

.file-link:hover {
  background: #e2e8f0;
}

.image-thumbnails {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  justify-content: flex-start;
}

.thumbnail {
  width: 40px;
  height: 40px;
  border-radius: 4px;
  overflow: hidden;
  cursor: pointer;
  transition: transform 0.2s ease;
}

.thumbnail:hover {
  transform: scale(1.1);
}

.thumbnail img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.no-files,
.no-images {
  color: #94a3b8;
  font-style: italic;
}

@media (max-width: 1024px) {
  .table-container {
    margin: 0 -24px;
  }

  table {
    min-width: 1000px;
  }
}

.header-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.selected-info {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.95rem;
  color: #64748b;
}

.system-name,
.important-info {
  font-weight: 500;
}

.separator {
  color: #cbd5e1;
}

.action-buttons {
  display: inline-flex;
  justify-content: flex-start;
  gap: 8px;
}

.btn-edit,
.btn-delete {
  padding: 6px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
}

.btn-edit {
  background: #e1f0fa;
  color: #3498db;
}

.btn-edit:hover {
  background: #3498db;
  color: white;
}

.btn-delete {
  background: #fee2e2;
  color: #ef4444;
}

.btn-delete:hover {
  background: #ef4444;
  color: white;
}

.edit-textarea {
  width: 100%;
  min-height: 80px;
  padding: 12px;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  font-size: 0.95rem;
  resize: vertical;
  transition: border-color 0.2s ease;
  margin-bottom: 8px;
}

.edit-textarea:focus {
  border-color: #3498db;
  outline: none;
}

.edit-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}

.btn-save,
.btn-cancel {
  padding: 6px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.btn-save {
  background: #e1f0fa;
  color: #3498db;
}

.btn-save:hover {
  background: #3498db;
  color: white;
}

.btn-cancel {
  background: #fee2e2;
  color: #ef4444;
}

.btn-cancel:hover {
  background: #ef4444;
  color: white;
}

.details-text {
  padding: 8px;
  border-radius: 4px;
}

.edit-form {
  background: #f8fafc;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  overflow: hidden;
}

.edit-header {
  background: #f1f5f9;
  padding: 12px 16px;
  display: flex;
  align-items: center;
  gap: 8px;
  border-bottom: 1px solid #e2e8f0;
}

.edit-header i {
  color: #3498db;
}

.edit-content {
  padding: 16px;
}

.form-group {
  margin-bottom: 16px;
}

.form-group label {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
  color: #475569;
  font-weight: 500;
}

.form-group label i {
  color: #3498db;
}

.edit-textarea {
  width: 100%;
  min-height: 120px;
  padding: 12px;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  font-size: 0.95rem;
  resize: vertical;
}

.upload-section {
  margin-top: 8px;
}

.files-preview,
.images-preview {
  margin-top: 12px;
  background: #f8fafc;
  border-radius: 6px;
  padding: 12px;
  max-height: 250px;
  overflow-y: auto;
}

.file-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  margin-bottom: 8px;
}

.file-item:last-child {
  margin-bottom: 0;
}

.image-item {
  width: 100%;
  height: 120px;
  margin-bottom: 8px;
}

.image-item:last-child {
  margin-bottom: 0;
}

.image-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 6px;
}

.edit-layout {
  display: flex;
  flex-direction: column;
  gap: 24px;
  margin-bottom: 16px;
}

.edit-section {
  background: white;
  padding: 20px;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.files-section {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

.form-group label {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
  color: #475569;
  font-weight: 500;
}

.form-group label i {
  color: #3498db;
}

.edit-textarea {
  width: 100%;
  min-height: 120px;
  padding: 12px;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  font-size: 0.95rem;
  resize: vertical;
  transition: border-color 0.2s ease;
}

.edit-textarea:focus {
  border-color: #3498db;
  outline: none;
}

.upload-label {
  width: 100%;
  padding: 12px;
  background: #f8fafc;
  border: 2px dashed #e2e8f0;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.upload-label:hover {
  border-color: #3498db;
  background: #e1f0fa;
}

.files-preview,
.images-preview {
  margin-top: 12px;
  background: #f8fafc;
  border-radius: 6px;
  padding: 12px;
  max-height: 250px;
  overflow-y: auto;
}

@media (max-width: 768px) {
  .search-form {
    grid-template-columns: 1fr;
  }

  .table-section {
    margin: 0 -12px;
    border-radius: 0;
  }

  .table-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .record-count {
    align-self: flex-start;
  }
}

@media (max-width: 480px) {
  .page-container {
    padding: 12px;
  }

  .search-section,
  .table-section {
    padding: 16px;
  }

  .thumbnail {
    width: 32px;
    height: 32px;
  }

  .btn-edit,
  .btn-delete {
    width: 28px;
    height: 28px;
    padding: 4px;
  }

  .file-link {
    padding: 4px 8px;
    font-size: 0.85rem;
  }

  th,
  td {
    padding: 12px 8px;
    font-size: 0.9rem;
  }
}

.loading, .error, .no-data {
  text-align: center;
  padding: 20px;
}

.error {
  color: red;
}
</style>