const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const path = require('path');
const fs = require('fs');

// Middleware สำหรับตรวจสอบข้อมูลผู้ใช้
// ใช้ใน: ทุกหน้าที่ต้องการตรวจสอบสิทธิ์ผู้ใช้
// หน้าที่: ตรวจสอบ user-id และดึงข้อมูลผู้ใช้จาก database
const getUserData = async (req, res, next) => {
  try {
    // ถ้าไม่มี user id ใน request
    if (!req.headers['user-id']) {
      return res.status(401).json({
        success: false,
        message: 'กรุณาเข้าสู่ระบบ'
      });
    }

    // ดึงข้อมูลผู้ใช้จาก database
    const [user] = await pool.query(
      'SELECT * FROM users WHERE emp_id = ?',
      [req.headers['user-id']]
    );

    if (!user.length) {
      return res.status(401).json({
        success: false,
        message: 'ไม่พบข้อมูลผู้ใช้'
      });
    }

    // เพิ่มข้อมูลผู้ใช้ใน request object
    req.user = user[0];
    next();
  } catch (error) {
    console.error('Error in getUserData middleware:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการตรวจสอบผู้ใช้'
    });
  }
};

// ใช้ใน: SystemList.vue
// หน้าที่: ดึงข้อมูลระบบทั้งหมดเพื่อแสดงในรายการ
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

// ใช้ใน: SystemDetails.vue
// หน้าที่: ดึงข้อมูลสำคัญของระบบที่เลือกเพื่อแสดงรายละเอียด
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

// ใช้ใน: ActivityList.vue
// หน้าที่: ดึงข้อมูลกิจกรรมตาม systemId และ infoId ที่เลือก
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

