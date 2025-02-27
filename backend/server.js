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
const fileUpload = require('express-fileupload');
const axios = require('axios');

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', 'http://localhost:8082');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  res.header('Access-Control-Allow-Credentials', 'true');
  
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

app.use(cors({
  origin: ['http://localhost:8080', 'http://localhost:8082'],
  credentials: true
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
  safeFileNames: true,
  preserveExtension: true
}));

// สร้างโฟลเดอร์สำหรับเก็บไฟล์
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  fs.chmodSync(uploadsDir, 0o755);
  console.log('สร้างโฟลเดอร์ uploads สำเร็จ');
} else {
  console.log('โฟลเดอร์ uploads มีอยู่แล้ว');
}

// แก้ไขการจัดการ static files
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
  // Ensure proper encoding of Thai filename
  const sanitizedName = Buffer.from(originalname, 'latin1').toString('utf8');
  // Return timestamp and original name separated by a single hyphen
  return `${timestamp}-${sanitizedName}`;
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
// ใช้ใน: datasystemrecord.vue - สำหรับดูข้อมูลระบบ
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

// ใช้ใน: datasystemrecord.vue - สำหรับดูข้อมูลเฉพาะแผนก
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

    // Insert new record
    const [result] = await conn.query(`
      INSERT INTO system_master 
      (name_th, name_en, dept_change_code, dept_full, is_active) 
      VALUES (?, ?, ?, ?, 1)
    `, [
      nameTH.trim(),
      nameEN.trim(),
      dept_change_code,
      dept_full
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
app.put('/api/system-record/:id', async (req, res) => {
  const id = req.params.id;
  const { nameTH, nameEN, dept_full, dept_change_code } = req.body;
  let conn;

  try {
    conn = await pool.getConnection();
    const query = `
      UPDATE system_master 
      SET name_th = ?, 
          name_en = ?, 
          dept_full = ?,
          dept_change_code = ?,
          updated_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `;

    const [result] = await conn.query(query, [nameTH, nameEN, dept_full, dept_change_code, id]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ 
        status: 'error',
        message: 'ไม่พบข้อมูลที่ต้องการอัปเดต' 
      });
    }

    res.json({ 
      status: 'success',
      message: 'อัปเดตข้อมูลสำเร็จ' 
    });

  } catch (error) {
    console.error('Error updating record:', error);
    res.status(500).json({ 
      status: 'error',
      message: 'ไม่สามารถอัปเดตข้อมูลได้' 
    });
  } finally {
    if (conn) conn.release();
  }
});

