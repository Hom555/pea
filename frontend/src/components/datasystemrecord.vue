<template>
  <div class="container">
  
    <div class="header">
      <h1>ข้อมูลระบบ</h1>
      <p class="subtitle">รายการระบบงาน</p>
      <div class="header-actions">
        <div class="search-box">
          <i class="fas fa-search search-icon"></i>
          <input
            type="text"
            v-model="searchQuery"
            placeholder="ค้นหาชื่อระบบ..."
            class="search-input"
          />
        </div>
        <button v-if="userRole === 3 || userRole === 2" @click="showAddForm" class="btn-add">
          <i class="fas fa-plus"></i> เพิ่มระบบใหม่
        </button>
      </div>
    </div>

    <div class="table-container">
      <div v-if="filteredRecords.length > 0">
        <table>
          <thead>
            <tr>
              <th class="th-no">ลำดับ</th>
              <th class="th-name">ชื่อระบบงาน</th>
              <th class="th-dept">แผนก</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(record, index) in filteredRecords" :key="record.id">
              <td class="td-no">{{ index + 1 }}</td>
              <td>
                <div class="system-name">
                  <div class="name-th">{{ record.name_th }}</div>
                  <div class="name-en">{{ record.name_en }}</div>
                </div>
              </td>
              <td>{{ record.dept_full }}</td>
              <td>
                <div class="action-buttons">
                  <button
                    v-if="userRole === 3 || userRole === 2"
                    @click="editRecord(record)"
                    class="btn-edit"
                    title="แก้ไข"
                  >
                    <i class="fas fa-edit"></i> แก้ไข
                  </button>
                  <button
                    v-if="userRole === 3 || userRole === 2"
                    @click="confirmDeletePrompt(record)"
                    class="btn-delete"
                    title="ลบ"
                  >
                    <i class="fas fa-trash"></i> ลบ
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div v-else class="no-data">
        <i class="fas fa-inbox"></i>
        <p>{{ searchQuery ? "ไม่พบข้อมูลที่ค้นหา" : "ไม่พบข้อมูลระบบ" }}</p>
      </div>
    </div>

    <div
      v-if="isEditing || isAdding"
      class="modal-overlay"
      @click.self="cancelEdit"
    >
      <div class="edit-form">
        <h2>{{ isAdding ? "เพิ่มระบบใหม่" : "แก้ไขข้อมูล" }}</h2>
        <form
          @submit.prevent="isAdding ? addSystemRecord() : updateSystemRecord()"
        >
          <div class="form-group">
            <label for="editNameTH"
              >ชื่อภาษาไทย <span class="required">*</span></label
            >
            <input
              type="text"
              :value="isAdding ? nameTH : editNameTH"
              @input="e => isAdding ? nameTH = e.target.value : editNameTH = e.target.value"
              id="editNameTH"
              required
              class="form-input"
              placeholder="กรุณากรอกชื่อระบบภาษาไทย"
            />
          </div>
          <div class="form-group">
            <label for="editNameEN"
              >ชื่อภาษาอังกฤษ <span class="required">*</span></label
            >
            <input
              type="text"
              :value="isAdding ? nameEN : editNameEN"
              @input="e => isAdding ? nameEN = e.target.value : editNameEN = e.target.value"
              id="editNameEN"
              required
              class="form-input"
              placeholder="กรุณากรอกชื่อระบบภาษาอังกฤษ"
            />
          </div>
          <div class="form-actions">
            <button type="button" @click="cancelEdit" class="btn-cancel">
              <i class="fas fa-times"></i> ยกเลิก
            </button>
            <button type="submit" class="btn-submit" :disabled="isSubmitting">
              <i class="fas fa-save"></i>
              {{ isAdding ? "เพิ่มระบบ" : "บันทึก" }}
            </button>
          </div>
        </form>
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
  </div>
</template>

<script>
import axios from "axios";
import { mapGetters, mapActions } from 'vuex';
import { useToast } from 'vue-toastification';

