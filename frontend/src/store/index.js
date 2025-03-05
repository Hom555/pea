import { createStore } from 'vuex';

export default createStore({
  state: {
    systems: {
      status: {} // เก็บสถานะการใช้งานของแต่ละระบบ
    },
    userDepartment: null,
    fullName: null // เพิ่ม state สำหรับเก็บชื่อ-นามสกุล
  },
  mutations: {
    SET_SYSTEM_STATUS(state, { systemId, status }) {
      state.systems.status[systemId] = status;
    },
    SET_USER_DEPARTMENT(state, department) {
      state.userDepartment = department;
    },
    SET_FULL_NAME(state, name) { // เพิ่ม mutation สำหรับอัพเดตชื่อ-นามสกุล
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
    updateFullName({ commit }, name) { // เพิ่ม action สำหรับอัพเดตชื่อ-นามสกุล
      commit('SET_FULL_NAME', name);
    }
  },
  getters: {
    isSystemActive: (state) => (systemId) => {
      return state.systems.status[systemId] !== false;
    },
    getUserDepartment: state => state.userDepartment,
    getFullName: state => state.fullName // เพิ่ม getter สำหรับดึงชื่อ-นามสกุล
  }
}); 