// ใช้ใน: SuperAdmin.vue - สำหรับลบระบบ
app.delete('/api/system-record/:id', getUserData, async (req, res) => {
  let conn;
  try {
    const { id } = req.params;
    
    conn = await pool.getConnection();

    // ตรวจสอบสิทธิ์ผู้ใช้
    const [userRole] = await conn.query(
      'SELECT role_id FROM users WHERE emp_id = ?',
      [req.user.emp_id]
    );

    // ถ้าไม่ใช่ Admin หรือ SuperAdmin ไม่อนุญาตให้ลบ
    if (!userRole.length || (userRole[0].role_id !== 2 && userRole[0].role_id !== 3)) {
      return res.status(403).json({
        success: false,
        message: 'ไม่มีสิทธิ์ลบข้อมูลระบบ'
      });
    }

    // ลบข้อมูลจากตาราง system_master
    const [result] = await conn.query('DELETE FROM system_master WHERE id = ?', [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'ไม่พบข้อมูลที่ต้องการลบ'
      });
    }

    res.json({
      success: true,
      message: 'ลบข้อมูลระบบสำเร็จ'
    });

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
app.post('/api/system-details', getUserData, async (req, res) => {
  let conn;
  try {
    console.log('Received data:', req.body);
    console.log('Received files:', req.files);
    
    const { systemId, importantInfo, referenceNo, additionalInfo } = req.body;
    const userDept = req.user.dept_change_code;
    const userDeptFull = req.user.dept_full;

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

    if (system[0].dept_change_code !== userDept) {
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
      
      const uploadedFiles = await Promise.all(files.map(async (file) => {
        // แก้ไขการจัดการชื่อไฟล์ภาษาไทย
        const timestamp = Date.now();
        const originalName = Buffer.from(file.name, 'binary').toString('utf8');
        const filename = `${timestamp}-${originalName}`;
        const uploadPath = path.join(__dirname, 'uploads', filename);
        
        await file.mv(uploadPath);
        return '/uploads/' + filename;
      }));
      
      filePath = uploadedFiles.join(',');
    }

    // บันทึกข้อมูล
    const insertQuery = `
      INSERT INTO system_details 
      (system_id, important_info, reference_no, additional_info, file_path, dept_change_code, dept_full) 
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    const [result] = await conn.query(insertQuery, [
      parseInt(systemId),
      importantInfo.trim(),
      referenceNo.trim(),
      additionalInfo?.trim() || null,
      filePath,
      userDept,
      userDeptFull
    ]);

    // ดึงข้อมูลที่เพิ่งบันทึกเพื่อส่งกลับ
    const [newRecord] = await conn.query(`
      SELECT * FROM system_details WHERE id = ?
    `, [result.insertId]);

    res.json({
      success: true,
      message: 'บันทึกข้อมูลสำเร็จ',
      data: newRecord[0]
    });

  } catch (error) {
    console.error('Error saving system details:', error);
    res.status(500).json({
      success: false,
      message: 'ไม่สามารถบันทึกข้อมูลได้',
      error: error.message,
      sqlMessage: error.sqlMessage,
      sqlState: error.sqlState
    });
  } finally {
    if (conn) conn.release();
  }
});

// ใช้ใน: Dataactivities.vue
app.get('/api/system-details/:systemId', async (req, res) => {
  let conn;
  try {
    conn = await pool.getConnection();
    const systemId = req.params.systemId;

    // ดึงข้อมูลรายละเอียดระบบ
    const [details] = await conn.query(`
      SELECT 
        id,
        system_id,
        important_info,
        reference_no,
        additional_info,
        file_path,
        dept_change_code,
        dept_full,
        created_at,
        updated_at
      FROM system_details 
      WHERE system_id = ?
      ORDER BY created_at DESC
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
app.put('/api/system-details/:id', getUserData, async (req, res) => {
  let conn;
  try {
    const detailId = req.params.id;
    const { systemId, importantInfo, referenceNo, additionalInfo, existingFiles } = req.body;
    const userDept = req.user.dept_change_code;

    // Validate required fields
    if (!importantInfo?.trim() || !referenceNo?.trim()) {
      return res.status(400).json({
        success: false,
        message: 'กรุณากรอกข้อมูลให้ครบถ้วน'
      });
    }

    conn = await pool.getConnection();

    // Check if detail exists and belongs to user's department
    const [detail] = await conn.query(
      'SELECT dept_change_code FROM system_details WHERE id = ?',
      [detailId]
    );

    if (detail.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'ไม่พบข้อมูลที่ต้องการแก้ไข'
      });
    }

    if (detail[0].dept_change_code !== userDept) {
      return res.status(403).json({
        success: false,
        message: 'ไม่มีสิทธิ์แก้ไขข้อมูลของแผนกอื่น'
      });
    }

    // Handle file upload
    let filePath = existingFiles || null;
    
    if (req.files && req.files.files) {
      const files = Array.isArray(req.files.files) ? req.files.files : [req.files.files];
      
      const uploadedFiles = await Promise.all(files.map(async (file) => {
        const timestamp = Date.now();
        const originalName = Buffer.from(file.name, 'binary').toString('utf8');
        const filename = `${timestamp}-${originalName}`;
        const uploadPath = path.join(__dirname, 'uploads', filename);
        
        await file.mv(uploadPath);
        return '/uploads/' + filename;
      }));
      
      filePath = uploadedFiles.join(',');
    }

    // Update the record
    const updateQuery = `
      UPDATE system_details 
      SET important_info = ?,
          reference_no = ?,
          additional_info = ?,
          file_path = ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;

    await conn.query(updateQuery, [
      importantInfo.trim(),
      referenceNo.trim(),
      additionalInfo?.trim() || '',
      filePath,
      detailId
    ]);

    res.json({
      success: true,
      message: 'อัพเดทข้อมูลสำเร็จ',
      file_path: filePath
    });

  } catch (error) {
    console.error('Error updating system detail:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการอัพเดทข้อมูล'
    });
  } finally {
    if (conn) conn.release();
  }
});

// ใช้ใน: SystemDetails.vue
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

    // ตรวจสอบว่ากิจกรรมนี้เป็นของแผนกผู้ใช้หรือไม่
    const [activity] = await conn.query(
      'SELECT dept_change_code, file_paths, image_paths FROM activities WHERE id = ?',
      [id]
    );

    if (activity.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'ไม่พบข้อมูลกิจกรรม'
      });
    }

    // ตรวจสอบสิทธิ์การแก้ไข (ต้องเป็นของแผนกเดียวกัน)
    if (activity[0].dept_change_code !== userDept) {
      return res.status(403).json({
        status: 'error',
        message: 'ไม่มีสิทธิ์แก้ไขข้อมูลของแผนกอื่น'
      });
    }

    // จัดการไฟล์ที่ถูกลบ
    let currentFilePaths = activity[0].file_paths ? activity[0].file_paths.split(',') : [];
    let currentImagePaths = activity[0].image_paths ? activity[0].image_paths.split(',') : [];

    // ลบไฟล์ที่ถูกเลือก
    if (req.body.removedFiles) {
      const filesToRemove = Array.isArray(req.body.removedFiles) ? req.body.removedFiles : [req.body.removedFiles];
      filesToRemove.forEach(filePath => {
        const fullPath = path.join(__dirname, filePath);
        if (fs.existsSync(fullPath)) {
          fs.unlinkSync(fullPath);
          console.log('Deleted file:', fullPath);
        }
        currentFilePaths = currentFilePaths.filter(path => path !== filePath);
      });
    }

    // ลบรูปภาพที่ถูกเลือก
    if (req.body.removedImages) {
      const imagesToRemove = Array.isArray(req.body.removedImages) ? req.body.removedImages : [req.body.removedImages];
      imagesToRemove.forEach(imagePath => {
        const fullPath = path.join(__dirname, imagePath);
        if (fs.existsSync(fullPath)) {
          fs.unlinkSync(fullPath);
          console.log('Deleted image:', fullPath);
        }
        currentImagePaths = currentImagePaths.filter(path => path !== imagePath);
      });
    }

    // จัดการไฟล์ใหม่
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
            currentFilePaths.push(`/uploads/${safeName}`);
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
            currentImagePaths.push(`/uploads/${safeName}`);
            console.log('Uploaded image:', safeName);
          } catch (uploadError) {
            console.error('Error uploading image:', uploadError);
            throw new Error('ไม่สามารถอัพโหลดรูปภาพได้');
          }
        }
      }
    }

    // อัพเดตข้อมูลในฐานข้อมูล
    const updateResult = await conn.query(
      `UPDATE activities 
       SET details = ?, 
           system_id = ?,
           important_info = ?,
           file_paths = ?, 
           image_paths = ?,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [
        req.body.details.trim(),
        req.body.system_id,
        req.body.important_info,
        currentFilePaths.length > 0 ? currentFilePaths.join(',') : null,
        currentImagePaths.length > 0 ? currentImagePaths.join(',') : null,
        id
      ]
    );

    if (updateResult[0].affectedRows === 0) {
      throw new Error('ไม่สามารถอัพเดตข้อมูลได้');
    }

    await conn.commit();

    // ดึงข้อมูลที่อัพเดตแล้วเพื่อส่งกลับ
    const [updatedActivity] = await conn.query(
      `SELECT a.*, sd.important_info as important_info_display
       FROM activities a
       LEFT JOIN system_details sd ON sd.id = a.important_info
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
      message: error.message || 'ไม่สามารถอัพเดตข้อมูลได้'
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
app.get('/api/activities/:systemId/:importantInfoId', async (req, res) => {
  let conn;
  try {
    const { systemId, importantInfoId } = req.params;
    conn = await pool.getConnection();
    
    const [activities] = await conn.query(
      `SELECT DISTINCT
         a.*,
         sd.important_info as important_info_display,
         COALESCE(u.first_name, '') as first_name,
         COALESCE(u.last_name, '') as last_name,
         COALESCE(u.title_s_desc, '') as title_s_desc,
         COALESCE(u.dept_full, '') as creator_dept_full
        FROM activities a
        LEFT JOIN users u ON a.created_by = u.emp_id
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
app.get('/api/activities', async (req, res) => {
  let conn;
  try {
    conn = await pool.getConnection();
    
    const [activities] = await conn.query(
      `SELECT DISTINCT
        a.*,
        u.title_s_desc,
        u.first_name,
        u.last_name,
        u.dept_full as user_dept_full,
        s.name_th as system_name,
        sd.important_info as important_info_display,
        sd.reference_no,
        sd.additional_info as system_additional_info
      FROM activities a
      LEFT JOIN users u ON a.created_by = u.emp_id
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

    // ตรวจสอบว่ากิจกรรมนี้มีอยู่จริงและเป็นของแผนกผู้ใช้หรือไม่
    const [activity] = await conn.query(
      'SELECT dept_change_code, file_paths, image_paths FROM activities WHERE id = ?',
      [id]
    );

    if (activity.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'ไม่พบข้อมูลกิจกรรม'
      });
    }

    // ตรวจสอบสิทธิ์การลบ (ต้องเป็นของแผนกเดียวกัน)
    if (activity[0].dept_change_code !== userDept) {
      return res.status(403).json({
        status: 'error',
        message: 'ไม่มีสิทธิ์ลบข้อมูลของแผนกอื่น'
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
      (name_th, name_en, dept_change_code, dept_full, is_active) 
      VALUES (?, ?, ?, ?, 1)
    `, [
      nameTH.trim(),
      nameEN.trim(),
      dept_change_code,
      dept_full
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
    
    // ตรวจสอบสิทธิ์ Super Admin
    const [userRole] = await conn.query(
      'SELECT role_id FROM users WHERE emp_id = ?',
      [req.user.emp_id]
    );

    if (!userRole.length || userRole[0].role_id !== 3) {
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
