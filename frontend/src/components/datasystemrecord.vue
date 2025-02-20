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
        <button @click="showAddForm" class="btn-add">
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
                    @click="editRecord(record)"
                    class="btn-edit"
                    title="แก้ไข"
                  >
                    <i class="fas fa-edit"></i> แก้ไข
                  </button>
                  <button
                    @click="confirmDelete(record)"
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

    <div v-if="showDeleteConfirm" class="delete-confirm-overlay">
      <div class="delete-confirm-dialog">
        <div class="dialog-header">
          <i class="fas fa-exclamation-triangle warning-icon"></i>
          <h3>ยืนยันการลบข้อมูล</h3>
        </div>
        
        <div class="dialog-content">
          <p>คุณต้องการลบระบบ "{{ recordToDelete?.name_th }}" ใช่หรือไม่?</p>
          <p class="warning-text">การดำเนินการนี้ไม่สามารถยกเลิกได้</p>
        </div>

        <div class="dialog-actions">
          <button @click="cancelDelete" class="btn-cancel">
            <i class="fas fa-times"></i>
            ยกเลิก
          </button>
          <button @click="handleDelete" class="btn-confirm-delete">
            <i class="fas fa-trash-alt"></i>
            ยืนยันการลบ
          </button>
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
      lastInsertId: null
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
    async confirmDelete(record) {
      if (confirm(`ต้องการลบระบบ "${record.name_th}" ใช่หรือไม่?`)) {
        await this.deleteRecord(record.id);
      }
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
          const newRecord = {
            id: response.data.id,
            name_th: this.nameTH,
            name_en: this.nameEN,
            dept_change_code: department.dept_change_code,
            dept_full: department.dept_full,
            created_at: new Date().toISOString()
          };

          this.systemRecords = [newRecord, ...this.systemRecords];
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
      const response = await axios.get(`http://localhost:8088/api/system-records`);
      const system = response.data.find(s => s.id === parseInt(this.systemId));
      
      if (!system?.is_active) {
        this.toast.warning('ระบบนี้ถูกปิดการใช้งาน');
      }
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
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
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
