// server.js
const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const multer = require('multer');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');
const app = express();
const port = 8088;
const activitiesRouter = require('./routes/activities');
const ad = require('./ad');
const aa = require('./aa');
const fileUpload = require('express-fileupload');
const axios = require('axios');

// ตั้งค่า CORS
app.use(cors({
  origin: ['http://localhost:8080', 'http://localhost:8082', 'http://localhost:8083'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'Authorization']
}));

app.use(express.json());
app.use(bodyParser.json());
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(fileUpload({
  createParentPath: true,
  limits: { 
    fileSize: 50 * 1024 * 1024 // 50MB max-file-size
  },
  useTempFiles: false,
  abortOnLimit: true,
  responseOnLimit: 'ไฟล์มีขนาดใหญ่เกินกำหนด (50MB)',
  safeFileNames: /[^\w-.]/g, // อนุญาตเฉพาะตัวอักษร ตัวเลข จุด และขีด
  preserveExtension: 4 // รองรับนามสกุลไฟล์ได้สูงสุด 4 ตัวอักษร เช่น .xlsx
}));

// สร้างโฟลเดอร์สำหรับเก็บไฟล์
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Serve static files from uploads directory
app.use('/uploads', express.static(uploadsDir));

// ปรับปรุงการจัดการ static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ปรับปรุงการจัดการการเข้าถึงไฟล์
app.get('/uploads/*', (req, res) => {
  const filePath = path.join(__dirname, req.path);
  console.log('Accessing file:', filePath);
  
  if (fs.existsSync(filePath)) {
    res.sendFile(filePath);
  } else {
    res.status(404).send('ไม่พบไฟล์');
  }
});

app.use((req, res, next) => {
  res.header('Content-Type', 'text/html; charset=utf-8');
  next();
});

function generateUniqueFilename(originalname) {
  const timestamp = Date.now();
  // แยกชื่อไฟล์และนามสกุล
  const lastDotIndex = originalname.lastIndexOf('.');
  const nameWithoutExt = originalname.substring(0, lastDotIndex);
  const extension = originalname.substring(lastDotIndex);
  
  // Ensure proper encoding of Thai filename
  const sanitizedName = Buffer.from(nameWithoutExt, 'latin1').toString('utf8');
  // Return timestamp and original name separated by a single hyphen, preserving extension
  return `${timestamp}-${sanitizedName}${extension}`;
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, generateUniqueFilename(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    'image/jpeg',
    'image/png',
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
    'application/vnd.ms-excel' // .xls
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    const error = new Error(`ประเภทไฟล์ ${file.mimetype} ไม่ได้รับอนุญาต`);
    error.code = 'FILE_TYPE';
    cb(error, false);
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
  fileFilter: fileFilter
});

app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    return res.status(400).json({ error: err.message });
  } else if (err) {
    return res.status(400).json({ error: err.message });
  }
  next();
});

app.post('/api/upload', upload.array('files', 10), (req, res) => {
  try {
    res.status(200).json({
      message: 'อัปโหลดไฟล์สำเร็จ',
      files: req.files,
    });
  } catch (error) {
    res.status(500).json({ error: 'เกิดข้อผิดพลาดในการอัปโหลดไฟล์' });
  }
});
const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '12345678',  // เอา password ออกเพราะ AppServ มักจะตั้งค่าเริ่มต้นไม่มี password
  database: 'PEA',        
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  charset: 'utf8mb4',
  multipleStatements: true,
  insecureAuth: true
});

// แก้ไข error handler ให้แสดงข้อมูลมากขึ้น
pool.on('error', (err) => {
  console.error('Database pool error:', err);
  console.error('Error code:', err.code);
  console.error('Error number:', err.errno);
  console.error('SQL state:', err.sqlState);
  console.error('SQL message:', err.sqlMessage);
});

// เพิ่มการจัดการ connection ที่ดีขึ้น
const getConnection = async () => {
  try {
    const connection = await pool.getConnection();
    return connection;
  } catch (error) {
    console.error('Error getting connection:', error);
    throw error;
  }
};

// ทดสอบการเชื่อมต่อเมื่อเริ่มต้น server
pool.getConnection((err, connection) => {
  if (err) {
    console.error('Error connecting to the database:', err);
    return;
  }
  console.log('Successfully connected to database');
  connection.release();
});

// Middleware สำหรับจัดการ connection
const withConnection = async (req, res, next) => {
  try {
    req.db = await pool.getConnection();
    return next();
  } catch (err) {
    console.error('Database connection error:', err);
    return res.status(500).json({
      status: 'error',
      message: 'ไม่สามารถเชื่อมต่อฐานข้อมูลได้'
    });
  }
};

// เพิ่ม middleware สำหรับดึงข้อมูล user
const getUserData = async (req, res, next) => {
  try {
    // ดึงข้อมูลจาก API ภายนอก
    const response = await axios.get('http://localhost:3007/api/data', {
      headers: {
        Authorization: `Bearer ${req.headers.authorization?.split(' ')[1] || ''}`
      }
    });

    if (!response.data?.data?.dataDetail?.[0]) {
      // ถ้าไม่พบข้อมูลผู้ใช้ ให้ส่งค่าว่างกลับไป
      req.user = {
        dept_change_code: '',
        dept_full: '',
        emp_id: null
      };
      return next();
    }

    const user = response.data.data.dataDetail[0];

    // ถ้าไม่มีข้อมูลแผนก ให้ใช้ค่าว่าง
    if (!user.dept_change_code || !user.dept_full) {
      req.user = {
        ...user,
        dept_change_code: '',
        dept_full: ''
      };
    } else {
      req.user = user;
    }
    next();
  } catch (error) {
    console.error('Error getting user data:', error);
    // ในกรณีที่มี error ให้ส่งค่าว่างกลับไป
    req.user = {
      dept_change_code: '',
      dept_full: '',
      emp_id: null
    };
    next();
  }
};

// ============= API Endpoints และ Components ที่เกี่ยวข้อง =============

// === Authentication & User Info ===
// ใช้ใน: ทุก Component ที่ต้องการข้อมูล User
// ทำหน้าที่: ดึงข้อมูลผู้ใช้จาก Authentication Server (port 3007)
// และส่งข้อมูลกลับไปให้ Component เพื่อแสดงผล
app.get('/api/data', async (req, res) => {
  try {
    // ตรวจสอบ Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({
        status: 'error',
        message: 'ไม่พบ Authorization token'
      });
    }

    console.log('Calling external API with token:', authHeader);

    const response = await axios.get('http://localhost:3007/api/data', {
      headers: {
        Authorization: authHeader
      },
      timeout: 5000 // เพิ่ม timeout 5 วินาที
    });

    console.log('External API response:', response.data);

    res.json(response.data);
  } catch (error) {
    console.error('Error fetching user data:', error);
    
    if (error.code === 'ECONNREFUSED') {
      return res.status(503).json({
        status: 'error',
        message: 'ไม่สามารถเชื่อมต่อกับ Authentication Server (port 3007) กรุณาตรวจสอบการทำงานของ server'
      });
    }

    if (error.response) {
      // กรณีได้รับ response แต่เป็น error
      return res.status(error.response.status).json({
        status: 'error',
        message: error.response.data?.message || 'เกิดข้อผิดพลาดในการดึงข้อมูลผู้ใช้',
        details: error.response.data
      });
    }

    if (error.code === 'ETIMEDOUT' || error.code === 'ECONNABORTED') {
      return res.status(504).json({
        status: 'error',
        message: 'การเชื่อมต่อกับ server หมดเวลา กรุณาลองใหม่อีกครั้ง'
      });
    }

    res.status(500).json({
      status: 'error',
      message: 'ไม่สามารถดึงข้อมูลผู้ใช้ได้',
      error: error.message
    });
  }
});

// === System Records Management ===
// ใช้ใน: datasystemrecord.vue
// ทำหน้าที่: ดึงข้อมูลระบบทั้งหมดที่ยังเปิดใช้งานอยู่
// แสดงรายการระบบพร้อมรายละเอียดต่างๆ เช่น ชื่อ แผนก วันที่สร้าง
app.get('/api/system-records', getUserData, async (req, res) => {
  let conn;
  try {
    conn = await pool.getConnection();
    
    // ดึงข้อมูลระบบทั้งหมดที่ยังเปิดใช้งานอยู่
    const [systems] = await conn.query(`
      SELECT 
        id,
        name_th,
        name_en,
        dept_change_code,
        dept_full,
        created_at,
        updated_at,
        is_active
      FROM system_master
      WHERE is_active = 1
      ORDER BY created_at DESC
    `);

    console.log('Found systems:', systems.length);
    res.json(systems);

  } catch (error) {
    console.error('Error fetching systems:', error);
    res.status(500).json({ 
      status: 'error',
      message: 'ไม่สามารถดึงข้อมูลได้'
    });
  } finally {
    if (conn) conn.release();
  }
});

