<template>
    <div class="manage-users-container">
      <h1>Manage Users</h1>
      <p>Role: {{ role }}</p>
      <p v-if="role !== 'superadmin'">Department: {{ department }}</p>
  
      <h2>Available Users</h2>
      <div class="select-wrapper">
        <select v-model="selectedUser">
          <option value="">Select a user</option>
          <option v-for="user in users" :key="user.id" :value="user.id">
            {{ user.name }} ({{ user.department || 'No Department' }})
          </option>
        </select>
        <i class="fas fa-chevron-down select-icon"></i>
      </div>
      <button @click="addUserToDepartment" class="btn-primary">Add User to Department</button>
  
      <p class="message">{{ message }}</p>
    </div>
  </template>
  
  <script>
  import axios from 'axios';
  
  export default {
    data() {
      return {
        role: 'superadmin', // Mock: เปลี่ยนเป็น 'admin' หรือ 'superadmin'
        department: 'HR', // Mock: แผนกของ admin
        users: [], // เก็บรายชื่อผู้ใช้ที่ดึงจาก API
        selectedUser: '', // ID ของผู้ใช้ที่เลือก
        message: '', // ข้อความแสดงสถานะ
      };
    },
    mounted() {
      this.fetchUsers();
    },
    methods: {
      // ดึงรายชื่อผู้ใช้จาก API
      async fetchUsers() {
        try {
          const response = await axios.get('http://localhost:6161/api/users', {
            params: {
              role: this.role,
              department: this.department,
            },
          });
          this.users = response.data.users; // เก็บข้อมูลผู้ใช้
          this.message = ''; // รีเซ็ตข้อความแสดงข้อผิดพลาด
        } catch (error) {
          console.error('Error fetching users:', error);
          this.message = 'Error fetching users';
        }
      },
      // เพิ่มผู้ใช้เข้าแผนก
      async addUserToDepartment() {
        if (!this.selectedUser) {
          this.message = 'Please select a user'; // ตรวจสอบว่าผู้ใช้ถูกเลือก
          return;
        }
  
        try {
          const response = await axios.post('http://localhost:6161/api/add-to-department', {
            userId: this.selectedUser,
            department: this.department,
          });
          this.message = response.data.message; // แสดงข้อความตอบกลับจาก API
          this.fetchUsers(); // รีเฟรชรายชื่อผู้ใช้
        } catch (error) {
          console.error('Error adding user to department:', error);
          this.message = 'Error adding user to department';
        }
      },
    },
  };
  </script>
  
  <style scoped>
  .manage-users-container {
    max-width: 600px;
    margin: 2rem auto;
    padding: 1rem;
    background: #fff;
    border-radius: 8px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  }
  
  h1 {
    font-size: 1.8rem;
    margin-bottom: 1rem;
    color: #333;
  }
  
  h2 {
    font-size: 1.5rem;
    margin-bottom: 1rem;
    color: #555;
  }
  
  p {
    font-size: 1rem;
    color: #666;
  }
  
  .select-wrapper {
    position: relative;
    margin-bottom: 1rem;
  }
  
  select {
    width: 100%;
    padding: 0.75rem 1rem;
    border: 1px solid #ddd;
    border-radius: 8px;
    font-size: 1rem;
    appearance: none;
    background: #fff;
    color: #333;
    transition: border-color 0.3s ease;
  }
  
  select:focus {
    border-color: #722257;
    outline: none;
  }
  
  .select-icon {
    position: absolute;
    right: 1rem;
    top: 50%;
    transform: translateY(-50%);
    color: #aaa;
    pointer-events: none;
  }
  
  .btn-primary {
    display: inline-block;
    padding: 0.75rem 1.5rem;
    background: #722257;
    color: #fff;
    border: none;
    border-radius: 8px;
    font-size: 1rem;
    cursor: pointer;
    transition: background 0.3s ease;
  }
  
  .btn-primary:hover {
    background: #5a1d45;
  }
  
  .message {
    margin-top: 1rem;
    font-size: 1rem;
    color: #e74c3c;
  }
  </style>
  