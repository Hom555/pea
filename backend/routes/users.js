const express = require('express');
const router = express.Router();
const pool = require('../config/database');

// ดึงข้อมูลผู้ใช้ทั้งหมด
router.get('/users', async (req, res) => {
  try {
    const { dept_code } = req.query;
    let query = 'SELECT * FROM users';
    let params = [];

    // ถ้ามีการส่ง dept_code มา ให้กรองตามแผนก
    if (dept_code) {
      query += ' WHERE dept_code = ?';
      params.push(dept_code);
    }

    const [users] = await pool.query(query, params);

    // แปลงข้อมูลให้ตรงกับที่ frontend ต้องการ
    const formattedUsers = users.map(user => ({
      id: user.id,
      emp_id: user.emp_id,
      name: user.name,
      department: user.department,
      dept_code: user.dept_code,
      role: user.role,
      status: user.status || 'active'
    }));

    res.json({
      status: 'success',
      data: formattedUsers
    });

  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({
      status: 'error',
      message: 'ไม่สามารถดึงข้อมูลผู้ใช้ได้'
    });
  }
});

// อัพเดตสถานะผู้ใช้
router.patch('/users/status/:id', async (req, res) => {
  try {
    const { status } = req.body;
    await pool.query(
      'UPDATE users SET status = ? WHERE emp_id = ?',
      [status, req.params.id]
    );

    res.json({
      status: 'success',
      message: 'อัพเดตสถานะผู้ใช้สำเร็จ'
    });

  } catch (error) {
    console.error('Error updating user status:', error);
    res.status(500).json({
      status: 'error',
      message: 'ไม่สามารถอัพเดตสถานะผู้ใช้ได้'
    });
  }
});

// อัพเดต role ผู้ใช้
router.patch('/users/role/:id', async (req, res) => {
  try {
    const { role } = req.body;
    await pool.query(
      'UPDATE users SET role = ? WHERE emp_id = ?',
      [role, req.params.id]
    );

    res.json({
      status: 'success',
      message: 'อัพเดตสิทธิ์ผู้ใช้สำเร็จ'
    });

  } catch (error) {
    console.error('Error updating user role:', error);
    res.status(500).json({
      status: 'error',
      message: 'ไม่สามารถอัพเดตสิทธิ์ผู้ใช้ได้'
    });
  }
});

// อัพเดตข้อมูลผู้ใช้
router.put('/users/:id', async (req, res) => {
  try {
    const { emp_id, name, password, role, dept_code, department } = req.body;
    
    // ตรวจสอบว่ามีผู้ใช้นี้อยู่หรือไม่
    const [existingUser] = await pool.query(
      'SELECT * FROM users WHERE emp_id = ?',
      [req.params.id]
    );

    if (!existingUser.length) {
      return res.status(404).json({
        status: 'error',
        message: 'ไม่พบข้อมูลผู้ใช้'
      });
    }

    // สร้าง query สำหรับอัพเดต
    let updateQuery = `
      UPDATE users 
      SET name = ?, role = ?, dept_code = ?, department = ?
    `;
    let params = [name, role, dept_code, department];

    // เพิ่มการอัพเดตรหัสผ่านถ้ามีการส่งมา
    if (password) {
      updateQuery += `, password = ?`;
      params.push(password);
    }

    updateQuery += ` WHERE emp_id = ?`;
    params.push(req.params.id);

    // ทำการอัพเดต
    await pool.query(updateQuery, params);

    res.json({
      status: 'success',
      message: 'อัพเดตข้อมูลผู้ใช้สำเร็จ'
    });

  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({
      status: 'error',
      message: 'ไม่สามารถอัพเดตข้อมูลผู้ใช้ได้'
    });
  }
});

// สร้างผู้ใช้ใหม่
router.post('/users', async (req, res) => {
  try {
    const { emp_id, name, password, role, dept_code, department } = req.body;

    // ตรวจสอบว่ามี emp_id ซ้ำหรือไม่
    const [existing] = await pool.query(
      'SELECT emp_id FROM users WHERE emp_id = ?',
      [emp_id]
    );

    if (existing.length > 0) {
      return res.status(400).json({
        status: 'error',
        message: 'รหัสพนักงานนี้มีในระบบแล้ว'
      });
    }

    // เพิ่มผู้ใช้ใหม่
    await pool.query(
      `INSERT INTO users (emp_id, name, password, role, dept_code, department)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [emp_id, name, password, role, dept_code, department]
    );

    res.json({
      status: 'success',
      message: 'เพิ่มผู้ใช้สำเร็จ'
    });

  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({
      status: 'error',
      message: 'ไม่สามารถเพิ่มผู้ใช้ได้'
    });
  }
}); 