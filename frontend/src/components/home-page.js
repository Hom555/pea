import axios from 'axios'

export default {
  name: 'HomePage',
  data() {
    return {
      totalActivities: 5,
      currentMonthActivities: 0,
      currentTime: new Date().toLocaleTimeString('th-TH'),
      lastUpdateTime: '',
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
  computed: {
    currentMonth() {
      return new Date().toLocaleString('th-TH', { month: 'long' })
    }
  },
  methods: {
    async fetchStats() {
      try {
        const [totalRes, monthlyRes] = await Promise.all([
          axios.get('http://localhost:8088/api/activities/count'),
          axios.get('http://localhost:8088/api/activities/current-month')
        ])
        
        this.totalActivities = totalRes.data.count
        this.currentMonthActivities = monthlyRes.data.count
        this.currentTime = new Date().toLocaleTimeString('th-TH')
      } catch (error) {
        console.error('Error fetching stats:', error)
      }
    },
    navigateTo(path) {
      this.$router.push(path)
    },
    updateTime() {
      this.currentTime = new Date().toLocaleTimeString('th-TH')
    }
  },
  mounted() {
    this.fetchStats()
    setInterval(this.updateTime, 1000)
  },
  beforeUnmount() {
    if (this.timeInterval) {
      clearInterval(this.timeInterval)
    }
  }
} 