// ใช้ใน: datasystemrecord.vue
// ทำหน้าที่: ดึงข้อมูลระบบเฉพาะแผนกของผู้ใช้
// โดย Super Admin จะเห็นทุกระบบ ส่วน User/Admin ปกติจะเห็นเฉพาะแผนกตัวเอง
app.get('/api/system-records', getUserData, async (req, res) => {
  let conn;
  try {
    conn = await pool.getConnection();
    
    // ตรวจสอบ role ของผู้ใช้
    const userRole = req.user.role_id;
    const userDept = req.user.dept_change_code;
    
    let query = `
      SELECT 
        id,
        name_th,
        name_en,
        dept_change_code,
        dept_full,
        created_at,
        updated_at,
        is_active
      FROM system_master
    `;

    // ถ้าเป็น Super Admin (role_id = 3) ให้เห็นทุกระบบ
    // ถ้าเป็น User หรือ Admin ปกติให้เห็นเฉพาะแผนกตัวเอง
    if (userRole !== 3) {
      query += ` WHERE dept_change_code = ?`;
    }

    query += ` ORDER BY created_at DESC`;

    const [systems] = userRole === 3 
      ? await conn.query(query)
      : await conn.query(query, [userDept]);

    console.log('Found systems:', systems.length, 'for role:', userRole);
    res.json(systems);

  } catch (error) {
    console.error('Error fetching systems:', error);
    res.status(500).json({ 
      status: 'error',
      message: 'ไม่สามารถดึงข้อมูลได้'
    });
  } finally {
    if (conn) conn.release();
  }
});

// ใช้ใน: datasystemrecord.vue
// ทำหน้าที่: บันทึกข้อมูลระบบใหม่
// รับข้อมูลชื่อระบบภาษาไทยและอังกฤษ พร้อมข้อมูลแผนกจาก middleware
app.post('/api/system-record', getUserData, async (req, res) => {
  let conn;
  try {
    conn = await pool.getConnection();
    const { nameTH, nameEN } = req.body;

    // Validate input
    if (!nameTH || !nameEN) {
      return res.status(400).json({
        status: 'error',
        message: 'กรุณากรอกชื่อระบบทั้งภาษาไทยและภาษาอังกฤษ'
      });
    }

    // ใช้ข้อมูลแผนกจาก middleware
    const dept_change_code = req.user.dept_change_code;
    const dept_full = req.user.dept_full;
    const created_by = req.user.emp_id;

    // Insert new record
    const [result] = await conn.query(`
      INSERT INTO system_master 
      (name_th, name_en, dept_change_code, dept_full, created_by, is_active) 
      VALUES (?, ?, ?, ?, ?, 1)
    `, [
      nameTH.trim(),
      nameEN.trim(),
      dept_change_code,
      dept_full,
      created_by
    ]);

    // Return success response
    res.json({
      status: 'success',
      message: 'บันทึกข้อมูลสำเร็จ',
      id: result.insertId,
      data: {
        id: result.insertId,
        name_th: nameTH.trim(),
        name_en: nameEN.trim(),
        dept_change_code,
        dept_full,
        created_at: new Date().toISOString(),
        is_active: 1
      }
    });

  } catch (error) {
    console.error('Error saving system record:', error);
    res.status(500).json({
      status: 'error',
      message: 'ไม่สามารถบันทึกข้อมูลได้'
    });
  } finally {
    if (conn) conn.release();
  }
});

// ใช้ใน: datasystemrecord.vue
// ทำหน้าที่: แก้ไขข้อมูลระบบที่มีอยู่แล้ว
// บันทึกประวัติการแก้ไขและอัพเดตข้อมูลในตาราง system_master
app.put('/api/system-record/:id', getUserData, async (req, res) => {
  const id = req.params.id;
  const { nameTH, nameEN } = req.body;
  let conn;

  try {
    conn = await pool.getConnection();
    await conn.beginTransaction();

    // Get current record data before update
    const [currentRecord] = await conn.query(
      'SELECT * FROM system_master WHERE id = ?',
      [id]
    );

    if (currentRecord.length === 0) {
      return res.status(404).json({ 
        status: 'error',
        message: 'ไม่พบข้อมูลที่ต้องการอัปเดต' 
      });
    }

    // Insert into history table
    await conn.query(
      `INSERT INTO system_master_history 
      (system_id, name_th_old, name_en_old, name_th_new, name_en_new, modified_by) 
      VALUES (?, ?, ?, ?, ?, ?)`,
      [
        id,
        currentRecord[0].name_th,
        currentRecord[0].name_en,
        nameTH,
        nameEN,
        req.user.emp_id
      ]
    );

    // Update the record
    const [result] = await conn.query(
      `UPDATE system_master 
       SET name_th = ?, 
           name_en = ?, 
           updated_by = ?,
           updated_at = CURRENT_TIMESTAMP 
       WHERE id = ?`,
      [nameTH, nameEN, req.user.emp_id, id]
    );
    
    if (result.affectedRows === 0) {
      await conn.rollback();
      return res.status(404).json({ 
        status: 'error',
        message: 'ไม่พบข้อมูลที่ต้องการอัปเดต' 
      });
    }

    await conn.commit();

    // Fetch updated record with user information
    const [updatedRecord] = await conn.query(`
      SELECT sm.*,
             CONCAT(u1.first_name, ' ', u1.last_name) as created_by_name,
             CONCAT(u2.first_name, ' ', u2.last_name) as updated_by_name
      FROM system_master sm
      LEFT JOIN users u1 ON sm.created_by = u1.emp_id
      LEFT JOIN users u2 ON sm.updated_by = u2.emp_id
      WHERE sm.id = ?
    `, [id]);

    res.json({ 
      status: 'success',
      message: 'อัปเดตข้อมูลสำเร็จ',
      data: updatedRecord[0]
    });

  } catch (error) {
    if (conn) await conn.rollback();
    console.error('Error updating record:', error);
    res.status(500).json({ 
      status: 'error',
      message: 'ไม่สามารถอัปเดตข้อมูลได้' 
    });
  } finally {
    if (conn) conn.release();
  }
});

// ใช้ใน: SuperAdmin.vue
// ทำหน้าที่: ลบข้อมูลระบบ
// ตรวจสอบสิทธิ์ผู้ใช้และความเกี่ยวข้องของข้อมูลก่อนลบ
app.delete('/api/system-record/:id', getUserData, async (req, res) => {
  let conn;
  try {
    const { id } = req.params;
    
    conn = await pool.getConnection();
    await conn.beginTransaction();

    try {
      // ตรวจสอบสิทธิ์ผู้ใช้
      const [userRole] = await conn.query(
        'SELECT role_id FROM users WHERE emp_id = ?',
        [req.user.emp_id]
      );

      // ถ้าไม่ใช่ Admin หรือ SuperAdmin ไม่อนุญาตให้ลบ
      if (!userRole.length || (userRole[0].role_id !== 2 && userRole[0].role_id !== 3)) {
        await conn.rollback();
        return res.status(403).json({
          success: false,
          message: 'ไม่มีสิทธิ์ลบข้อมูลระบบ'
        });
      }

      // ตรวจสอบว่ามีข้อมูลที่เกี่ยวข้องใน system_details หรือไม่
      const [relatedDetails] = await conn.query(
        'SELECT COUNT(*) as count FROM system_details WHERE system_id = ?',
        [id]
      );

      if (relatedDetails[0].count > 0) {
        await conn.rollback();
        return res.status(400).json({
          success: false,
          message: 'ไม่สามารถลบระบบได้เนื่องจากมีข้อมูลที่เกี่ยวข้อง กรุณาลบข้อมูลที่เกี่ยวข้องก่อน'
        });
      }

      // ลบข้อมูลจากตาราง system_master_history ก่อน (ถ้ามี)
      await conn.query('DELETE FROM system_master_history WHERE system_id = ?', [id]);

      // ลบข้อมูลจากตาราง system_master
      const [result] = await conn.query('DELETE FROM system_master WHERE id = ?', [id]);

      if (result.affectedRows === 0) {
        await conn.rollback();
        return res.status(404).json({
          success: false,
          message: 'ไม่พบข้อมูลที่ต้องการลบ'
        });
      }

      await conn.commit();

      res.json({
        success: true,
        message: 'ลบข้อมูลระบบสำเร็จ'
      });

    } catch (error) {
      await conn.rollback();
      throw error;
    }

  } catch (error) {
    console.error('Error deleting system:', error);
    res.status(500).json({
      success: false,
      message: 'ไม่สามารถลบข้อมูลระบบได้'
    });
  } finally {
    if (conn) conn.release();
  }
});

