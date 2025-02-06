<template>
    <nav class="navbar">
      <!-- Brand Section -->
      <div class="navbar-brand">
        <h1 class="navbar-title">การไฟฟ้าส่วนภูมิภาค</h1>
      </div>
  
      <!-- User Info and Logout -->
      <div class="navbar-user">
        <div class="user-info">
          <div class="user-avatar">
            <i class="fas fa-user"></i>
          </div>
          <div class="user-details">
            <div class="user-name">Super Admin</div>
            <div class="user-role">ผู้ดูแลระบบ</div>
          </div>
        </div>
        <button class="logout-btn" @click="handleLogout">
          <i class="fas fa-sign-out-alt"></i>
          <span>ออกจากระบบ</span>
        </button>
      </div>
    </nav>
  </template>
  
  <script>
  export default {
    name: "Navbar",
    methods: {
      handleLogout() {
        if (confirm("ต้องการออกจากระบบใช่หรือไม่?")) {
          console.log("Logging out...");
          // เพิ่ม logic ออกจากระบบที่นี่
        }
      },
    },
  };
  </script>
  
  <style scoped>
  .navbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    background-color: #7B105A;
    color: white;
    padding: 10px 20px;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
  }
  
  .navbar-brand {
    display: flex;
    align-items: center;
  }
  
  .navbar-title {
    font-size: 1.25rem;
    font-weight: bold;
    margin: 0;
    color: white;
  }
  
  .navbar-user {
    display: flex;
    align-items: center;
    gap: 20px;
  }
  
  .user-info {
    display: flex;
    align-items: center;
    gap: 10px;
  }
  
  .user-avatar {
    width: 40px;
    height: 40px;
    background-color: rgba(255, 255, 255, 0.3);
    border-radius: 50%;
    display: flex;
    justify-content: center;
    align-items: center;
    color: white;
    font-size: 1.25rem;
  }
  
  .user-details {
    display: flex;
    flex-direction: column;
    text-align: right;
  }
  
  .user-name {
    font-weight: bold;
    font-size: 0.9rem;
    margin: 0;
  }
  
  .user-role {
    font-size: 0.8rem;
    color: rgba(255, 255, 255, 0.8);
    margin: 0;
  }
  
  .logout-btn {
    display: flex;
    align-items: center;
    background-color: transparent;
    border: none;
    color: white;
    font-size: 1rem;
    cursor: pointer;
    transition: color 0.3s ease;
    gap: 8px;
  }
  
  .logout-btn i {
    font-size: 1.2rem;
  }
  
  .logout-btn:hover {
    color: #ffcccb;
  }
  </style>
  