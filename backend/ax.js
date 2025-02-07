const axios = require('axios');

axios.get('http://localhost:3007/api/data')
  .then(response => {
    // แสดงข้อมูลทั้งหมดที่ได้รับจาก API
    console.log('Raw API Response:', JSON.stringify(response.data, null, 2));

    // ตรวจสอบโครงสร้างข้อมูล
    if (!response.data?.data?.dataDetail) {
      throw new Error('ไม่พบข้อมูลที่ต้องการ');
    }

    const employeeData = response.data.data.dataDetail;
    employeeData.forEach(employee => {
      // แสดงข้อมูลแต่ละ field ที่สำคัญ
      console.log('Employee Raw Data:', employee);
      console.log('Title:', employee.title_s_desc);
      console.log('First Name:', employee.first_name);
      console.log('Last Name:', employee.last_name);
      console.log('Employee ID:', employee.emp_id);
      console.log('Department:', employee.dept_full);
      console.log('Role:', employee.role);
      console.log('------------------------');

      // สร้าง full name ตามรูปแบบที่ใช้ใน Sidebar
      const fullName = `${employee.title_s_desc || ''}${employee.first_name} ${employee.last_name}`;
      console.log('Formatted Full Name:', fullName);
    });
  })
  .catch(error => {
    // แสดงรายละเอียด error ที่เกิดขึ้น
    console.error('Error Details:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
      headers: error.response?.headers
    });
  });