// === System Details Management ===
// ใช้ใน: SystemDetails.vue, Dataactivities.vue
// ทำหน้าที่: บันทึกรายละเอียดของระบบ
// รับข้อมูลสำคัญ เลขที่อ้างอิง ข้อมูลเพิ่มเติม และไฟล์แนบ
app.post('/api/system-details', getUserData, async (req, res) => {
  let conn;
  try {
    console.log('Received data:', req.body);
    console.log('Received files:', req.files);
    
    const { 
      systemId, 
      importantInfo, 
      referenceNo, 
      additionalInfo,
      dept_change_code,
      dept_full,
      first_name,
      last_name
    } = req.body;

    // ตรวจสอบข้อมูลที่จำเป็น
    if (!systemId || !importantInfo?.trim() || !referenceNo?.trim()) {
      return res.status(400).json({
        success: false,
        message: 'กรุณากรอกข้อมูลให้ครบถ้วน'
      });
    }

    conn = await pool.getConnection();

    // ตรวจสอบว่าระบบนี้เป็นของแผนกผู้ใช้หรือไม่
    const [system] = await conn.query(`
      SELECT dept_change_code 
      FROM system_master 
      WHERE id = ?
    `, [systemId]);

    if (system.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'ไม่พบข้อมูลระบบ'
      });
    }

    if (system[0].dept_change_code !== dept_change_code) {
      return res.status(403).json({
        success: false,
        message: 'ไม่มีสิทธิ์เพิ่มข้อมูลให้ระบบของแผนกอื่น'
      });
    }

    // จัดการไฟล์
    let filePath = null;
    
    // ถ้ามีไฟล์เดิมและไม่มีการอัพโหลดไฟล์ใหม่
    if (req.body.existingFiles) {
      filePath = req.body.existingFiles;
    }
    
    // ถ้ามีการอัพโหลดไฟล์ใหม่
    if (req.files && req.files.files) {
      const files = Array.isArray(req.files.files) ? req.files.files : [req.files.files];
      console.log('Processing files:', files);
      
      const uploadedPaths = [];
      
      for (const file of files) {
        const timestamp = Date.now();
        const fileName = `${timestamp}-${file.name}`;
        const uploadPath = path.join(__dirname, 'uploads', fileName);
        
        await file.mv(uploadPath);
        uploadedPaths.push(`/uploads/${fileName}`);
      }
      
      filePath = uploadedPaths.join(',');
    }

    // เพิ่มข้อมูลลงในฐานข้อมูล
    const [result] = await conn.query(`
      INSERT INTO system_details (
        system_id, 
        important_info, 
        reference_no, 
        additional_info, 
        file_path,
        dept_change_code,
        dept_full,
        created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      systemId,
      importantInfo.trim(),
      referenceNo.trim(),
      additionalInfo?.trim() || '',
      filePath,
      dept_change_code,
      dept_full,
      req.user.emp_id
    ]);

    res.json({
      success: true,
      message: 'บันทึกข้อมูลสำเร็จ',
      id: result.insertId
    });

  } catch (error) {
    console.error('Error saving system details:', error);
    res.status(500).json({
      success: false,
      message: 'ไม่สามารถบันทึกข้อมูลได้'
    });
  } finally {
    if (conn) conn.release();
  }
});

// ใช้ใน: Dataactivities.vue
// ทำหน้าที่: ดึงรายละเอียดของระบบตาม system_id
// แสดงข้อมูลพร้อมชื่อผู้สร้างและผู้แก้ไข
app.get('/api/system-details/:systemId', async (req, res) => {
  let conn;
  try {
    conn = await pool.getConnection();
    const systemId = req.params.systemId;

    // ดึงข้อมูลรายละเอียดระบบ
    const [details] = await conn.query(`
      SELECT 
        sd.*,
        CONCAT(u1.first_name, ' ', u1.last_name) as created_by_name,
        CONCAT(u2.first_name, ' ', u2.last_name) as updated_by_name
       FROM system_details sd
       LEFT JOIN users u1 ON sd.created_by = u1.emp_id
       LEFT JOIN users u2 ON sd.updated_by = u2.emp_id
       WHERE sd.system_id = ?
       ORDER BY sd.created_at DESC
    `, [systemId]);

    res.json(details);

  } catch (error) {
    console.error('Error fetching system details:', error);
    // ส่งค่าว่างกลับไปแทนที่จะส่ง error
    res.json([]);
  } finally {
    if (conn) conn.release();
  }
});

// ใช้ใน: SystemDetails.vue
// ทำหน้าที่: แก้ไขรายละเอียดของระบบ
// บันทึกประวัติการแก้ไขและจัดการไฟล์แนบ
app.put('/api/system-details/:id', getUserData, async (req, res) => {
  let conn;
  try {
    conn = await pool.getConnection();
    await conn.beginTransaction();

    const detailId = req.params.id;
    const { importantInfo, referenceNo, additionalInfo } = req.body;
    
    // Get current record data before update
    const [currentRecord] = await conn.query(
      'SELECT * FROM system_details WHERE id = ?',
      [detailId]
    );

    if (!currentRecord || currentRecord.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'ไม่พบข้อมูลที่ต้องการแก้ไข'
      });
    }

    const oldRecord = currentRecord[0];
    let filePath = oldRecord.file_path;

    // Handle file uploads if any
    if (req.files && req.files.files) {
      const files = Array.isArray(req.files.files) ? req.files.files : [req.files.files];
      const uploadedPaths = [];
      
      for (const file of files) {
        const timestamp = Date.now();
        const fileName = `${timestamp}-${file.name}`;
        const uploadPath = path.join(__dirname, 'uploads', fileName);
        
        await file.mv(uploadPath);
        uploadedPaths.push(`/uploads/${fileName}`);
      }
      
      filePath = oldRecord.file_path 
        ? oldRecord.file_path + ',' + uploadedPaths.join(',')
        : uploadedPaths.join(',');
    } else if (req.body.existingFiles) {
      filePath = req.body.existingFiles;
    }

    // Insert into history table
    await conn.query(
      `INSERT INTO system_details_history (
        system_details_id,
        important_info_old,
        important_info_new,
        reference_no_old,
        reference_no_new,
        additional_info_old,
        additional_info_new,
        file_path_old,
        file_path_new,
        modified_by,
        modified_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
      [
        detailId,
        oldRecord.important_info,
        importantInfo,
        oldRecord.reference_no,
        referenceNo,
        oldRecord.additional_info,
        additionalInfo,
        oldRecord.file_path,
        filePath,
        req.user.emp_id
      ]
    );

    // Update the record
    await conn.query(
      `UPDATE system_details 
      SET 
        important_info = ?,
        reference_no = ?,
        additional_info = ?,
        file_path = ?,
        updated_at = CURRENT_TIMESTAMP,
        updated_by = ?
      WHERE id = ?`,
      [
        importantInfo,
        referenceNo,
        additionalInfo || '',
        filePath,
        req.user.emp_id,
        detailId
      ]
    );

    await conn.commit();
    
    // Fetch updated record
    const [updatedRecord] = await conn.query(
      `SELECT 
        sd.*,
        CONCAT(u1.first_name, ' ', u1.last_name) as created_by_name,
        CONCAT(u2.first_name, ' ', u2.last_name) as updated_by_name
       FROM system_details sd
       LEFT JOIN users u1 ON sd.created_by = u1.emp_id
       LEFT JOIN users u2 ON sd.updated_by = u2.emp_id
       WHERE sd.id = ?`,
      [detailId]
    );

    res.json({
      success: true,
      message: 'บันทึกการแก้ไขสำเร็จ',
      data: updatedRecord[0]
    });

  } catch (error) {
    if (conn) await conn.rollback();
    console.error('Error updating system detail:', error);
    res.status(500).json({
      success: false,
      message: 'ไม่สามารถบันทึกการแก้ไขได้',
      error: error.message
    });
  } finally {
    if (conn) conn.release();
  }
});

