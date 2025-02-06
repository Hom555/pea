<template>
  <div class="home">
    <div class="content-wrapper">
      <div class="welcome-section animate-in" style="--delay: 0.1s">
        <div class="welcome-content">
          <div class="welcome-decoration">
            <div class="circle"></div>
            <div class="line"></div>
          </div>
        </div>
      </div>

      <div class="stats-grid">
        <div class="stat-card animate-in" style="--delay: 0.2s">
          <div class="stat-icon pulse">
            <i class="fas fa-calendar-check"></i>
          </div>
          <div class="stat-content">
            <h3>กิจกรรมทั้งหมด</h3>
            <div class="stat-value">{{ totalActivities }}</div>
            <div class="stat-footer">
              <i class="fas fa-clock"></i>
              <span>อัพเดตล่าสุด {{ currentTime }}</span>
            </div>
          </div>
          <div class="stat-decoration"></div>
        </div>

        <div class="stat-card animate-in" style="--delay: 0.3s">
          <div class="stat-icon pulse">
            <i class="fas fa-chart-line"></i>
          </div>
          <div class="stat-content">
            <h3>กิจกรรมเดือนนี้</h3>
            <div class="stat-value">
              {{ currentMonthActivities }}
            </div>
            <div class="stat-footer">
              <i class="fas fa-calendar"></i>
              <span>เดือน {{ currentMonth }}</span>
            </div>
          </div>
          <div class="stat-decoration"></div>
        </div>
      </div>

      <div v-if="isSuperAdmin" class="quick-actions">
        <div class="section-title animate-in" style="--delay: 0.4s">
          <h2>การจัดการระบบ</h2>
          <div class="title-decoration"></div>
        </div>

        <div class="quick-actions-grid">
          <div v-for="(action, index) in adminActions" 
               :key="index"
               class="action-card animate-in"
               :style="{ '--delay': `${0.5 + index * 0.1}s` }"
               @click="navigateTo(action.path)">
            <div class="action-icon-wrapper">
              <div class="action-icon">
                <i :class="action.icon"></i>
              </div>
              <div class="icon-ring"></div>
            </div>
            <div class="action-content">
              <h3>{{ action.title }}</h3>
              <p>{{ action.description }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import HomePageScript from './home-page.js'
export default HomePageScript
</script>

<style scoped>
/* ปรับสีพื้นหลัก */
.home {
  min-height: 100vh;
  background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
  background-image: 
    radial-gradient(circle at 20% 20%, rgba(99, 102, 241, 0.05) 0%, transparent 40%),
    radial-gradient(circle at 80% 80%, rgba(56, 189, 248, 0.05) 0%, transparent 40%);
  color: #1e293b;
  position: fixed;
  top: 0;
  left: 260px;
  right: 0;
  bottom: 0;
  overflow-y: auto;
  padding: 2rem;
}

.content-wrapper {
  max-width: 1400px;
  margin: 0 auto;
  padding: 2rem;
}

/* ปรับสี Welcome Section */
.welcome-section {
  text-align: center;
  margin-bottom: 4rem;
  position: relative;
}

.welcome-content {
  position: relative;
  z-index: 2;
}

.welcome-section h1 {
  font-size: 3rem;
  font-weight: 800;
  margin-bottom: 1rem;
  background: linear-gradient(120deg, #1e293b, #334155);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.1);
}

.subtitle {
  font-size: 1.3rem;
  color: #64748b;
  max-width: 600px;
  margin: 0 auto;
  line-height: 1.6;
}

.welcome-decoration {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 100%;
  height: 100%;
  z-index: 1;
}

/* Stats Cards */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2rem;
  margin-bottom: 4rem;
}

.stat-card {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 24px;
  padding: 2rem;
  position: relative;
  overflow: hidden;
  transition: all 0.3s ease;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
}

.stat-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  border-color: #cbd5e1;
}

.stat-icon {
  width: 60px;
  height: 60px;
  background: linear-gradient(135deg, #6366f1, #4f46e5);
  box-shadow: 0 4px 6px -1px rgba(99, 102, 241, 0.4);
  border-radius: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.8rem;
  margin-bottom: 1.5rem;
  color: white;
}

.stat-content h3 {
  color: #64748b;
  font-size: 1.1rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
}

.stat-value {
  color: #1e293b;
  font-size: 2.5rem;
  font-weight: 700;
  margin: 1rem 0;
}

.stat-footer {
  color: #94a3b8;
  font-size: 0.9rem;
}

/* Quick Actions */
.quick-actions {
  position: relative;
}

.section-title {
  text-align: center;
  margin-bottom: 3rem;
  position: relative;
}

.section-title h2 {
  font-size: 2.2rem;
  color: #1e293b;
  margin-bottom: 1rem;
  font-weight: 700;
}

.title-decoration {
  width: 100px;
  height: 4px;
  background: linear-gradient(90deg, transparent, #6366f1, transparent);
  margin: 1rem auto;
}

.quick-actions-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 2rem;
}

.action-card {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 20px;
  padding: 2rem;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
}

.action-card:hover {
  transform: translateY(-5px) scale(1.02);
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  border-color: #cbd5e1;
}

.action-icon-wrapper {
  position: relative;
  margin-bottom: 1.5rem;
}

.action-icon {
  width: 50px;
  height: 50px;
  background: linear-gradient(135deg, #6366f1, #4f46e5);
  box-shadow: 0 4px 6px -1px rgba(99, 102, 241, 0.4);
  border-radius: 15px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  color: white;
}

.icon-ring {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 70px;
  height: 70px;
  border: 2px solid rgba(94, 114, 228, 0.2);
  border-radius: 20px;
  transition: all 0.3s ease;
  box-shadow: 0 0 15px rgba(94, 114, 228, 0.1);
}

.action-card:hover .icon-ring {
  transform: translate(-50%, -50%) scale(1.2);
  border-color: rgba(94, 114, 228, 0.3);
  box-shadow: 0 0 20px rgba(94, 114, 228, 0.2);
}

/* Animations */
@keyframes pulse {
  0% { transform: scale(1); }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); }
}

.pulse {
  animation: pulse 2s infinite;
}

/* Responsive Design */
@media (max-width: 1024px) {
  .home {
    left: 70px;
  }
}

@media (max-width: 768px) {
  .home {
    padding: 1rem;
    left: 0;
  }

  .welcome-section h1 {
    font-size: 2rem;
  }

  .content-wrapper {
    padding: 1rem;
  }

  .stats-grid, .quick-actions-grid {
    grid-template-columns: 1fr;
  }
}

/* ปรับสี hover effects */
.action-card:hover .action-icon {
  background: linear-gradient(135deg, #4A5EF7, #3A4EE7);
  transform: scale(1.1);
}

.stat-card:hover .stat-icon {
  background: linear-gradient(135deg, #4A5EF7, #3A4EE7);
  transform: scale(1.1);
}

/* ปรับสี scrollbar */
::-webkit-scrollbar {
  width: 8px;
}

::-webkit-scrollbar-track {
  background: #f1f5f9;
}

::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}

/* ปรับสี Glow effect */
.stat-icon::after, .action-icon::after {
  content: '';
  position: absolute;
  top: -2px;
  left: -2px;
  right: -2px;
  bottom: -2px;
  background: linear-gradient(135deg, #3A4EE7, #2E3AC9);
  border-radius: inherit;
  z-index: -1;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.stat-card:hover .stat-icon::after,
.action-card:hover .action-icon::after {
  opacity: 0.6;
}
</style>
