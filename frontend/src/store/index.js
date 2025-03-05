import { createStore } from 'vuex';

// โหลดข้อมูลเริ่มต้นจาก localStorage
const userData = JSON.parse(localStorage.getItem('userData') || '{}');

export default createStore({
  state: {
    systems: {
      status: {} // เก็บสถานะการใช้งานของแต่ละระบบ
    },
    userDepartment: userData.dept_full ? {
      dept_change_code: userData.dept_change_code,
      dept_full: userData.dept_full
    } : null,
    fullName: userData.fullName || null
  },
  mutations: {
    SET_SYSTEM_STATUS(state, { systemId, status }) {
      state.systems.status[systemId] = status;
    },
    SET_USER_DEPARTMENT(state, department) {
      state.userDepartment = department;
    },
    SET_FULL_NAME(state, name) {
      state.fullName = name;
    }
  },
  actions: {
    updateSystemStatus({ commit }, { systemId, status }) {
      commit('SET_SYSTEM_STATUS', { systemId, status });
    },
    updateUserDepartment({ commit }, department) {
      commit('SET_USER_DEPARTMENT', department);
    },
    updateFullName({ commit }, name) {
      commit('SET_FULL_NAME', name);
    }
  },
  getters: {
    isSystemActive: (state) => (systemId) => {
      return state.systems.status[systemId] !== false;
    },
    getUserDepartment: state => state.userDepartment,
    getFullName: state => state.fullName
  }
}); 