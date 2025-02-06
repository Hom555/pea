import { createStore } from 'vuex';

export default createStore({
  state: {
    systems: {
      status: {} // เก็บสถานะการใช้งานของแต่ละระบบ
    }
  },
  mutations: {
    SET_SYSTEM_STATUS(state, { systemId, status }) {
      state.systems.status[systemId] = status;
    }
  },
  actions: {
    updateSystemStatus({ commit }, { systemId, status }) {
      commit('SET_SYSTEM_STATUS', { systemId, status });
    }
  },
  getters: {
    isSystemActive: (state) => (systemId) => {
      return state.systems.status[systemId] !== false;
    }
  }
}); 