// ใช้ใน: SystemDetails.vue
// ทำหน้าที่: ลบข้อมูลระบบ
// ตรวจสอบว่าข้อมูลนี้เป็นของแผนกผู้ใช้หรือไม่
app.delete('/api/system-details/:id', getUserData, async (req, res) => {
  let conn;
  try {
    const { id } = req.params;
    const userDept = req.user.dept_change_code;

    conn = await pool.getConnection();

    // ตรวจสอบว่าข้อมูลนี้เป็นของแผนกผู้ใช้หรือไม่
    const [detail] = await conn.query(`
      SELECT dept_change_code, file_path 
      FROM system_details 
      WHERE id = ?
    `, [id]);

    if (detail.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'ไม่พบข้อมูลที่ต้องการลบ'
      });
    }

    if (detail[0].dept_change_code !== userDept) {
      return res.status(403).json({
        success: false,
        message: 'ไม่มีสิทธิ์ลบข้อมูลของแผนกอื่น'
      });
    }

    // ลบไฟล์เก่า (ถ้ามี)
    if (detail[0].file_path) {
      const filePaths = detail[0].file_path.split(',');
      filePaths.forEach(filePath => {
        const fullPath = path.join(__dirname, filePath);
        if (fs.existsSync(fullPath)) {
          fs.unlinkSync(fullPath);
        }
      });
    }

    // ลบข้อมูล
    await conn.query('DELETE FROM system_details WHERE id = ?', [id]);

    res.json({
      success: true,
      message: 'ลบข้อมูลสำเร็จ'
    });

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

// === Activities Management ===
// ปรับปรุงฟังก์ชันตรวจสอบข้อมูลซ้ำ
async function checkDuplicateActivity(conn, data) {
  const { system_id, important_info, details, dept_change_code, created_by } = data;
  
  // ตรวจสอบข้อมูลซ้ำในช่วง 30 วินาทีล่าสุด และเพิ่มเงื่อนไขการตรวจสอบ
  const [duplicates] = await conn.query(
    `SELECT id, created_at FROM activities 
     WHERE system_id = ? 
     AND important_info = ? 
     AND TRIM(details) = TRIM(?)
     AND dept_change_code = ?
     AND created_by = ?
     AND created_at >= NOW() - INTERVAL 30 SECOND
     ORDER BY created_at DESC
     LIMIT 1`,
    [system_id, important_info, details, dept_change_code, created_by]
  );
  
  if (duplicates.length > 0) {
    const timeDiff = Date.now() - new Date(duplicates[0].created_at).getTime();
    const secondsDiff = Math.floor(timeDiff / 1000);
    return {
      isDuplicate: true,
      message: `กรุณารอ ${30 - secondsDiff} วินาที ก่อนบันทึกข้อมูลซ้ำ`
    };
  }
  
  return { isDuplicate: false };
}

// แก้ไข API endpoint สำหรับบันทึกกิจกรรม
app.post('/api/activities', async (req, res) => {
  let conn;
  try {
    conn = await pool.getConnection();
    await conn.beginTransaction();

    const filePaths = [];
    const imagePaths = [];

    if (req.files) {
      // จัดการไฟล์เอกสาร
      if (req.files['files[]']) {
        const files = Array.isArray(req.files['files[]']) ? req.files['files[]'] : [req.files['files[]']];
        for (const file of files) {
          const timestamp = Date.now();
          const originalName = file.name;
          const safeName = `${timestamp}-${encodeURIComponent(originalName)}`;
          const uploadPath = path.join(uploadsDir, safeName);
          
          try {
            await file.mv(uploadPath);
            filePaths.push(`/uploads/${safeName}`);
            console.log('Uploaded file:', safeName);
          } catch (uploadError) {
            console.error('Error uploading file:', uploadError);
            throw new Error('ไม่สามารถอัพโหลดไฟล์ได้');
          }
        }
      }

      // จัดการไฟล์รูปภาพ
      if (req.files['images[]']) {
        const images = Array.isArray(req.files['images[]']) ? req.files['images[]'] : [req.files['images[]']];
        for (const image of images) {
          const timestamp = Date.now();
          const originalName = image.name;
          const safeName = `${timestamp}-${encodeURIComponent(originalName)}`;
          const uploadPath = path.join(uploadsDir, safeName);
          
          try {
            await image.mv(uploadPath);
            imagePaths.push(`/uploads/${safeName}`);
            console.log('Uploaded image:', safeName);
          } catch (uploadError) {
            console.error('Error uploading image:', uploadError);
            throw new Error('ไม่สามารถอัพโหลดรูปภาพได้');
          }
        }
      }
    }

    // บันทึกข้อมูล
    const [result] = await conn.query(
      `INSERT INTO activities (
        system_id,
        important_info,
        details,
        dept_change_code,
        dept_full,
        created_by,
        file_paths,
        image_paths,
        created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        req.body.system_id,
        req.body.important_info,
        req.body.details.trim(),
        req.body.dept_change_code,
        req.body.dept_full,
        req.body.created_by || null,
        filePaths.length > 0 ? filePaths.join(',') : null,
        imagePaths.length > 0 ? imagePaths.join(',') : null
      ]
    );

    await conn.commit();

    res.json({
      status: 'success',
      message: 'บันทึกข้อมูลสำเร็จ',
      activityId: result.insertId,
      filePaths,
      imagePaths
    });

  } catch (error) {
    if (conn) await conn.rollback();
    console.error('Error saving activity:', error);
    
    // ลบไฟล์ที่อัพโหลดไว้ในกรณีที่เกิดข้อผิดพลาด
    [...filePaths, ...imagePaths].forEach(filePath => {
      const fullPath = path.join(__dirname, filePath);
      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
      }
    });

    res.status(500).json({
      status: 'error',
      message: error.message || 'ไม่สามารถบันทึกข้อมูลได้'
    });
  } finally {
    if (conn) conn.release();
  }
});

// เพิ่ม endpoint สำหรับแก้ไขกิจกรรม
app.put('/api/activities/:id', getUserData, async (req, res) => {
  let conn;
  try {
    const { id } = req.params;
    const userDept = req.user.dept_change_code;

    if (!req.body.details?.trim()) {
      return res.status(400).json({
        status: 'error',
        message: 'กรุณากรอกรายละเอียด'
      });
    }

    conn = await pool.getConnection();
    await conn.beginTransaction();

    // Get current record data before update
    const [currentRecord] = await conn.query(
      'SELECT * FROM activities WHERE id = ?',
      [id]
    );

    if (currentRecord.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'ไม่พบข้อมูลกิจกรรม'
      });
    }

    // Check department permission
    if (currentRecord[0].dept_change_code !== userDept) {
      return res.status(403).json({
        status: 'error',
        message: 'ไม่มีสิทธิ์แก้ไขข้อมูลของแผนกอื่น'
      });
    }

    const oldRecord = currentRecord[0];
    let newFilePaths = oldRecord.file_paths;
    let newImagePaths = oldRecord.image_paths;

    // Handle removed files
    if (req.body.removedFiles) {
      const removedFiles = Array.isArray(req.body.removedFiles) ? req.body.removedFiles : [req.body.removedFiles];
      removedFiles.forEach(filePath => {
        const fullPath = path.join(__dirname, filePath);
        if (fs.existsSync(fullPath)) {
          fs.unlinkSync(fullPath);
        }
        newFilePaths = oldRecord.file_paths
          .split(',')
          .filter(path => path !== filePath)
          .join(',');
      });
    }

    // Handle removed images
    if (req.body.removedImages) {
      const removedImages = Array.isArray(req.body.removedImages) ? req.body.removedImages : [req.body.removedImages];
      removedImages.forEach(imagePath => {
        const fullPath = path.join(__dirname, imagePath);
        if (fs.existsSync(fullPath)) {
          fs.unlinkSync(fullPath);
        }
        newImagePaths = oldRecord.image_paths
          .split(',')
          .filter(path => path !== imagePath)
          .join(',');
      });
    }

    // Handle new file uploads
    if (req.files) {
      if (req.files['files[]']) {
        const files = Array.isArray(req.files['files[]']) ? req.files['files[]'] : [req.files['files[]']];
        for (const file of files) {
          const timestamp = Date.now();
          const fileName = `${timestamp}-${file.name}`;
          const uploadPath = path.join(__dirname, 'uploads', fileName);
          await file.mv(uploadPath);
          newFilePaths = newFilePaths ? `${newFilePaths},/uploads/${fileName}` : `/uploads/${fileName}`;
        }
      }

      if (req.files['images[]']) {
        const images = Array.isArray(req.files['images[]']) ? req.files['images[]'] : [req.files['images[]']];
        for (const image of images) {
          const timestamp = Date.now();
          const fileName = `${timestamp}-${image.name}`;
          const uploadPath = path.join(__dirname, 'uploads', fileName);
          await image.mv(uploadPath);
          newImagePaths = newImagePaths ? `${newImagePaths},/uploads/${fileName}` : `/uploads/${fileName}`;
        }
      }
    }

    // Insert into history table
    await conn.query(
      `INSERT INTO activities_history (
        activity_id,
        important_info_old,
        important_info_new,
        details_old,
        details_new,
        file_paths_old,
        file_paths_new,
        image_paths_old,
        image_paths_new,
        modified_by,
        modified_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
      [
        id,
        oldRecord.important_info,
        req.body.important_info,
        oldRecord.details,
        req.body.details.trim(),
        oldRecord.file_paths,
        newFilePaths,
        oldRecord.image_paths,
        newImagePaths,
        req.user.emp_id
      ]
    );

    // Update the record
    await conn.query(
      `UPDATE activities 
       SET important_info = ?,
           details = ?,
           file_paths = ?,
           image_paths = ?,
           updated_by = ?,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [
        req.body.important_info,
        req.body.details.trim(),
        newFilePaths,
        newImagePaths,
        req.user.emp_id,
        id
      ]
    );

    await conn.commit();

    // Fetch updated record with user info
    const [updatedActivity] = await conn.query(
      `SELECT a.*, 
              CONCAT(u1.first_name, ' ', u1.last_name) as created_by_name,
              CONCAT(u2.first_name, ' ', u2.last_name) as updated_by_name,
              u1.title_s_desc,
              u1.dept_full as user_dept_full
       FROM activities a
       LEFT JOIN users u1 ON a.created_by = u1.emp_id
       LEFT JOIN users u2 ON a.updated_by = u2.emp_id
       WHERE a.id = ?`,
      [id]
    );

    res.json({
      status: 'success',
      message: 'อัพเดตข้อมูลสำเร็จ',
      activity: updatedActivity[0]
    });

  } catch (error) {
    if (conn) await conn.rollback();
    console.error('Error updating activity:', error);
    res.status(500).json({
      status: 'error',
      message: 'ไม่สามารถอัพเดตข้อมูลได้'
    });
  } finally {
    if (conn) conn.release();
  }
});

// เพิ่ม endpoint สำหรับ Super Admin แก้ไขกิจกรรม
app.put('/api/Superactivities/:id', async (req, res) => {
  let connection;
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();

    const activityId = req.params.id;
    const { details, file_paths, image_paths } = req.body;
    let removedFiles = [];
    let removedImages = [];

    try {
      if (req.body.removedFiles) {
        removedFiles = JSON.parse(req.body.removedFiles);
      }
      if (req.body.removedImages) {
        removedImages = JSON.parse(req.body.removedImages);
      }
    } catch (error) {
      console.error('Error parsing removed files/images:', error);
    }

    // ลบไฟล์เก่า
    [...removedFiles, ...removedImages].forEach(filePath => {
      const fullPath = path.join(__dirname, filePath);
      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
      }
    });

    // อัพโหลดไฟล์ใหม่
    let newFilePaths = [];
    let newImagePaths = [];

    if (req.files) {
      // จัดการไฟล์
      if (req.files['files[]']) {
        const files = Array.isArray(req.files['files[]']) ? req.files['files[]'] : [req.files['files[]']];
        for (const file of files) {
          const timestamp = Date.now();
          const filename = `${timestamp}-${file.name}`;
          const uploadPath = path.join(__dirname, 'uploads', filename);
          await file.mv(uploadPath);
          newFilePaths.push('/uploads/' + filename);
        }
      }

      // จัดการรูปภาพ
      if (req.files['images[]']) {
        const images = Array.isArray(req.files['images[]']) ? req.files['images[]'] : [req.files['images[]']];
        for (const image of images) {
          const timestamp = Date.now();
          const filename = `${timestamp}-${image.name}`;
          const uploadPath = path.join(__dirname, 'uploads', filename);
          await image.mv(uploadPath);
          newImagePaths.push('/uploads/' + filename);
        }
      }
    }

    // รวมและอัพเดต paths
    const updatedFilePaths = [...(file_paths ? file_paths.split(',').filter(Boolean) : []), ...newFilePaths].join(',');
    const updatedImagePaths = [...(image_paths ? image_paths.split(',').filter(Boolean) : []), ...newImagePaths].join(',');

    // อัพเดตข้อมูลในฐานข้อมูล
    await connection.query(
      `UPDATE activities 
       SET details = ?,
           file_paths = ?,
           image_paths = ?,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [details, updatedFilePaths || null, updatedImagePaths || null, activityId]
    );

    await connection.commit();
    res.json({ 
      status: 'success',
      message: 'อัพเดตข้อมูลสำเร็จ',
      file_paths: updatedFilePaths,
      image_paths: updatedImagePaths
    });

  } catch (error) {
    if (connection) await connection.rollback();
    console.error('Error updating activity:', error);
    res.status(500).json({ 
      status: 'error',
      message: 'ไม่สามารถอัพเดตข้อมูลได้: ' + error.message 
    });
  } finally {
    if (connection) connection.release();
  }
});

// ใช้ใน: Dataactivities.vue
// ทำหน้าที่: ดึงข้อมูลกิจกรรมตาม systemId และ importantInfoId
// แสดงรายการกิจกรรมพร้อมข้อมูลผู้สร้างและผู้แก้ไข
app.get('/api/activities/:systemId/:importantInfoId', async (req, res) => {
  let conn;
  try {
    const { systemId, importantInfoId } = req.params;
    conn = await pool.getConnection();
    
    const [activities] = await conn.query(
      `SELECT DISTINCT
         a.*,
         sd.important_info as important_info_display,
         COALESCE(u1.first_name, '') as first_name,
         COALESCE(u1.last_name, '') as last_name,
         COALESCE(u1.title_s_desc, '') as title_s_desc,
         COALESCE(u1.dept_full, '') as creator_dept_full,
         CONCAT(u2.first_name, ' ', u2.last_name) as updated_by_name
        FROM activities a
        LEFT JOIN users u1 ON a.created_by = u1.emp_id
        LEFT JOIN users u2 ON a.updated_by = u2.emp_id
        LEFT JOIN system_details sd ON sd.id = a.important_info
        WHERE a.system_id = ? 
        AND a.important_info = ?
        GROUP BY a.id
        ORDER BY a.created_at DESC`,
      [systemId, importantInfoId]
    );

    // แปลงข้อมูลให้ใช้ important_info จาก system_details
    const transformedActivities = activities.map(activity => ({
      ...activity,
      important_info_original: activity.important_info,
      important_info: activity.important_info_display
    }));

    console.log('Found activities:', transformedActivities.length);
    res.json(transformedActivities);

  } catch (error) {
    console.error('Error fetching activities:', error);
    res.status(500).json({
      status: 'error',
      message: 'ไม่สามารถดึงข้อมูลกิจกรรมได้'
    });
  } finally {
    if (conn) conn.release();
  }
});

// ใช้ใน: Dataactivities.vue
// ทำหน้าที่: ดึงข้อมูลกิจกรรมทั้งหมด
// แสดงรายการกิจกรรมพร้อมข้อมูลระบบและผู้เกี่ยวข้อง
app.get('/api/activities', async (req, res) => {
  let conn;
  try {
    conn = await pool.getConnection();
    
    const [activities] = await conn.query(
      `SELECT DISTINCT
        a.*,
        u1.title_s_desc,
        u1.first_name,
        u1.last_name,
        u1.dept_full as user_dept_full,
        CONCAT(u2.first_name, ' ', u2.last_name) as updated_by_name,
        s.name_th as system_name,
        sd.important_info as important_info_display,
        sd.reference_no,
        sd.additional_info as system_additional_info
      FROM activities a
      LEFT JOIN users u1 ON a.created_by = u1.emp_id
      LEFT JOIN users u2 ON a.updated_by = u2.emp_id
      LEFT JOIN system_master s ON a.system_id = s.id
      LEFT JOIN system_details sd ON sd.id = a.important_info
      GROUP BY a.id, a.created_at
      ORDER BY a.created_at DESC`
    );

    // แปลงข้อมูลให้ใช้ important_info จาก system_details
    const transformedActivities = activities.map(activity => ({
      ...activity,
      important_info_original: activity.important_info,
      important_info: activity.important_info_display
    }));

    console.log('Found activities:', transformedActivities.length);
    res.json(transformedActivities);

  } catch (error) {
    console.error('Error fetching activities:', error);
    res.status(500).json({
      status: 'error',
      message: 'ไม่สามารถดึงข้อมูลกิจกรรมได้'
    });
  } finally {
    if (conn) conn.release();
  }
});

// === Admin Management ===
// ใช้ใน: SuperAdmin.vue, UserManagement.vue
// ทำหน้าที่: บันทึกหรืออัพเดตสิทธิ์ผู้ใช้งาน
// กำหนดบทบาทเป็น User, Admin, หรือ Super Admin
app.post('/api/save-admin-role', async (req, res) => {
  let conn;
  try {
    const { emp_id, role_id, title_s_desc, first_name, last_name, dept_change_code, dept_full } = req.body;
    
    // ตรวจสอบข้อมูลที่จำเป็นทั้งหมด
    if (!emp_id || !role_id || !first_name || !last_name || !dept_change_code || !dept_full) {
      return res.status(400).json({
        status: 'error',
        message: 'กรุณากรอกข้อมูลให้ครบถ้วน'
      });
    }

    // ตรวจสอบว่า role_id ถูกต้อง
    if (![1, 2, 3].includes(Number(role_id))) {
      return res.status(400).json({
        status: 'error',
        message: 'ระดับสิทธิ์ไม่ถูกต้อง'
      });
    }
    
    conn = await pool.getConnection();
    
    // เริ่ม transaction
    await conn.beginTransaction();
    
    try {
      // เช็คว่ามีข้อมูลผู้ใช้นี้อยู่แล้วหรือไม่
      const [existing] = await conn.query(
        'SELECT * FROM users WHERE emp_id = ?',
        [emp_id]
      );
      
      if (existing.length > 0) {
        // ถ้ามีข้อมูลอยู่แล้ว ให้อัพเดต
        await conn.query(
          `UPDATE users SET 
           role_id = ?,
           title_s_desc = ?,
           first_name = ?,
           last_name = ?,
           dept_change_code = ?,
           dept_full = ?,
           updated_at = CURRENT_TIMESTAMP
           WHERE emp_id = ?`,
          [role_id, title_s_desc || '', first_name, last_name, dept_change_code, dept_full, emp_id]
        );
      } else {
        // ถ้ายังไม่มีข้อมูล ให้เพิ่มใหม่
        await conn.query(
          `INSERT INTO users (
            emp_id, role_id, title_s_desc, first_name, last_name, 
            dept_change_code, dept_full, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
          [emp_id, role_id, title_s_desc || '', first_name, last_name, dept_change_code, dept_full]
        );
      }

      // ดึงข้อมูลที่บันทึกเพื่อยืนยัน
      const [savedUser] = await conn.query(
        'SELECT * FROM users WHERE emp_id = ?',
        [emp_id]
      );

      if (!savedUser.length) {
        throw new Error('ไม่พบข้อมูลที่บันทึก');
      }

      // ยืนยัน transaction
      await conn.commit();
      
      res.json({
        status: 'success',
        message: 'บันทึกสิทธิ์ผู้ใช้งานสำเร็จ',
        user: savedUser[0]
      });

    } catch (error) {
      // ถ้าเกิดข้อผิดพลาดให้ rollback
      await conn.rollback();
      throw error;
    }

  } catch (error) {
    console.error('Error saving admin role:', error);
    res.status(500).json({
      status: 'error',
      message: 'ไม่สามารถบันทึกสิทธิ์ผู้ใช้งานได้',
      error: error.message
    });
  } finally {
    if (conn) {
      conn.release();
    }
  }
});

// ใช้ใน: SuperAdmin.vue, UserManagement.vue
// ทำหน้าที่: ลบสิทธิ์ผู้ดูแลระบบ
// เปลี่ยนสิทธิ์เป็นผู้ใช้งานทั่วไป (role_id = 1)
app.delete('/api/remove-admin-role/:emp_id', async (req, res) => {
  let conn;
  try {
    const empId = req.params.emp_id;
    
    if (!empId) {
      return res.status(400).json({
        status: 'error',
        message: 'กรุณาระบุรหัสพนักงาน'
      });
    }

    conn = await pool.getConnection();
    
    // เริ่ม transaction
    await conn.beginTransaction();

    // ตรวจสอบว่ามีข้อมูลผู้ใช้อยู่หรือไม่
    const [user] = await conn.query(
      'SELECT * FROM users WHERE emp_id = ?',
      [empId]
    );

    if (user.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'ไม่พบข้อมูลผู้ใช้'
      });
    }

    // อัพเดต role_id เป็น 1 (User)
    await conn.query(
      'UPDATE users SET role_id = 1, updated_at = CURRENT_TIMESTAMP WHERE emp_id = ?',
      [empId]
    );

    // ยืนยัน transaction
    await conn.commit();
    
    res.json({
      status: 'success',
      message: 'เปลี่ยนสิทธิ์เป็นผู้ใช้งานทั่วไปสำเร็จ'
    });

  } catch (error) {
    if (conn) {
      await conn.rollback();
    }
    console.error('Error removing admin role:', error);
    res.status(500).json({
      status: 'error',
      message: 'ไม่สามารถลบสิทธิ์ผู้ใช้งานได้'
    });
  } finally {
    if (conn) conn.release();
  }
});

// ใช้ใน: SuperAdmin.vue, UserManagement.vue
// ทำหน้าที่: ดึงข้อมูลผู้ใช้ทั้งหมด
// รวมข้อมูลจากระบบหลัก (AD) และตาราง users
app.get('/api/admin-users', async (req, res) => {
  let conn;
  try {
    conn = await pool.getConnection();

    // ดึงข้อมูล admin users จากตาราง users
    const [adminUsers] = await conn.query(
      `SELECT emp_id, role_id, title_s_desc, first_name, last_name, 
       dept_change_code, dept_full, created_at, updated_at 
       FROM users 
       ORDER BY created_at DESC`
    );

    // ดึงข้อมูลผู้ใช้จากระบบหลัก (AD)
    try {
      const adResponse = await axios.get('http://localhost:3007/api/all-users');
      const adUsers = adResponse.data.data.dataDetail;

      // รวมข้อมูลจากทั้งสองแหล่ง
      const combinedUsers = adUsers.map(adUser => {
        const adminUser = adminUsers.find(admin => admin.emp_id === adUser.emp_id);
        return {
          emp_id: adUser.emp_id,
          role_id: adminUser ? adminUser.role_id : 1, // ถ้าไม่มีในตาราง users ให้เป็น user ทั่วไป
          title_s_desc: adUser.title_s_desc,
          first_name: adUser.first_name,
          last_name: adUser.last_name,
          dept_change_code: adUser.dept_change_code,
          dept_full: adUser.dept_full,
          created_at: adminUser ? adminUser.created_at : null,
          updated_at: adminUser ? adminUser.updated_at : null
        };
      });

      res.json(combinedUsers);
    } catch (adError) {
      console.error('Error fetching AD users:', adError);
      // ถ้าไม่สามารถดึงข้อมูลจาก AD ได้ ให้ส่งเฉพาะข้อมูล admin
      res.json(adminUsers);
    }

  } catch (error) {
    console.error('Error fetching admin users:', error);
    res.status(500).json({
      status: 'error',
      message: 'ไม่สามารถดึงข้อมูลผู้ใช้งานได้'
    });
  } finally {
    if (conn) conn.release();
  }
});

// === System Status Management ===
// ใช้ใน: datasystemrecord.vue
// ทำหน้าที่: เปิด/ปิดการใช้งานระบบ
// เฉพาะ Admin และ Super Admin เท่านั้นที่สามารถใช้งานได้
app.put('/api/system-records/:id/toggle-status', getUserData, async (req, res) => {
  let conn;
  try {
    const systemId = req.params.id;
    console.log('Toggling status for system:', systemId);
    
    conn = await pool.getConnection();

    // ตรวจสอบสิทธิ์ผู้ใช้
    const [userRole] = await conn.query(
      'SELECT role_id FROM users WHERE emp_id = ?',
      [req.user.emp_id]
    );

    // ถ้าไม่ใช่ Admin หรือ SuperAdmin ไม่อนุญาตให้เปลี่ยนสถานะ
    if (!userRole.length || (userRole[0].role_id !== 2 && userRole[0].role_id !== 3)) {
      return res.status(403).json({
        status: 'error',
        message: 'ไม่มีสิทธิ์เปลี่ยนสถานะการใช้งานระบบ เฉพาะผู้ดูแลระบบเท่านั้น'
      });
    }
    
    // ดึงข้อมูลสถานะปัจจุบัน
    const [rows] = await conn.query(
      'SELECT is_active FROM system_master WHERE id = ?',
      [systemId]
    );

    if (rows.length === 0) {
      console.log('System not found:', systemId);
      return res.status(404).json({
        status: 'error',
        message: 'ไม่พบข้อมูลระบบ'
      });
    }

    // สลับสถานะ
    const newStatus = rows[0].is_active === 1 ? 0 : 1;
    console.log('New status will be:', newStatus);

    // อัพเดตสถานะในฐานข้อมูล
    await conn.query(
      'UPDATE system_master SET is_active = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [newStatus, systemId]
    );

    console.log('Status updated successfully');

    res.json({
      status: 'success',
      is_active: newStatus === 1,
      message: newStatus === 1 ? 'เปิดใช้งานระบบสำเร็จ' : 'ปิดใช้งานระบบสำเร็จ'
    });

  } catch (error) {
    console.error('Error toggling system status:', error);
    res.status(500).json({
      status: 'error',
      message: 'ไม่สามารถเปลี่ยนสถานะการใช้งานได้ กรุณาลองใหม่อีกครั้ง'
    });
  } finally {
    if (conn) conn.release();
  }
});

// === Connection Check ===
// ใช้ใน: ทุก Component ที่ต้องการตรวจสอบการเชื่อมต่อ
// ทำหน้าที่: ตรวจสอบการเชื่อมต่อกับ server
// และส่งข้อมูลแผนกของผู้ใช้กลับไป
app.get('/api/check-connection', getUserData, (req, res) => {
  res.json({ 
    success: true, 
    message: 'เชื่อมต่อสำเร็จ',
    user: {
      dept_change_code: req.user.dept_change_code,
      dept_full: req.user.dept_full
    }
  });
});

// === Permission Check ===
// ใช้ใน: ทุก Component ที่ต้องการตรวจสอบสิทธิ์
// ทำหน้าที่: ตรวจสอบสิทธิ์ผู้ใช้งาน
// ส่งข้อมูล role_id และสถานะการเป็น admin กลับไป
app.get('/api/check-permission', getUserData, async (req, res) => {
  let conn;
  try {
    conn = await pool.getConnection();
    const empId = req.user.emp_id;

    if (!empId) {
      return res.status(401).json({
        status: 'error',
        message: 'ไม่พบข้อมูลผู้ใช้งาน'
      });
    }

    // ดึงข้อมูล role_id จากตาราง users โดยตรง
    const [user] = await conn.query(
      'SELECT role_id FROM users WHERE emp_id = ?',
      [empId]
    );

    if (user.length === 0) {
      return res.json({
        status: 'success',
        data: {
          isAdmin: false,
          role_id: 1, // ผู้ใช้งานทั่วไป
          message: 'ตรวจสอบสิทธิ์สำเร็จ'
        }
      });
    }

    // ตรวจสอบว่าเป็น admin หรือ superadmin
    const isAdmin = user[0].role_id === 2 || user[0].role_id === 3;

    res.json({
      status: 'success',
      data: {
        isAdmin: isAdmin,
        role_id: user[0].role_id
      }
    });

  } catch (error) {
    console.error('เกิดข้อผิดพลาดในการตรวจสอบสิทธิ์:', error);
    res.status(500).json({
      status: 'error',
      message: 'ไม่สามารถตรวจสอบสิทธิ์ผู้ใช้งานได้'
    });
  } finally {
    if (conn) conn.release();
  }
});

// === User Role Check ===
// ใช้ใน: ทุก Component ที่ต้องการตรวจสอบ role ของผู้ใช้
// ทำหน้าที่: ดึงข้อมูล role_id ของผู้ใช้จาก emp_id
app.get('/api/user-role/:emp_id', async (req, res) => {
  let conn;
  try {
    conn = await pool.getConnection();
    const empId = req.params.emp_id;

    // ดึงข้อมูล role_id จากตาราง users
    const [user] = await conn.query(
      'SELECT role_id FROM users WHERE emp_id = ?',
      [empId]
    );

    if (user.length === 0) {
      return res.json({
        status: 'success',
        role_id: 1 // default เป็น user ทั่วไป
      });
    }

    res.json({
      status: 'success',
      role_id: user[0].role_id
    });

  } catch (error) {
    console.error('Error getting user role:', error);
    res.status(500).json({
      status: 'error',
      message: 'ไม่สามารถดึงข้อมูลสิทธิ์ผู้ใช้ได้'
    });
  } finally {
    if (conn) conn.release();
  }
});

// เพิ่ม endpoint สำหรับลบกิจกรรม
app.delete('/api/activities/:id', getUserData, async (req, res) => {
  let conn;
  try {
    const { id } = req.params;
    const userDept = req.user.dept_change_code;

    conn = await pool.getConnection();
    await conn.beginTransaction();

    try {
      // Check if activity exists and belongs to user's department
      const [activity] = await conn.query(
        'SELECT dept_change_code, file_paths, image_paths FROM activities WHERE id = ?',
        [id]
      );

      if (activity.length === 0) {
        await conn.rollback();
        return res.status(404).json({
          status: 'error',
          message: 'ไม่พบข้อมูลกิจกรรม'
        });
      }

      // Check department permission
      if (activity[0].dept_change_code !== userDept) {
        await conn.rollback();
        return res.status(403).json({
          status: 'error',
          message: 'ไม่มีสิทธิ์ลบข้อมูลของแผนกอื่น'
        });
      }

      // Delete related files if they exist
      if (activity[0].file_paths) {
        const filePaths = activity[0].file_paths.split(',');
        for (const filePath of filePaths) {
          const fullPath = path.join(__dirname, filePath);
          if (fs.existsSync(fullPath)) {
            try {
              fs.unlinkSync(fullPath);
            } catch (fileError) {
              console.error('Error deleting file:', fileError);
              // Continue even if file deletion fails
            }
          }
        }
      }

      // Delete related images if they exist
      if (activity[0].image_paths) {
        const imagePaths = activity[0].image_paths.split(',');
        for (const imagePath of imagePaths) {
          const fullPath = path.join(__dirname, imagePath);
          if (fs.existsSync(fullPath)) {
            try {
              fs.unlinkSync(fullPath);
            } catch (imageError) {
              console.error('Error deleting image:', imageError);
              // Continue even if image deletion fails
            }
          }
        }
      }

      // Delete activity history first
      await conn.query('DELETE FROM activities_history WHERE activity_id = ?', [id]);

      // Delete the activity
      await conn.query('DELETE FROM activities WHERE id = ?', [id]);

      await conn.commit();

      res.json({
        status: 'success',
        message: 'ลบกิจกรรมสำเร็จ'
      });

    } catch (innerError) {
      await conn.rollback();
      throw innerError;
    }

  } catch (error) {
    console.error('Error deleting activity:', error);
    if (conn) await conn.rollback();
    res.status(500).json({
      status: 'error',
      message: 'ไม่สามารถลบกิจกรรมได้ กรุณาลองใหม่อีกครั้ง'
    });
  } finally {
    if (conn) conn.release();
  }
});

// เพิ่ม endpoint สำหรับ Super Admin ลบกิจกรรม
app.delete('/api/Superactivities/:id', async (req, res) => {
  let conn;
  try {
    const { id } = req.params;

    conn = await pool.getConnection();

    // ตรวจสอบว่ากิจกรรมนี้มีอยู่หรือไม่
    const [activity] = await conn.query(
      'SELECT file_paths, image_paths FROM activities WHERE id = ?',
      [id]
    );

    if (activity.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'ไม่พบข้อมูลกิจกรรม'
      });
    }

    // ลบไฟล์ที่เกี่ยวข้อง (ถ้ามี)
    if (activity[0].file_paths) {
      const filePaths = activity[0].file_paths.split(',');
      filePaths.forEach(filePath => {
        const fullPath = path.join(__dirname, filePath);
        if (fs.existsSync(fullPath)) {
          fs.unlinkSync(fullPath);
        }
      });
    }

    // ลบรูปภาพที่เกี่ยวข้อง (ถ้ามี)
    if (activity[0].image_paths) {
      const imagePaths = activity[0].image_paths.split(',');
      imagePaths.forEach(imagePath => {
        const fullPath = path.join(__dirname, imagePath);
        if (fs.existsSync(fullPath)) {
          fs.unlinkSync(fullPath);
        }
      });
    }

    // ลบข้อมูล
    await conn.query('DELETE FROM activities WHERE id = ?', [id]);

    res.json({
      status: 'success',
      message: 'ลบกิจกรรมสำเร็จ'
    });

  } catch (error) {
    console.error('Error deleting activity:', error);
    res.status(500).json({
      status: 'error',
      message: 'ไม่สามารถลบกิจกรรมได้'
    });
  } finally {
    if (conn) conn.release();
  }
});

// ใช้ใน: SuperAdminActivities.vue - สำหรับดึงข้อมูลระบบตามแผนก
app.get('/api/systems-by-department', getUserData, async (req, res) => {
  let conn;
  try {
    const { dept_change_code } = req.query;
    conn = await pool.getConnection();
    
    let query = `
      SELECT 
        id,
        name_th,
        name_en,
        dept_change_code,
        dept_full,
        created_at,
        updated_at,
        is_active
      FROM system_master
      WHERE 1=1
    `;

    const params = [];
    
    if (dept_change_code) {
      query += ` AND dept_change_code = ?`;
      params.push(dept_change_code);
    }

    query += ` ORDER BY name_th ASC`;

    const [systems] = await conn.query(query, params);
    res.json(systems);

  } catch (error) {
    console.error('Error fetching systems by department:', error);
    res.status(500).json({
      status: 'error',
      message: 'ไม่สามารถดึงข้อมูลระบบได้'
    });
  } finally {
    if (conn) conn.release();
  }
});

// ย้าย endpoint ไปไว้ก่อน app.listen()
// === Department Management ===
app.get('/api/departments', async (req, res) => {
  let conn;
  try {
    conn = await pool.getConnection();
    
    // ดึงเฉพาะ dept_change_code และ dept_full ที่ไม่ซ้ำกัน
    const [departments] = await conn.query(`
      SELECT DISTINCT 
        dept_change_code,
        dept_full
      FROM users 
      WHERE dept_change_code != ''
        AND dept_full IS NOT NULL
        AND dept_change_code IS NOT NULL
      GROUP BY dept_change_code, dept_full
      ORDER BY dept_full ASC
    `);

    // ส่งเฉพาะข้อมูลที่จำเป็น
    const formattedDepartments = departments.map(dept => ({
      dept_change_code: dept.dept_change_code,
      dept_full: dept.dept_full
    }));

    res.json(formattedDepartments);
  } catch (error) {
    console.error('Error fetching departments:', error);
    res.status(500).json({
      status: 'error',
      message: 'ไม่สามารถดึงข้อมูลแผนกได้'
    });
  } finally {
    if (conn) conn.release();
  }
});

// === Super Admin System Management ===
app.post('/api/super-admin/system-record', getUserData, async (req, res) => {
  let conn;
  try {
    conn = await pool.getConnection();
    const { nameTH, nameEN, dept_full, dept_change_code } = req.body;

    // ตรวจสอบสิทธิ์ Super Admin
    const [userRole] = await conn.query(
      'SELECT role_id FROM users WHERE emp_id = ?',
      [req.user.emp_id]
    );

    if (!userRole.length || userRole[0].role_id !== 3) {
      return res.status(403).json({
        status: 'error',
        message: 'ไม่มีสิทธิ์ในการเพิ่มระบบ'
      });
    }

    // Validate input
    if (!nameTH || !nameEN || !dept_full || !dept_change_code) {
      return res.status(400).json({
        status: 'error',
        message: 'กรุณากรอกข้อมูลให้ครบถ้วน'
      });
    }

    // Insert new record
    const [result] = await conn.query(`
      INSERT INTO system_master 
      (name_th, name_en, dept_change_code, dept_full, created_by, is_active) 
      VALUES (?, ?, ?, ?, ?, 1)
    `, [
      nameTH.trim(),
      nameEN.trim(),
      dept_change_code,
      dept_full,
      req.user.emp_id
    ]);

    // Return success response with the new record
    const [newSystem] = await conn.query(
      'SELECT * FROM system_master WHERE id = ?',
      [result.insertId]
    );

    res.json(newSystem[0]);

  } catch (error) {
    console.error('Error saving system record:', error);
    res.status(500).json({
      status: 'error',
      message: 'ไม่สามารถบันทึกข้อมูลได้'
    });
  } finally {
    if (conn) conn.release();
  }
});

// Routes - ย้ายมาไว้หลัง middleware ทั้งหมด
app.use('/api', activitiesRouter);

// Error Handler
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({
    status: 'error',
    message: 'เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์'
  });
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  try {
    await pool.end();
    console.log('Database pool closed');
    process.exit(0);
  } catch (err) {
    console.error('Error closing pool:', err);
    process.exit(1);
  }
});

// === System Records Management ===
// ใช้ใน: SuperAdmin.vue - สำหรับดูข้อมูลทุกระบบ
app.get('/api/all-system-records', getUserData, async (req, res) => {
  let conn;
  try {
    conn = await pool.getConnection();
    
    // ตรวจสอบสิทธิ์ Super Admin และ Admin
    const [userRole] = await conn.query(
      'SELECT role_id FROM users WHERE emp_id = ?',
      [req.user.emp_id]
    );

    if (!userRole.length || (userRole[0].role_id !== 3 && userRole[0].role_id !== 2)) {
      return res.status(403).json({
        status: 'error',
        message: 'ไม่มีสิทธิ์เข้าถึงข้อมูล'
      });
    }

    // ดึงข้อมูลระบบทั้งหมด
    const [systems] = await conn.query(`
      SELECT 
        id,
        name_th,
        name_en,
        dept_change_code,
        dept_full,
        created_at,
        updated_at,
        is_active
      FROM system_master
      ORDER BY created_at DESC
    `);

    res.json(systems);

  } catch (error) {
    console.error('Error fetching all systems:', error);
    res.status(500).json({ 
      status: 'error',
      message: 'ไม่สามารถดึงข้อมูลได้'
    });
  } finally {
    if (conn) conn.release();
  }
});

// === Activity History Management ===
app.get('/api/activities/:id/history', getUserData, async (req, res) => {
  let conn;
  try {
    const { id } = req.params;
    conn = await pool.getConnection();

    // Fetch activity history with user information
    const [history] = await conn.query(`
      SELECT 
        ah.*,
        CONCAT(u.first_name, ' ', u.last_name) as modified_by_name,
        u.title_s_desc as modified_by_title,
        u.dept_full as modified_by_dept
      FROM activities_history ah
      LEFT JOIN users u ON ah.modified_by = u.emp_id
      WHERE ah.activity_id = ?
      ORDER BY ah.modified_at DESC
    `, [id]);

    res.json({
      status: 'success',
      history: history
    });

  } catch (error) {
    console.error('Error fetching activity history:', error);
    res.status(500).json({
      status: 'error',
      message: 'ไม่สามารถดึงข้อมูลประวัติการแก้ไขได้'
    });
  } finally {
    if (conn) conn.release();
  }
});

// Add the new endpoint before the existing system-details endpoints
app.get('/api/system-details/check/:id', async (req, res) => {
  let conn;
  try {
    const systemId = req.params.id;
    
    conn = await pool.getConnection();
    
    // Check if there are any associated details
    const [details] = await conn.query(
      'SELECT COUNT(*) as count FROM system_details WHERE system_id = ?',
      [systemId]
    );

    res.json({
      success: true,
      hasDetails: details[0].count > 0
    });
  } catch (error) {
    console.error('Error checking system details:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการตรวจสอบข้อมูล'
    });
  } finally {
    if (conn) conn.release();
  }
});
