import { createStore } from 'vuex';

export default createStore({
  state: {
    systems: {
      status: {} // เก็บสถานะการใช้งานของแต่ละระบบ
    },
    userDepartment: null
  },
  mutations: {
    SET_SYSTEM_STATUS(state, { systemId, status }) {
      state.systems.status[systemId] = status;
    },
    SET_USER_DEPARTMENT(state, department) {
      state.userDepartment = department;
    }
  },
  actions: {
    updateSystemStatus({ commit }, { systemId, status }) {
      commit('SET_SYSTEM_STATUS', { systemId, status });
    },
    updateUserDepartment({ commit }, department) {
      commit('SET_USER_DEPARTMENT', department);
    }
  },
  getters: {
    isSystemActive: (state) => (systemId) => {
      return state.systems.status[systemId] !== false;
    },
    getUserDepartment: state => state.userDepartment
  }
}); 