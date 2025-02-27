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
              <th>รายละเอียด</th>
              <th>เอกสารแนบ</th>
              <th>รูปภาพ</th>
              <th>วันที่</th>
              <th class="text-center"></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(activity, index) in activities" :key="activity.id">
              <td class="text-center">{{ index + 1 }}</td>
              <td>
                <div v-if="editingId === activity.id">
                  <textarea
                    v-model="editedDetails"
                    class="edit-textarea"
                    placeholder="รายละเอียด"
                  ></textarea>
                  
                  <!-- จัดการไฟล์เอกสาร -->
                  <div class="edit-files-section">
                    <label class="file-label">
                      <i class="fas fa-file-upload"></i>
                      เพิ่มเอกสารแนบ
                      <input
                        type="file"
                        @change="handleFileChange"
                        multiple
                        class="file-input"
                      />
                    </label>

                    <!-- แสดงไฟล์ที่เลือกใหม่ -->
                    <div v-if="newFiles.length > 0" class="new-files">
                      <div v-for="(file, index) in newFiles" :key="index" class="file-item">
                        <i class="fas fa-file"></i>
                        <span class="file-name">{{ file.name }}</span>
                        <button @click="removeNewFile(index)" class="remove-btn">
                          <i class="fas fa-times"></i>
                        </button>
                      </div>
                    </div>

                    <!-- แสดงไฟล์ที่มีอยู่ -->
                    <div v-if="activity.file_paths" class="current-files">
                      <div v-for="(file, index) in activity.file_paths.split(',')"
                        :key="file"
                        class="file-item">
                        <a :href="`http://localhost:8088${file}`" target="_blank" class="file-link">
                          <i class="fas fa-file-alt"></i>
                          <span class="file-name">{{ getFileName(file) }}</span>
                        </a>
                        <button @click="deleteFile(activity, index)" class="remove-btn">
                          <i class="fas fa-times"></i>
                        </button>
                      </div>
                    </div>
                  </div>

                  <!-- จัดการรูปภาพ -->
                  <div class="edit-images-section">
                    <label class="file-label">
                      <i class="fas fa-image"></i>
                      เพิ่มรูปภาพ
                      <input
                        type="file"
                        @change="handleImageChange"
                        multiple
                        accept="image/*"
                        class="file-input"
                      />
                    </label>

                    <!-- แสดงรูปภาพที่เลือกใหม่ -->
                    <div v-if="newImages.length > 0" class="new-images">
                      <div v-for="(image, index) in newImages" :key="index" class="image-item">
                        <img :src="getImagePreview(image)" :alt="image.name" />
                        <button @click="removeNewImage(index)" class="remove-btn">
                          <i class="fas fa-times"></i>
                        </button>
                      </div>
                    </div>

                    <!-- แสดงรูปภาพที่มีอยู่ -->
                    <div v-if="activity.image_paths" class="current-images">
                      <div
                        v-for="(image, iIndex) in activity.image_paths.split(',')"
                        :key="iIndex"
                        class="thumbnail-container"
                      >
                        <div class="thumbnail">
                          <img
                            :src="`http://localhost:8088${image.trim()}`"
                            :alt="getFileName(image)"
                            loading="lazy"
                            @click="openImage(image.trim())"
                          />
                          <button 
                            v-if="editingId === activity.id"
                            @click.stop="deleteImage(activity, iIndex)" 
                            class="thumbnail-remove-btn"
                          >
                            <i class="fas fa-times"></i>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div class="edit-actions">
                    <button @click="saveEdit(activity)" class="btn-save">
                      <i class="fas fa-save"></i> บันทึก
                    </button>
                    <button @click="cancelEdit" class="btn-cancel">
                      <i class="fas fa-times"></i> ยกเลิก
                    </button>
                  </div>
                </div>
                <div v-else>
                  {{ activity.details }}
                </div>
              </td>
              <td>
                <div class="file-list" v-if="!editingId || editingId !== activity.id">
                  <template v-if="activity.file_paths">
                    <a
                      v-for="(file, fIndex) in activity.file_paths.split(',')"
                      :key="fIndex"
                      :href="`http://localhost:8088${file}`"
                      target="_blank"
                      class="file-link"
                    >
                      <i class="fas fa-file-alt"></i>
                      <span class="file-name">{{ getFileName(file) }}</span>
                    </a>
                  </template>
                  <span v-else class="no-files">-</span>
                </div>
              </td>
              <td>
                <div class="image-thumbnails" v-if="!editingId || editingId !== activity.id">
                  <template v-if="activity.image_paths">
                    <div
                      v-for="(image, iIndex) in activity.image_paths.split(',')"
                      :key="iIndex"
                      class="thumbnail-container"
                    >
                      <div class="thumbnail">
                        <img
                          :src="`http://localhost:8088${image.trim()}`"
                          :alt="getFileName(image)"
                          loading="lazy"
                          @click="openImage(image.trim())"
                        />
                      </div>
                    </div>
                  </template>
                  <span v-else class="no-images">-</span>
                </div>
              </td>
              <td>{{ formatDate(activity.created_at) }}</td>
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
                  @click="confirmDeletePrompt(activity)"
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

    <!-- เพิ่ม modal ยืนยันการลบ -->
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
            <p>คุณต้องการลบกิจกรรม "<span>{{ selectedActivity?.details }}</span>" ใช่หรือไม่?</p>
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
      error: null,
      showDeleteModal: false,
      selectedActivity: null,
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
        // แสดงระบบที่เปิดใช้งานทั้งหมด
        this.systemList = response.data.filter(system => system.is_active === 1);
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
      try {
        const d = new Date(date);
        const day = d.getDate().toString().padStart(2, '0');
        const month = (d.getMonth() + 1);
        const year = d.getFullYear() + 543;
        const hours = d.getHours().toString().padStart(2, '0');
        const minutes = d.getMinutes().toString().padStart(2, '0');
        const seconds = d.getSeconds().toString().padStart(2, '0');
        return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
      } catch (error) {
        console.error("Error formatting date:", error);
        return '';
      }
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
    openImage(imagePath) {
      try {
        const baseUrl = 'http://localhost:8088';
        const fullUrl = `${baseUrl}${imagePath}`;
        window.open(fullUrl, '_blank');
      } catch (error) {
        console.error('Error opening image:', error);
        this.toast.error('ไม่สามารถเปิดรูปภาพได้');
      }
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
    async confirmDeletePrompt(activity) {
      this.selectedActivity = activity;
      this.showDeleteModal = true;
    },
    async confirmDelete() {
      try {
        if (!this.selectedActivity) {
          this.toast.error('ไม่พบข้อมูลที่ต้องการลบ');
          return;
        }
        
        const response = await axios.delete(
          `http://localhost:8088/api/activities/${this.selectedActivity.id}`
        );

        if (response.data.status === 'success') {
          this.activities = this.activities.filter(
            activity => activity.id !== this.selectedActivity.id
          );
          this.toast.success('ลบกิจกรรมสำเร็จ');
          this.closeModal();
          await this.fetchActivities();
        } else {
          throw new Error(response.data.message || 'ไม่สามารถลบกิจกรรมได้');
        }
      } catch (error) {
        console.error('Error deleting activity:', error);
        this.toast.error(error.response?.data?.message || 'ไม่สามารถลบกิจกรรมได้');
      }
      this.showDeleteModal = false;
      this.selectedActivity = null;
    },
    closeModal() {
      this.showDeleteModal = false;
      this.selectedActivity = null;
    },
    async startEdit(activity) {
      this.editingId = activity.id;
      this.editedDetails = activity.details;
      this.editedActivity = {
        ...activity,
        editedInfo: {
          details: activity.details,
          file_paths: activity.file_paths,
          image_paths: activity.image_paths
        }
      };
      this.newFiles = [];
      this.newImages = [];
      this.toast.info("เริ่มแก้ไขข้อมูล");
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
      try {
        if (!this.editedDetails.trim()) {
          this.toast.error("กรุณากรอกรายละเอียด");
          return;
        }

        // ตรวจสอบข้อมูลผู้ใช้
        const userData = localStorage.getItem('userData');
        if (!userData) {
          this.toast.error("ไม่พบข้อมูลผู้ใช้งาน กรุณาเข้าสู่ระบบใหม่");
          return;
        }

        // ตรวจสอบข้อมูลแผนก
        const deptInfo = this.getUserDepartment;
        if (!deptInfo?.dept_change_code || !deptInfo?.dept_full) {
          this.toast.error("ไม่พบข้อมูลแผนก กรุณาเข้าสู่ระบบใหม่");
          return;
        }

        const formData = new FormData();
        formData.append("details", this.editedDetails.trim());
        formData.append("system_id", activity.system_id);
        formData.append("important_info", activity.important_info_original || activity.important_info);
        formData.append("dept_change_code", deptInfo.dept_change_code);
        formData.append("dept_full", deptInfo.dept_full);
        formData.append("created_by", JSON.parse(userData).emp_id);

        // เพิ่มไฟล์ใหม่
        if (this.newFiles.length > 0) {
          this.newFiles.forEach(file => {
            if (file.size > 10 * 1024 * 1024) { // 10MB limit
              throw new Error(`ไฟล์ ${file.name} มีขนาดใหญ่เกินไป (ไม่เกิน 10MB)`);
            }
            formData.append("files[]", file);
          });
        }

        // เพิ่มรูปภาพใหม่
        if (this.newImages.length > 0) {
          this.newImages.forEach(image => {
            if (image.size > 5 * 1024 * 1024) { // 5MB limit
              throw new Error(`รูปภาพ ${image.name} มีขนาดใหญ่เกินไป (ไม่เกิน 5MB)`);
            }
            formData.append("images[]", image);
          });
        }

        // ส่งข้อมูลไฟล์ที่ถูกลบ
        if (activity.deletedFiles?.length > 0) {
          activity.deletedFiles.forEach(file => {
            formData.append("removedFiles", file);
          });
        }

        // ส่งข้อมูลรูปภาพที่ถูกลบ
        if (activity.deletedImages?.length > 0) {
          activity.deletedImages.forEach(image => {
            formData.append("removedImages", image);
          });
        }

        console.log('Sending data:', {
          details: this.editedDetails,
          newFiles: this.newFiles,
          newImages: this.newImages,
          deletedFiles: activity.deletedFiles,
          deletedImages: activity.deletedImages
        });

        const response = await axios.put(
          `http://localhost:8088/api/activities/${activity.id}`,
          formData,
          {
            headers: {
              "Content-Type": "multipart/form-data"
            },
            timeout: 30000 // 30 seconds timeout
          }
        );

        if (response.data.status === 'success') {
          // อัพเดตข้อมูลในตัวแปร activities
          const index = this.activities.findIndex(a => a.id === activity.id);
          if (index !== -1) {
            this.activities[index] = {
              ...activity,
              details: this.editedDetails.trim(),
              file_paths: response.data.file_paths || null,
              image_paths: response.data.image_paths || null,
              updated_at: new Date().toISOString(),
              deletedFiles: [], // รีเซ็ตรายการไฟล์ที่ถูกลบ
              deletedImages: [] // รีเซ็ตรายการรูปภาพที่ถูกลบ
            };
          }

          this.toast.success("บันทึกการแก้ไขสำเร็จ");
          this.editingId = null;
          this.editedDetails = "";
          this.newFiles = [];
          this.newImages = [];
          
          // รีเฟรชข้อมูลทั้งหมด
          await this.fetchActivities();
        } else {
          throw new Error(response.data.message || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล');
        }
      } catch (error) {
        console.error("Error saving edit:", error);
        if (error.code === 'ECONNABORTED') {
          this.toast.error("การเชื่อมต่อกับเซิร์ฟเวอร์หมดเวลา กรุณาลองใหม่อีกครั้ง");
        } else {
          this.toast.error(error.response?.data?.message || error.message || "ไม่สามารถบันทึกการแก้ไขได้");
        }
      }
    },
    handleFileChange(event) {
      const files = Array.from(event.target.files);
      this.newFiles = files;
      this.toast.info(`เลือกไฟล์ ${files.length} ไฟล์`);
    },
    handleImageChange(event) {
      const files = Array.from(event.target.files);
      const validImages = files.filter(file => file.type.startsWith("image/"));
      if (validImages.length !== files.length) {
        this.toast.error("กรุณาเลือกไฟล์รูปภาพเท่านั้น");
        return;
      }
      this.newImages = validImages;
      this.toast.info(`เลือกรูปภาพ ${validImages.length} รูป`);
    },
    deleteFile(activity, fileIndex) {
      if (!confirm('คุณต้องการลบไฟล์นี้ใช่หรือไม่?')) {
        return;
      }

      const filePaths = activity.file_paths ? activity.file_paths.split(',') : [];
      const deletedFile = filePaths[fileIndex];
      
      // เก็บไฟล์ที่ถูกลบ
      if (!activity.deletedFiles) {
        activity.deletedFiles = [];
      }
      // ตัด http://localhost:8088 ออกจาก path
      const cleanPath = deletedFile.replace('http://localhost:8088', '');
      activity.deletedFiles.push(cleanPath);
      
      // ลบไฟล์ออกจาก array
      filePaths.splice(fileIndex, 1);
      activity.file_paths = filePaths.length > 0 ? filePaths.join(',') : null;
      
      this.toast.info("ไฟล์จะถูกลบเมื่อกดบันทึก");
    },
    deleteImage(activity, imageIndex) {
      if (!confirm('คุณต้องการลบรูปภาพนี้ใช่หรือไม่?')) {
        return;
      }

      const imagePaths = activity.image_paths ? activity.image_paths.split(',') : [];
      const deletedImage = imagePaths[imageIndex];
      
      // เก็บรูปภาพที่ถูกลบ
      if (!activity.deletedImages) {
        activity.deletedImages = [];
      }
      // ตัด http://localhost:8088 ออกจาก path
      const cleanPath = deletedImage.replace('http://localhost:8088', '');
      activity.deletedImages.push(cleanPath);
      
      // ลบรูปภาพออกจาก array
      imagePaths.splice(imageIndex, 1);
      activity.image_paths = imagePaths.length > 0 ? imagePaths.join(',') : null;
      
      this.toast.info("รูปภาพจะถูกลบเมื่อกดบันทึก");
    },
    removeNewFile(index) {
      this.newFiles.splice(index, 1);
      this.toast.info("ลบไฟล์ที่เลือกแล้ว");
    },
    removeNewImage(index) {
      this.newImages.splice(index, 1);
      this.toast.info("ลบรูปภาพที่เลือกแล้ว");
    },
    getImagePreview(file) {
      return URL.createObjectURL(file);
    },
  },
  watch: {
    selectedSystemId: {
      immediate: true,
      async handler(newVal) {
        if (newVal) {
          try {
            // เมื่อเลือกระบบ ให้โหลดข้อมูลสำคัญของระบบนั้น
            const response = await axios.get(
              `http://localhost:8088/api/system-details/${newVal}`
            );
            this.importantInfoList = response.data;
          } catch (error) {
            console.error('Error fetching important info:', error);
            this.toast.error('ไม่สามารถโหลดข้อมูลสำคัญได้');
          }
        } else {
          this.importantInfoList = [];
        }
      }
    },
    selectedImportantInfoId: {
      immediate: true,
      async handler(newVal) {
        if (newVal && this.selectedSystemId) {
          await this.fetchActivities();
        }
      }
    }
  },
  async created() {
    // โหลดข้อมูลระบบเมื่อ component ถูกสร้าง
    await this.fetchSystems();
    
    // ถ้ามีการเลือกระบบและข้อมูลสำคัญไว้ก่อนหน้า ให้โหลดข้อมูลกิจกรรม
    if (this.selectedSystemId && this.selectedImportantInfoId) {
      await this.fetchActivities();
    }
  },
  async mounted() {
    try {
      // โหลดข้อมูลระบบอีกครั้งเมื่อ component ถูก mount
      await this.fetchSystems();
      
      // ถ้ามีการเลือกระบบและข้อมูลสำคัญไว้ก่อนหน้า ให้โหลดข้อมูลกิจกรรม
      if (this.selectedSystemId && this.selectedImportantInfoId) {
        await this.fetchActivities();
      }
    } catch (error) {
      console.error('Error in mounted:', error);
      this.toast.error('เกิดข้อผิดพลาดในการโหลดข้อมูล');
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
}

.file-link {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #2c3e50;
  text-decoration: none;
  padding: 4px 8px;
  border-radius: 4px;
  transition: background-color 0.2s;
}

.file-link:hover {
  background-color: #f5f5f5;
  color: #42b983;
}

.file-name {
  word-break: break-word;
}

.image-thumbnails {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.thumbnail-container {
  position: relative;
  width: 100px;
  height: 100px;
}

.thumbnail {
  position: relative;
  width: 100%;
  height: 100%;
  border-radius: 4px;
  overflow: hidden;
  cursor: pointer;
  border: 1px solid #ddd;
  transition: transform 0.2s;
}

.thumbnail:hover {
  transform: scale(1.05);
}

.thumbnail img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.thumbnail-remove-btn {
  position: absolute;
  top: 4px;
  right: 4px;
  background: rgba(239, 68, 68, 0.9);
  color: white;
  border: none;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  z-index: 2;
}

.thumbnail-remove-btn:hover {
  background: #ef4444;
  transform: scale(1.1);
}

.no-files, .no-images {
  color: #999;
  font-style: italic;
}

i.fas.fa-file-alt {
  color: #42b983;
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
  min-height: 100px;
  padding: 12px;
  margin-bottom: 16px;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  resize: vertical;
}

.edit-files-section,
.edit-images-section {
  margin-top: 16px;
  padding: 16px;
  background: #f8fafc;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
}

.file-label {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: #e1f0fa;
  color: #3498db;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.file-label:hover {
  background: #3498db;
  color: white;
}

.file-input {
  display: none;
}

.new-files,
.current-files,
.new-images,
.current-images {
  margin-top: 12px;
  display: grid;
  gap: 8px;
}

.file-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
}

.file-link {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #2c3e50;
  text-decoration: none;
}

.file-link i {
  color: #3498db;
}

.image-item {
  position: relative;
  width: 120px;
  height: 120px;
  border-radius: 6px;
  overflow: hidden;
  border: 1px solid #e2e8f0;
}

.image-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.remove-btn {
  background: #fee2e2;
  color: #ef4444;
  border: none;
  width: 24px;
  height: 24px;
  border-radius: 4px;
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

.edit-actions {
  display: flex;
  gap: 8px;
  margin-top: 16px;
  justify-content: flex-end;
}

.btn-save,
.btn-cancel {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-save {
  background: #3498db;
  color: white;
}

.btn-save:hover {
  background: #2980b9;
}

.btn-cancel {
  background: #e2e8f0;
  color: #64748b;
}

.btn-cancel:hover {
  background: #cbd5e1;
}

.new-files,
.current-files {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.new-images,
.current-images {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 12px;
  margin-top: 12px;
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