export default {
  setup() {
    const toast = useToast();
    return { toast }
  },
  data() {
    return {
      systemRecords: [],
      isEditing: false,
      isAdding: false,
      editRecordId: null,
      editNameTH: "",
      editNameEN: "",
      nameTH: "",
      nameEN: "",
      searchQuery: "",
      isSubmitting: false,
      lastInsertId: null,
      showDeleteModal: false,
      selectedSystem: null,
      userRole: null,
    };
  },
  computed: {
    ...mapGetters(['isSystemActive', 'getUserDepartment']),
    systemId() {
      return this.$route.params.id;
    },
    filteredRecords() {
      if (!this.systemRecords) return [];
      
      let records = [...this.systemRecords];
      
      // กรองระบบที่ถูกปิดใช้งาน
      records = records.filter(record => record.is_active === 1);
      
      // กรองตามคำค้นหา
      if (this.searchQuery) {
        const query = this.searchQuery.toLowerCase();
        records = records.filter(record =>
          record.name_th.toLowerCase().includes(query) ||
          record.name_en.toLowerCase().includes(query)
        );
      }
      
      console.log('Filtered records:', records.length);
      return records;
    },
  },
  methods: {
    ...mapActions(['updateSystemStatus']),
    async fetchSystemRecords() {
      try {
        console.log('Fetching system records...');
        const response = await axios.get("http://localhost:8088/api/system-records");
        console.log('Response:', response.data);
        
        // เรียงข้อมูลตาม ID จากมากไปน้อย
        this.systemRecords = (response.data || []).sort((a, b) => b.id - a.id);
      } catch (error) {
        console.error("Error fetching records:", error);
        this.toast.error("ไม่สามารถดึงข้อมูลได้");
        this.systemRecords = [];
      }
    },
    async deleteRecord(id) {
      try {
        await axios.delete(`http://localhost:8088/api/system-record/${id}`);
        await this.fetchSystemRecords();
      } catch (error) {
        console.error("Error deleting record:", error);
        this.toast.error("ไม่สามารถลบข้อมูลได้");
      }
    },
    editRecord(record) {
      this.isEditing = true;
      this.editRecordId = record.id;
      this.editNameTH = record.name_th;
      this.editNameEN = record.name_en;
    },
    async updateSystemRecord() {
      try {
        await axios.put(
          `http://localhost:8088/api/system-record/${this.editRecordId}`,
          {
            nameTH: this.editNameTH,
            nameEN: this.editNameEN,
            dept_full: this.getUserDepartment.dept_full,
            dept_change_code: this.getUserDepartment.dept_change_code
          }
        );
        await this.fetchSystemRecords();
        this.cancelEdit();
      } catch (error) {
        console.error("Error updating record:", error);
        this.toast.error("ไม่สามารถอัปเดตข้อมูลได้");
      }
    },
    cancelEdit() {
      this.isEditing = false;
      this.isAdding = false;
      this.editRecordId = null;
      this.editNameTH = "";
      this.editNameEN = "";
      this.nameTH = "";
      this.nameEN = "";
      this.isSubmitting = false;
    },
    confirmDeletePrompt(record) {
      this.selectedSystem = record;
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
          this.systemRecords = this.systemRecords.filter(
            record => record.id !== this.selectedSystem.id
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
    closeModal() {
      this.showDeleteModal = false;
      this.selectedSystem = null;
    },
    showAddForm() {
      this.isAdding = true;
      this.nameTH = "";
      this.nameEN = "";
    },
    async addSystemRecord() {
      try {
        if (!this.nameTH || !this.nameEN) {
          this.toast.error("กรุณากรอกชื่อระบบทั้งภาษาไทยและภาษาอังกฤษ");
          return;
        }

        const department = this.getUserDepartment;
        if (!department?.dept_change_code || !department?.dept_full) {
          console.error('Department info missing:', department);
          this.toast.error("ข้อมูลแผนกไม่ครบถ้วน กรุณาลองใหม่อีกครั้ง");
          return;
        }

        this.isSubmitting = true;

        const data = {
          nameTH: this.nameTH.trim(),
          nameEN: this.nameEN.trim(),
          dept_change_code: department.dept_change_code,
          dept_full: department.dept_full
        };

        console.log('Sending data:', data);

        const response = await axios.post("http://localhost:8088/api/system-record", data);
        console.log('Response:', response.data);

        if (response.data.status === 'success') {
          // เรียกดึงข้อมูลใหม่ทั้งหมดแทนการเพิ่มข้อมูลเข้า array
          await this.fetchSystemRecords();
          
          this.toast.success('บันทึกข้อมูลสำเร็จ');
          this.cancelEdit();
        }
      } catch (error) {
        console.error("Error adding system:", error);
        const errorMessage = error.response?.data?.message || "ไม่สามารถบันทึกข้อมูลได้";
        this.toast.error(errorMessage);
      } finally {
        this.isSubmitting = false;
      }
    },
  },
  async created() {
    try {
      // ตรวจสอบ role ของผู้ใช้
      const response = await axios.get('http://localhost:8088/api/check-permission');
      this.userRole = response.data.data.role_id;

      const systemResponse = await axios.get(`http://localhost:8088/api/system-records`);
      const system = systemResponse.data.find(s => s.id === parseInt(this.systemId));
      

    } catch (error) {
      console.error('Error checking system status:', error);
      this.toast.error('ไม่สามารถตรวจสอบสถานะระบบได้');
    }
  },
  async mounted() {
    try {
      console.log('Component mounting...');
      await this.fetchSystemRecords();
    } catch (error) {
      console.error("Error in mounted:", error);
      this.toast.error("เกิดข้อผิดพลาดในการโหลดข้อมูล");
    }
  },
};
</script>
<style scoped>
.container {
  max-width: 1000px;
  margin: 40px auto;
  padding: 20px;
  background-color: #ffffff;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.header {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 20px;
}

h1 {
  color: #2c3e50;
  font-size: 1.8rem;
  margin: 0;
}

.subtitle {
  color: #666;
  font-size: 0.9rem;
}

.header-actions {
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 20px;
}

.table-container {
  background: white;
  border-radius: 8px;
  overflow: hidden;
}

table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 20px;
  font-size: 0.95rem;
}

thead {
  background-color: #f8f9fa;
}

th {
  padding: 15px 20px;
  font-weight: 600;
  color: #2c3e50;
  text-align: left;
  border-bottom: 2px solid #e2e8f0;
}

.th-actions {
  text-align: right; /* Center align the header text */
}

td {
  padding: 15px 20px;
  border-bottom: 1px solid #e2e8f0;
  vertical-align: middle;
}

.system-name {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.name-th {
  font-weight: 500;
  color: #2c3e50;
}

.name-en {
  font-size: 0.9em;
  color: #64748b;
}

.action-buttons {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
  align-items: center; /* Align items vertically */
}

.btn-edit,
.btn-delete {
  width: 100px;
  height: 32px;
  border: none;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  gap: 5px;
}

.btn-edit {
  background-color: #3b82f6;
  color: white;
}

.btn-delete {
  background-color: #ef4444;
  color: white;
}

.btn-edit:hover,
.btn-delete:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
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

.edit-form {
  background: white;
  padding: 30px;
  border-radius: 12px;
  width: 90%;
  max-width: 500px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.edit-form h2 {
  color: #2c3e50;
  margin-bottom: 20px;
  font-size: 1.5rem;
}

.form-group {
  margin-bottom: 20px;
}

label {
  display: block;
  font-weight: 500;
  margin-bottom: 8px;
  color: #2c3e50;
}

.required {
  color: #ef4444;
  margin-left: 3px;
}

.form-input {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  font-size: 0.95rem;
  transition: all 0.2s ease;
}

.form-input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.form-actions {
  display: flex;
  gap: 12px;
  margin-top: 24px;
}

.btn-submit,
.btn-cancel {
  padding: 10px 20px;
  border: none;
  border-radius: 6px;
  font-size: 0.95rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: all 0.2s ease;
}

.btn-submit {
  background-color: #3b82f6;
  color: white;
  flex: 2;
  justify-content: center;
}

.btn-cancel {
  background-color: #64748b;
  color: white;
  flex: 1;
  justify-content: center;
}

.no-data {
  text-align: center;
  padding: 40px 20px;
  color: #64748b;
}

.no-data i {
  font-size: 3rem;
  margin-bottom: 10px;
}

@media (max-width: 640px) {
  .container {
    margin: 20px;
    padding: 15px;
  }

  th,
  td {
    padding: 12px 15px;
  }

  .form-actions {
    flex-direction: column;
  }

  .btn-submit,
  .btn-cancel {
    width: 100%;
  }
}

.search-container {
  margin-bottom: 20px;
}

.search-box {
  position: relative;
  max-width: 400px;
  margin-right: auto;
}

.search-icon {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: #64748b;
}

.search-input {
  width: 100%;
  padding: 10px 12px 10px 35px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 0.95rem;
  transition: all 0.2s ease;
}

.search-input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.btn-add {
  padding: 10px 20px;
  background-color: #10b981;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 0.95rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.2s ease;
}

.btn-add:hover {
  background-color: #059669;
}

.system-disabled {
  text-align: center;
  padding: 2rem;
  background-color: #f8f9fa;
  border-radius: 8px;
  margin: 2rem auto;
  max-width: 600px;
}

.system-disabled h2 {
  color: #dc3545;
  margin-bottom: 1rem;
}

.system-disabled p {
  color: #6c757d;
}
</style>
