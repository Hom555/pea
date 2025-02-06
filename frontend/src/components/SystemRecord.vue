<template>
  <div class="container">
    <h1>บันทึกข้อมูลระบบ</h1>
    <form @submit.prevent="saveSystemRecord" class="form">
      <div class="form-group">
        <label for="nameTH">ชื่อภาษาไทย</label>
        <input type="text" v-model="nameTH" id="nameTH" required />
      </div>
      <div class="form-group">
        <label for="nameEN">ชื่อภาษาอังกฤษ</label>
        <input type="text" v-model="nameEN" id="nameEN" required />
      </div>
      <button type="submit" class="btn-submit">บันทึก</button>
    </form>
  </div>
</template>

<script>
import axios from "axios";

export default {
  data() {
    return {
      nameTH: "",
      nameEN: "",
      files: [],
    };
  },
  methods: {
    handleFileUpload(event) {
      this.files = event.target.files;
    },
    async submitForm() {
      const formData = new FormData();
      formData.append("systemId", this.selectedSystemId);
      formData.append("importantInfo", this.importantInfo);
      formData.append("referenceNo", this.referenceNo);
      formData.append("additionalInfo", this.additionalInfo);
      if (this.files) {
        for (let i = 0; i < this.files.length; i++) {
          formData.append("files", this.files[i]);
        }
      }
    },
    async saveSystemRecord() {
      try {
        await axios.post("http://localhost:8881/api/system-record", {
          nameTH: this.nameTH,
          nameEN: this.nameEN,
        });
        alert("บันทึกข้อมูลสำเร็จ");
        this.nameTH = "";
        this.nameEN = "";
      } catch (error) {
        console.error("เกิดข้อผิดพลาด:", error);
      }
    },
  },
};
</script>

<style scoped>
.container {
  max-width: 600px;
  margin: 40px auto;
  padding: 20px;
  background-color: #ffffff;
  border-radius: 10px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

h1 {
  text-align: center;
  color: #333333;
  font-family: "Arial", sans-serif;
  margin-bottom: 20px;
}

.form {
  display: flex;
  flex-direction: column;
}

.form-group {
  margin-bottom: 20px;
}

label {
  font-size: 16px;
  font-weight: 600;
  color: #555555;
  margin-bottom: 8px;
  display: block;
}

input {
  width: 100%;
  padding: 10px;
  border: 1px solid #dddddd;
  border-radius: 5px;
  font-size: 16px;
  color: #333333;
}

input:focus {
  border-color: #460d54;
  outline: none;
}

.btn-submit {
  background-color: #5f195c;
  color: white;
  font-size: 16px;
  font-weight: 600;
  padding: 10px;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

.btn-submit:hover {
  background-color: #460d54;
}

.btn-submit:active {
  background-color: #5f195c;
}
</style>
