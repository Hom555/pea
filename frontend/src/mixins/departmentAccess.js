export const departmentAccess = {
  computed: {
    currentUser() {
      return JSON.parse(localStorage.getItem('user') || '{}');
    },
    
    userDepartment() {
      return this.currentUser.department;
    },

    userDeptCode() {
      return this.currentUser.dept_code;
    },

    isSuperAdmin() {
      return this.currentUser.role === 'superadmin';
    },

    isAdmin() {
      return this.currentUser.role === 'admin';
    },

    departmentTitle() {
      if (this.isSuperAdmin) return 'ทุกแผนก';
      return this.userDepartment;
    }
  },

  methods: {
    canAccessDepartment(deptCode) {
      // Super admin สามารถดูได้ทุกแผนก
      if (this.isSuperAdmin) return true;
      
      // Admin สามารถดูได้เฉพาะแผนกตัวเอง
      if (this.isAdmin) {
        return this.currentUser.dept_code === deptCode;
      }
      
      // User ปกติดูได้แค่แผนกตัวเอง
      return this.currentUser.dept_code === deptCode;
    },

    filterByDepartment(items) {
      if (this.isSuperAdmin) return items;
      return items.filter(item => item.dept_code === this.userDeptCode);
    },

    canAccessData(deptCode) {
      if (this.isSuperAdmin) return true;
      return this.userDeptCode === deptCode;
    },

    getDepartmentParams() {
      if (this.isSuperAdmin) return {};
      return { dept_code: this.userDeptCode };
    }
  }
}; 