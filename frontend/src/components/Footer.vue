<template>
    <footer class="footer">
      <div class="footer-content">
        <!-- Facebook -->
        <div class="footer-item">
          <font-awesome-icon icon="facebook" class="icon" />
          <a :href="facebookLink" target="_blank">{{ facebookText }}</a>
        </div>
        <!-- เบอร์โทร -->
        <div class="footer-item">
          <font-awesome-icon icon="phone" class="icon" />
          <span>{{ phone }}</span>
        </div>
        <!-- แผนที่ -->
        <div class="footer-item">
          <font-awesome-icon icon="map-marker-alt" class="icon" />
          <a :href="mapLink" target="_blank">เปิดแผนที่</a>
        </div>
      </div>
    </footer>
  </template>
  
  <script>
  export default {
    name: "Footer",
    data() {
      return {
        facebookLink: "https://facebook.com/yourpage",
        facebookText: "facebook.com/yourpage",
        phone: "081-234-5678",
        mapLink: "https://goo.gl/maps/yourmaplink",
      };
    },
  };
  </script>
  
  <style scoped>
  .footer {
    background-color: #ce9700;
    color: white;
    padding: 20px 10px;
  }
  
  .footer-content {
    display: flex;
    justify-content: space-around;
    align-items: center;
    flex-wrap: wrap;
  }
  
  .footer-item {
    display: flex;
    align-items: center;
    gap: 10px;
  }
  
  .icon {
    font-size: 24px;
    color: white;
  }
  
  a {
    color: white;
    text-decoration: none;
  }
  
  a:hover {
    text-decoration: underline;
  }
  
  @media (max-width: 768px) {
    .footer-content {
      flex-direction: column;
      gap: 15px;
    }
  }
  </style>
  