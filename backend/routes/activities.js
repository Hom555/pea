const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const path = require('path');
const fs = require('fs');

// ดึงข้อมูลระบบทั้งหมด
router.get('/system-records', async (req, res) => {
  try {
    const [systems] = await pool.query(`
      SELECT id, name_th, name_en 
      FROM systems 
      ORDER BY name_th
    `);
    res.json(systems);
  } catch (error) {
    console.error('Error fetching systems:', error);
    res.status(500).json({ message: 'ไม่สามารถดึงข้อมูลระบบได้' });
  }
});

// ดึงข้อมูลสำคัญของระบบ
router.get('/system-details/:systemId', async (req, res) => {
  try {
    const [details] = await pool.query(`
      SELECT id, system_id, important_info 
      FROM system_details 
      WHERE system_id = ?
      ORDER BY id
    `, [req.params.systemId]);

    res.json(details);
  } catch (error) {
    console.error('Error fetching system details:', error);
    res.status(500).json({ message: 'ไม่สามารถดึงข้อมูลรายละเอียดได้' });
  }
});

// ดึงข้อมูลกิจกรรม
router.get('/activities/:systemId/:infoId', async (req, res) => {
  let connection;
  try {
    const { systemId, infoId } = req.params;
    console.log('Fetching activities for:', { systemId, infoId }); // เพิ่ม log

    // Validate params
    if (!systemId || !infoId) {
      return res.status(400).json({
        status: 'error',
        message: 'ต้องระบุ system_id และ important_info_id'
      });
    }

    connection = await pool.getConnection();
    
    const [activities] = await connection.query(`
      SELECT 
        a.*,
        u.first_name,
        u.last_name,
        sd.important_info as importance_name,
        s.name_th as system_name
      FROM activities a
      LEFT JOIN users u ON a.created_by = u.emp_id
      LEFT JOIN system_details sd ON a.important_info_id = sd.id
      LEFT JOIN systems s ON a.system_id = s.id
      WHERE a.system_id = ? AND a.important_info_id = ?
      ORDER BY a.created_at DESC
    `, [systemId, infoId]);

    console.log('Found activities:', activities.length); // เพิ่ม log
    res.json(activities || []);

  } catch (error) {
    console.error('Error in /activities/:systemId/:infoId:', error);
    res.status(500).json({ 
      status: 'error',
      message: 'ไม่สามารถดึงข้อมูลกิจกรรมได้: ' + error.message
    });
  } finally {
    if (connection) connection.release();
  }
});

