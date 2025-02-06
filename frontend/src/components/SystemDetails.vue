<template>
  <div v-if="system && system.is_active">
    <div class="container">
      <!-- เนื้อหาเดิม -->
    </div>
  </div>
  <div v-else class="system-disabled">
    <div class="error-container">
      <h2>ระบบถูกปิดการใช้งาน</h2>
      <p>กรุณาติดต่อผู้ดูแลระบบเพื่อเปิดใช้งาน</p>
      <button @click="goBack" class="btn-back">
        <i class="fas fa-arrow-left"></i> กลับหน้าหลัก
      </button>
    </div>
  </div>
</template>

<script>
import axios from 'axios';
import { useToast } from 'vue-toastification';
import { useRouter } from 'vue-router';

export default {
  setup() {
    const toast = useToast();
    const router = useRouter();
    return { toast, router }
  },
  data() {
    return {
      system: null,
      error: null,
      loading: true
    }
  },
  methods: {
    goBack() {
      this.router.push('/');
    },
    async checkSystemStatus() {
      try {
        const response = await axios.get(
          `http://localhost:8881/api/system-details/${this.$route.params.id}`
        );
        
        if (response.data.status === 'error' || !response.data.is_active) {
          this.error = 'ระบบนี้ถูกปิดการใช้งาน';
          this.toast.error('ระบบนี้ถูกปิดการใช้งาน');
          this.router.push('/');
          return false;
        }

        this.system = response.data;
        return true;
      } catch (error) {
        this.error = 'ระบบนี้ถูกปิดการใช้งาน';
        this.toast.error('ระบบนี้ถูกปิดการใช้งาน');
        this.router.push('/');
        return false;
      }
    }
  },
  async created() {
    const isActive = await this.checkSystemStatus();
    if (!isActive) {
      this.router.push('/');
    }
    this.loading = false;
  },
  watch: {
    '$route': {
      async handler() {
        const isActive = await this.checkSystemStatus();
        if (!isActive) {
          this.router.push('/');
        }
      },
      immediate: true
    }
  }
}
</script>

<style scoped>
.system-disabled {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 60vh;
}

.error-container {
  text-align: center;
  padding: 2rem;
  background-color: #f8d7da;
  border-radius: 8px;
  max-width: 500px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.error-container h2 {
  color: #dc3545;
  margin-bottom: 1rem;
}

.error-container p {
  color: #6c757d;
  margin-bottom: 1.5rem;
}

.btn-back {
  padding: 0.5rem 1rem;
  background-color: #6c757d;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.btn-back:hover {
  background-color: #5a6268;
}

.loading {
  text-align: center;
  padding: 2rem;
  color: #666;
}
</style> 