// ใช้ใน: ActivityEdit.vue
// หน้าที่: อัพเดตข้อมูลกิจกรรม รวมถึงไฟล์แนบและรูปภาพ
router.put('/activities/:id', async (req, res) => {
  let connection;
  try {
    connection = await pool.getConnection();
    const activityId = req.params.id;

    // ตรวจสอบข้อมูลที่จำเป็น
    if (!req.body.details?.trim()) {
      return res.status(400).json({ 
        status: 'error',
        message: 'กรุณากรอกรายละเอียด' 
      });
    }

    // เริ่ม transaction
    await connection.beginTransaction();

    // ดึงข้อมูลเก่าก่อนการอัพเดต
    const [oldActivity] = await connection.query(
      'SELECT * FROM activities WHERE id = ?',
      [activityId]
    );

    if (!oldActivity.length) {
      await connection.rollback();
      return res.status(404).json({
        status: 'error',
        message: 'ไม่พบข้อมูลกิจกรรมที่ต้องการแก้ไข'
      });
    }

    // อัพเดตข้อมูลหลัก
    await connection.query(`
      UPDATE activities 
      SET 
        details = ?,
        system_id = ?,
        important_info = ?,
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

    // ดึงข้อมูลไฟล์ปัจจุบัน
    const [currentActivity] = await connection.query(
      'SELECT file_paths, image_paths FROM activities WHERE id = ?',
      [activityId]
    );

    let updatedFilePaths = [];
    let updatedImagePaths = [];

    // จัดการไฟล์ที่ถูกลบ
    if (currentActivity[0].file_paths) {
      const currentFiles = currentActivity[0].file_paths.split(',');
      const removedFiles = req.body.removedFiles ? 
        (Array.isArray(req.body.removedFiles) ? req.body.removedFiles : [req.body.removedFiles]) : 
        [];

      // ลบไฟล์ที่ถูกเลือก
      for (const filePath of removedFiles) {
        const fullPath = path.join(__dirname, '..', filePath);
        if (fs.existsSync(fullPath)) {
          fs.unlinkSync(fullPath);
        }
      }

      // กรองไฟล์ที่ไม่ได้ถูกลบ
      updatedFilePaths = currentFiles.filter(path => !removedFiles.includes(path));
    }

    // จัดการรูปภาพที่ถูกลบ
    if (currentActivity[0].image_paths) {
      const currentImages = currentActivity[0].image_paths.split(',');
      const removedImages = req.body.removedImages ? 
        (Array.isArray(req.body.removedImages) ? req.body.removedImages : [req.body.removedImages]) : 
        [];

      // ลบรูปภาพที่ถูกเลือก
      for (const imagePath of removedImages) {
        const fullPath = path.join(__dirname, '..', imagePath);
        if (fs.existsSync(fullPath)) {
          fs.unlinkSync(fullPath);
        }
      }

      // กรองรูปภาพที่ไม่ได้ถูกลบ
      updatedImagePaths = currentImages.filter(path => !removedImages.includes(path));
    }

    // เพิ่มไฟล์และรูปภาพใหม่
    updatedFilePaths = [...updatedFilePaths, ...filePaths];
    updatedImagePaths = [...updatedImagePaths, ...imagePaths];

    // อัพเดตพาธของไฟล์ในฐานข้อมูล
    await connection.query(
      `UPDATE activities 
       SET file_paths = ?, 
           image_paths = ?
       WHERE id = ?`,
      [
        updatedFilePaths.length > 0 ? updatedFilePaths.join(',') : null,
        updatedImagePaths.length > 0 ? updatedImagePaths.join(',') : null,
        activityId
      ]
    );

    // บันทึกประวัติการแก้ไข
    await connection.query(`
      INSERT INTO activities_history (
        activity_id,
        important_info_old,
        important_info_new,
        details_old,
        details_new,
        file_paths_old,
        file_paths_new,
        image_paths_old,
        image_paths_new,
        modified_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      activityId,
      oldActivity[0].important_info,
      req.body.important_info,
      oldActivity[0].details,
      req.body.details,
      oldActivity[0].file_paths,
      updatedFilePaths.length > 0 ? updatedFilePaths.join(',') : null,
      oldActivity[0].image_paths,
      updatedImagePaths.length > 0 ? updatedImagePaths.join(',') : null,
      req.body.created_by
    ]);

    await connection.commit();
    
    // ดึงข้อมูลที่อัพเดตแล้ว
    const [updatedActivity] = await connection.query(
      'SELECT file_paths, image_paths FROM activities WHERE id = ?',
      [activityId]
    );

    res.json({ 
      status: 'success', 
      message: 'อัพเดตข้อมูลกิจกรรมสำเร็จ',
      activityId: activityId,
      file_paths: updatedActivity[0].file_paths,
      image_paths: updatedActivity[0].image_paths
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

// ใช้ใน: ActivityList.vue
// หน้าที่: ลบกิจกรรมและไฟล์ที่เกี่ยวข้อง
router.delete('/activities/:id', async (req, res) => {
  let connection;
  try {
    connection = await pool.getConnection();
    const activityId = req.params.id;

    // ตรวจสอบว่ามีกิจกรรมนี้อยู่หรือไม่
    const [activity] = await connection.query(
      'SELECT * FROM activities WHERE id = ?',
      [activityId]
    );

    if (!activity.length) {
      return res.status(404).json({ 
        status: 'error',
        message: 'ไม่พบข้อมูลกิจกรรม' 
      });
    }

    // เริ่ม transaction
    await connection.beginTransaction();

    // ลบไฟล์ที่เกี่ยวข้อง (ถ้ามี)
    if (activity[0].file_paths) {
      const filePaths = activity[0].file_paths.split(',');
      for (const filePath of filePaths) {
        const fullPath = path.join(__dirname, '..', filePath);
        if (fs.existsSync(fullPath)) {
          fs.unlinkSync(fullPath);
        }
      }
    }

    // ลบรูปภาพที่เกี่ยวข้อง (ถ้ามี)
    if (activity[0].image_paths) {
      const imagePaths = activity[0].image_paths.split(',');
      for (const imagePath of imagePaths) {
        const fullPath = path.join(__dirname, '..', imagePath);
        if (fs.existsSync(fullPath)) {
          fs.unlinkSync(fullPath);
        }
      }
    }

    // ลบข้อมูลกิจกรรม
    await connection.query('DELETE FROM activities WHERE id = ?', [activityId]);

    await connection.commit();

    res.json({ 
      status: 'success',
      message: 'ลบข้อมูลกิจกรรมสำเร็จ' 
    });

  } catch (error) {
    if (connection) await connection.rollback();
    console.error('Error deleting activity:', error);
    
    // ตรวจสอบ error code สำหรับ foreign key constraint
    if (error.code === 'ER_ROW_IS_REFERENCED_2') {
      return res.status(400).json({ 
        status: 'error',
        message: 'ไม่สามารถลบข้อมูลได้เนื่องจากมีข้อมูลที่เกี่ยวข้องอยู่' 
      });
    }

    res.status(500).json({ 
      status: 'error',
      message: 'ไม่สามารถลบข้อมูลกิจกรรมได้' 
    });
  } finally {
    if (connection) connection.release();
  }
});

// ใช้ใน: ActivityCreate.vue
// หน้าที่: บันทึกกิจกรรมใหม่พร้อมไฟล์แนบและรูปภาพ
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

// ใช้ใน: การทดสอบ API
// หน้าที่: ตรวจสอบว่า API ทำงานปกติ
router.get('/test', (req, res) => {
  res.json({ message: 'Activities API is working' });
});

// ใช้ใน: DepartmentList.vue
// หน้าที่: ดึงข้อมูลแผนกทั้งหมดเพื่อแสดงในรายการ
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

// ใช้ใน: ActivityDashboard.vue
// หน้าที่: ดึงข้อมูลกิจกรรมทั้งหมดพร้อมฟิลเตอร์ตามแผนก ระบบ และข้อมูลสำคัญ
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

// ใช้ใน: SystemDetails.vue
// หน้าที่: ลบข้อมูลสำคัญของระบบ โดยตรวจสอบสิทธิ์และความเกี่ยวข้องกับกิจกรรม
router.delete('/api/system-details/:id', getUserData, async (req, res) => {
  let conn;
  try {
    const { id } = req.params;
    const userDept = req.user.dept_change_code;

    conn = await pool.getConnection();
    await conn.beginTransaction();

    try {
      // ตรวจสอบว่าข้อมูลนี้เป็นของแผนกผู้ใช้หรือไม่
      const [detail] = await conn.query(`
        SELECT dept_change_code, file_path 
        FROM system_details 
        WHERE id = ?
      `, [id]);

      if (detail.length === 0) {
        await conn.rollback();
        return res.status(404).json({
          success: false,
          message: 'ไม่พบข้อมูลที่ต้องการลบ'
        });
      }

      if (detail[0].dept_change_code !== userDept) {
        await conn.rollback();
        return res.status(403).json({
          success: false,
          message: 'ไม่มีสิทธิ์ลบข้อมูลของแผนกอื่น'
        });
      }

      // ตรวจสอบว่ามีกิจกรรมที่เกี่ยวข้องหรือไม่
      const [activities] = await conn.query(
        'SELECT COUNT(*) as count FROM activities WHERE important_info = ?',
        [id]
      );

      if (activities[0].count > 0) {
        await conn.rollback();
        return res.status(400).json({
          success: false,
          message: 'ไม่สามารถลบข้อมูลได้เนื่องจากมีกิจกรรมที่เกี่ยวข้อง'
        });
      }

      // ลบไฟล์เก่า (ถ้ามี)
      if (detail[0].file_path) {
        const filePaths = detail[0].file_path.split(',');
        filePaths.forEach(filePath => {
          const fullPath = path.join(__dirname, '..', filePath);
          if (fs.existsSync(fullPath)) {
            fs.unlinkSync(fullPath);
          }
        });
      }

      // ลบข้อมูล
      await conn.query('DELETE FROM system_details WHERE id = ?', [id]);
      await conn.commit();

      res.json({
        success: true,
        message: 'ลบข้อมูลสำเร็จ'
      });

    } catch (error) {
      await conn.rollback();
      throw error;
    }

  } catch (error) {
    console.error('Error deleting system details:', error);
    res.status(500).json({
      success: false,
      message: 'ไม่สามารถลบข้อมูลได้'
    });
  } finally {
    if (conn) conn.release();
  }
});

module.exports = router; 