// อัพเดตกิจกรรม
router.put('/activities/:id', async (req, res) => {
  let connection;
  try {
    // เพิ่ม log เพื่อตรวจสอบข้อมูลที่ได้รับ
    console.log('Received data:', req.body);
    console.log('Received files:', req.files);
    
    connection = await pool.getConnection();
    const activityId = req.params.id;

    // ตรวจสอบข้อมูลที่จำเป็น
    if (!req.body.details?.trim()) {
      return res.status(400).json({ 
        status: 'error',
        message: 'กรุณากรอกรายละเอียด' 
      });
    }

    if (!req.body.system_id || !req.body.important_info) {
      return res.status(400).json({ 
        status: 'error',
        message: 'กรุณาระบุระบบและข้อมูลสำคัญ' 
      });
    }

    // เริ่ม transaction
    await connection.beginTransaction();

    // อัพเดตข้อมูลหลัก
    await connection.query(`
      UPDATE activities 
      SET 
        details = ?,
        system_id = ?,
        important_info_id = ?,
        dept_change_code = ?,
        dept_full = ?,
        updated_at = CURRENT_TIMESTAMP,
        updated_by = ?
      WHERE id = ?
    `, [
      req.body.details,
      req.body.system_id,
      req.body.important_info,
      req.body.dept_change_code,
      req.body.dept_full,
      req.body.created_by,
      activityId
    ]);

    // สร้างโฟลเดอร์ถ้ายังไม่มี
    const uploadsDir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    // จัดการไฟล์ใหม่
    const filePaths = [];
    const imagePaths = [];

    if (req.files) {
      // จัดการไฟล์เอกสาร
      if (req.files['files[]']) {
        const files = Array.isArray(req.files['files[]']) ? req.files['files[]'] : [req.files['files[]']];
        for (const file of files) {
          const originalName = file.name;
          const safeName = `${Date.now()}-${encodeURIComponent(originalName)}`;
          const filePath = path.join(uploadsDir, safeName);
          await file.mv(filePath);
          filePaths.push(`/uploads/${safeName}`);
        }
      }

      // จัดการรูปภาพ
      if (req.files['images[]']) {
        const images = Array.isArray(req.files['images[]']) ? req.files['images[]'] : [req.files['images[]']];
        for (const image of images) {
          const originalName = image.name;
          const safeName = `${Date.now()}-${encodeURIComponent(originalName)}`;
          const imagePath = path.join(uploadsDir, safeName);
          await image.mv(imagePath);
          imagePaths.push(`/uploads/${safeName}`);
        }
      }
    }

    // ลบไฟล์เก่า
    if (req.body['removedFiles[]']) {
      const removedFiles = Array.isArray(req.body['removedFiles[]']) ? req.body['removedFiles[]'] : [req.body['removedFiles[]']];
      for (const filePath of removedFiles) {
        const fullPath = path.join(__dirname, '..', filePath);
        if (fs.existsSync(fullPath)) {
          fs.unlinkSync(fullPath);
        }
      }
    }

    if (req.body['removedImages[]']) {
      const removedImages = Array.isArray(req.body['removedImages[]']) ? req.body['removedImages[]'] : [req.body['removedImages[]']];
      for (const imagePath of removedImages) {
        const fullPath = path.join(__dirname, '..', imagePath);
        if (fs.existsSync(fullPath)) {
          fs.unlinkSync(fullPath);
        }
      }
    }

    // อัพเดตข้อมูลไฟล์ในฐานข้อมูล
    const [currentActivity] = await connection.query(
      'SELECT file_paths, image_paths FROM activities WHERE id = ?',
      [activityId]
    );

    let updatedFilePaths = [];
    let updatedImagePaths = [];

    // รวมไฟล์เก่าที่ไม่ได้ถูกลบกับไฟล์ใหม่
    if (currentActivity[0].file_paths) {
      const currentFiles = currentActivity[0].file_paths.split(',');
      updatedFilePaths = currentFiles.filter(path => !req.body['removedFiles[]']?.includes(path));
    }
    updatedFilePaths = [...updatedFilePaths, ...filePaths];

    if (currentActivity[0].image_paths) {
      const currentImages = currentActivity[0].image_paths.split(',');
      updatedImagePaths = currentImages.filter(path => !req.body['removedImages[]']?.includes(path));
    }
    updatedImagePaths = [...updatedImagePaths, ...imagePaths];

    // อัพเดตพาธของไฟล์ในฐานข้อมูล
    await connection.query(
      `UPDATE activities 
       SET file_paths = ?, image_paths = ?
       WHERE id = ?`,
      [
        updatedFilePaths.length > 0 ? updatedFilePaths.join(',') : null,
        updatedImagePaths.length > 0 ? updatedImagePaths.join(',') : null,
        activityId
      ]
    );

    await connection.commit();
    res.json({ 
      status: 'success',
      message: 'อัพเดตข้อมูลกิจกรรมสำเร็จ'
    });

  } catch (error) {
    if (connection) await connection.rollback();
    console.error('Error updating activity:', error);
    res.status(500).json({ 
      status: 'error',
      message: 'ไม่สามารถอัพเดตข้อมูลกิจกรรมได้: ' + error.message 
    });
  } finally {
    if (connection) connection.release();
  }
});

// ลบกิจกรรม
router.delete('/activities/:id', async (req, res) => {
  try {
    const activityId = req.params.id;

    // ตรวจสอบว่ามีกิจกรรมนี้อยู่หรือไม่
    const [activity] = await pool.query(
      'SELECT * FROM activities WHERE id = ?',
      [activityId]
    );

    if (!activity.length) {
      return res.status(404).json({ message: 'ไม่พบข้อมูลกิจกรรม' });
    }

    await pool.query('DELETE FROM activities WHERE id = ?', [activityId]);

    res.json({ 
      status: 'success',
      message: 'ลบข้อมูลกิจกรรมสำเร็จ' 
    });
  } catch (error) {
    console.error('Error deleting activity:', error);
    res.status(500).json({ message: 'ไม่สามารถลบข้อมูลกิจกรรมได้' });
  }
});

