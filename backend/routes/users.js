const express = require('express');
const router = express.Router();
const pool = require('../config/database');



// เพิ่มผู้ใช้งานใหม่
router.post('/add-user', async (req, res) => {
  let connection;
  try {
    connection = await pool.getConnection();
    
    // ตรวจสอบข้อมูลที่จำเป็น
    if (!req.body.first_name || !req.body.last_name || !req.body.dept_change_code || !req.body.emp_id) {
      return res.status(400).json({
        status: 'error',
        message: 'กรุณากรอกข้อมูลให้ครบถ้วน'
      });
    }

    // ตรวจสอบว่ามีรหัสพนักงานซ้ำหรือไม่
    const [existingUser] = await connection.query(
      'SELECT emp_id FROM users WHERE emp_id = ?',
      [req.body.emp_id]
    );

    if (existingUser.length > 0) {
      return res.status(400).json({
        status: 'error',
        message: 'รหัสพนักงานนี้มีอยู่ในระบบแล้ว'
      });
    }

    // เริ่ม transaction
    await connection.beginTransaction();

    // บันทึกข้อมูลผู้ใช้
    const [result] = await connection.query(
      `INSERT INTO users (
        role_id,
        emp_id,
        first_name,
        last_name,
        dept_change_code,
        dept_full,
        created_at
      ) VALUES (?, ?, ?, ?, ?, ?, NOW())`,
      [
        req.body.role_id,
        req.body.emp_id,
        req.body.first_name,
        req.body.last_name,
        req.body.dept_change_code,
        req.body.dept_full
      ]
    );

    await connection.commit();

    res.json({
      status: 'success',
      message: 'เพิ่มผู้ใช้งานสำเร็จ',
      user_id: result.insertId
    });

  } catch (error) {
    if (connection) await connection.rollback();
    console.error('Error adding user:', error);
    res.status(500).json({
      status: 'error',
      message: 'ไม่สามารถเพิ่มผู้ใช้งานได้: ' + error.message
    });
  } finally {
    if (connection) connection.release();
  }
});

// ดึงข้อมูลผู้ใช้ทั้งหมด
router.get('/admin-users', async (req, res) => {
  let connection;
  try {
    connection = await pool.getConnection();
    
    const [users] = await connection.query(
      `SELECT * FROM users ORDER BY created_at DESC`
    );

    res.json(users);

  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({
      status: 'error',
      message: 'ไม่สามารถดึงข้อมูลผู้ใช้งานได้'
    });
  } finally {
    if (connection) connection.release();
  }
});

// ลบผู้ใช้งาน
router.delete('/delete-user/:emp_id', async (req, res) => {
  let connection;
  try {
    connection = await pool.getConnection();
    
    // ตรวจสอบว่ามีผู้ใช้นี้อยู่หรือไม่
    const [user] = await connection.query(
      'SELECT * FROM users WHERE emp_id = ?',
      [req.params.emp_id]
    );

    if (!user.length) {
      return res.status(404).json({
        status: 'error',
        message: 'ไม่พบข้อมูลผู้ใช้งาน'
      });
    }

    // เริ่ม transaction
    await connection.beginTransaction();

    // ลบผู้ใช้
    await connection.query(
      'DELETE FROM users WHERE emp_id = ?',
      [req.params.emp_id]
    );

    await connection.commit();

    res.json({
      status: 'success',
      message: 'ลบผู้ใช้งานสำเร็จ'
    });

  } catch (error) {
    if (connection) await connection.rollback();
    console.error('Error deleting user:', error);
    res.status(500).json({
      status: 'error',
      message: 'ไม่สามารถลบผู้ใช้งานได้: ' + error.message
    });
  } finally {
    if (connection) connection.release();
  }
});

// ดึงข้อมูลแผนกทั้งหมด
router.get('/departments', async (req, res) => {
  let connection;
  try {
    connection = await pool.getConnection();
    
    const [departments] = await connection.query(`
      SELECT DISTINCT dept_change_code, dept_full 
      FROM users 
      WHERE dept_change_code IS NOT NULL 
      AND dept_full IS NOT NULL 
      ORDER BY dept_full
    `);

    res.json(departments);

  } catch (error) {
    console.error('Error fetching departments:', error);
    res.status(500).json({
      status: 'error',
      message: 'ไม่สามารถดึงข้อมูลแผนกได้: ' + error.message
    });
  } finally {
    if (connection) connection.release();
  }
});

module.exports = router; 