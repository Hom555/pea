import axios from 'axios'

export default {
  name: 'HomePage',
  data() {
    return {
      adminActions: [
        {
          title: 'จัดการระบบ',
          description: 'ตั้งค่าและจัดการระบบทั้งหมด',
          icon: 'fas fa-cogs',
          path: '/super-admin'
        },
        {
          title: 'จัดการผู้ใช้',
          description: 'จัดการสิทธิ์และข้อมูลผู้ใช้งาน',
          icon: 'fas fa-users-cog',
          path: '/user-management'
        },
        {
          title: 'ภาพรวมกิจกรรม',
          description: 'ดูภาพรวมกิจกรรมทั้งหมดในระบบ',
          icon: 'fas fa-chart-line',
          path: '/super-admin/activities'
        }
      ]
    }
  },
  methods: {
    navigateTo(path) {
      this.$router.push(path)
    }
  }
} 