// เพิ่ม endpoint สำหรับบันทึกกิจกรรม
router.post('/activities', async (req, res) => {
  let connection;
  try {
    connection = await pool.getConnection();
    
    // ตรวจสอบข้อมูลที่จำเป็น
    if (!req.body.details?.trim()) {
      return res.status(400).json({ 
        status: 'error',
        message: 'กรุณากรอกรายละเอียด' 
      });
    }

    if (!req.body.system_id || !req.body.important_info) {
      return res.status(400).json({ 
        status: 'error',
        message: 'กรุณาระบุระบบและข้อมูลสำคัญ' 
      });
    }
    
    // เริ่ม transaction
    await connection.beginTransaction();

    // บันทึกข้อมูลกิจกรรม
    const [result] = await connection.query(
      `INSERT INTO activities (
        system_id, 
        important_info_id, 
        details, 
        dept_change_code,
        dept_full,
        created_by,
        created_at
      ) VALUES (?, ?, ?, ?, ?, ?, NOW())`,
      [
        req.body.system_id,
        req.body.important_info,
        req.body.details.trim(),
        req.body.dept_change_code,
        req.body.dept_full,
        req.body.created_by
      ]
    );

    const activityId = result.insertId;

    // สร้างโฟลเดอร์ถ้ายังไม่มี
    const uploadsDir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const filePaths = [];
    const imagePaths = [];

    if (req.files) {
      // จัดการไฟล์เอกสาร
      if (req.files['files[]']) {
        const files = Array.isArray(req.files['files[]']) ? req.files['files[]'] : [req.files['files[]']];
        for (const file of files) {
          const originalName = file.name;
          const safeName = `${Date.now()}-${encodeURIComponent(originalName)}`;
          const filePath = path.join(uploadsDir, safeName);
          await file.mv(filePath);
          filePaths.push(`/uploads/${safeName}`);
        }
      }

      // จัดการรูปภาพ
      if (req.files['images[]']) {
        const images = Array.isArray(req.files['images[]']) ? req.files['images[]'] : [req.files['images[]']];
        for (const image of images) {
          const originalName = image.name;
          const safeName = `${Date.now()}-${encodeURIComponent(originalName)}`;
          const imagePath = path.join(uploadsDir, safeName);
          await image.mv(imagePath);
          imagePaths.push(`/uploads/${safeName}`);
        }
      }
    }

    // อัพเดตข้อมูลไฟล์ในฐานข้อมูล
    if (filePaths.length > 0 || imagePaths.length > 0) {
      await connection.query(
        `UPDATE activities 
         SET file_paths = ?, image_paths = ?
         WHERE id = ?`,
        [
          filePaths.length > 0 ? filePaths.join(',') : null,
          imagePaths.length > 0 ? imagePaths.join(',') : null,
          activityId
        ]
      );
    }

    await connection.commit();
    res.json({ 
      status: 'success', 
      message: 'บันทึกกิจกรรมสำเร็จ',
      activityId: activityId
    });

  } catch (error) {
    if (connection) await connection.rollback();
    console.error('Error saving activity:', error);
    res.status(500).json({
      status: 'error',
      message: 'ไม่สามารถบันทึกกิจกรรมได้: ' + error.message
    });
  } finally {
    if (connection) connection.release();
  }
});

// เพิ่ม route test เพื่อตรวจสอบการทำงาน
router.get('/test', (req, res) => {
  res.json({ message: 'Activities API is working' });
});

// เพิ่ม endpoint สำหรับดึงข้อมูลแผนก
router.get('/departments', async (req, res) => {
  try {
    const [departments] = await pool.query(`
      SELECT id, name, division 
      FROM departments 
      ORDER BY name
    `);
    res.json(departments);
  } catch (error) {
    console.error('Error fetching departments:', error);
    res.status(500).json({ 
      status: 'error',
      message: 'ไม่สามารถดึงข้อมูลแผนกได้' 
    });
  }
});

// ปรับปรุง endpoint activities ให้รองรับการกรอง
router.get('/activities', async (req, res) => {
  let connection;
  try {
    const { department_id, system_id, info_id } = req.query;
    
    connection = await pool.getConnection();
    
    let query = `
      SELECT 
        a.*,
        u.first_name,
        u.last_name,
        d.name as dept_name,
        s.name_th as system_name,
        sd.important_info
      FROM activities a
      LEFT JOIN users u ON a.created_by = u.emp_id
      LEFT JOIN departments d ON u.department_id = d.id
      LEFT JOIN systems s ON a.system_id = s.id
      LEFT JOIN system_details sd ON a.important_info_id = sd.id
      WHERE 1=1
    `;
    
    const params = [];
    
    if (department_id) {
      query += ` AND d.id = ?`;
      params.push(department_id);
    }
    if (system_id) {
      query += ` AND a.system_id = ?`;
      params.push(system_id);
    }
    if (info_id) {
      query += ` AND a.important_info_id = ?`;
      params.push(info_id);
    }
    
    query += ` ORDER BY a.created_at DESC`;
    
    const [activities] = await connection.query(query, params);
    res.json(activities);

  } catch (error) {
    console.error('Error fetching activities:', error);
    res.status(500).json({
      status: 'error',
      message: 'ไม่สามารถดึงข้อมูลกิจกรรมได้'
    });
  } finally {
    if (connection) connection.release();
  }
});

module.exports = router; 