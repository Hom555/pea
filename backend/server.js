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
app.use(fileUpload({
  createParentPath: true,
  limits: { 
    fileSize: 10 * 1024 * 1024 // 10MB max-file-size
  },
  useTempFiles: true,
  tempFileDir: '/tmp/',
  debug: true
}));

// เพิ่ม body size limit
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// แก้ไขการจัดการ static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ปรับปรุงการจัดการการเข้าถึงไฟล์
app.get('/uploads/*', (req, res) => {
  const filePath = path.join(__dirname, req.path);
  console.log('Accessing file:', filePath);
  
  if (fs.existsSync(filePath)) {
    res.sendFile(filePath);
  } else {
    console.log('File not found:', filePath);
    res.status(404).send('File not found');
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

const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  fs.chmodSync(uploadsDir, 0o755);
  console.log('สร้างโฟลเดอร์ uploads สำเร็จ');
} else {
  console.log('โฟลเดอร์ uploads มีอยู่แล้ว');
}

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
// ใช้ใน: SuperAdmin.vue - สำหรับดูข้อมูลทุกระบบ
app.get('/api/all-system-records', getUserData, async (req, res) => {
  let conn;
  try {
    conn = await pool.getConnection();
    
    // ตรวจสอบ role_id จากฐานข้อมูล
    const [userRole] = await conn.query(
      'SELECT role_id FROM users WHERE emp_id = ?',
      [req.user.emp_id]
    );

    // ถ้าไม่ใช่ Admin หรือ SuperAdmin ไม่อนุญาตให้เข้าถึง
    if (!userRole.length || (userRole[0].role_id !== 2 && userRole[0].role_id !== 3)) {
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

    console.log('Found all systems:', systems.length);
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

// ใช้ใน: datasystemrecord.vue - สำหรับดูข้อมูลเฉพาะแผนก
app.get('/api/system-records', getUserData, async (req, res) => {
  let conn;
  try {
    conn = await pool.getConnection();
    
    // ใช้ข้อมูลแผนกจาก middleware
    const userDept = req.user.dept_change_code;
    console.log('Fetching systems for dept:', userDept);

    // ดึงข้อมูลเฉพาะแผนกของผู้ใช้
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
      WHERE dept_change_code = ?
        AND is_active = 1
      ORDER BY created_at DESC
    `, [userDept]);

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
  const { nameTH, nameEN } = req.body;

  try {
    const query = `
      UPDATE system_master 
      SET name_th = ?, 
          name_en = ?, 
          updated_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `;

    const [result] = await pool.query(query, [nameTH, nameEN, id]);
    
    if (result.affectedRows === 0) {
      return res.status(404).send({ message: 'ไม่พบข้อมูลที่ต้องการอัปเดต' });
    }
    res.status(200).send({ message: 'อัปเดตข้อมูลสำเร็จ' });

  } catch (error) {
    console.error('Error updating record:', error);
    res.status(500).send({ message: 'ไม่สามารถอัปเดตข้อมูลได้' });
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

// ใช้ใน: Dataactivities.vue, system-activities.vue
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
    const { id } = req.params;
    const { importantInfo, referenceNo, additionalInfo, deletedFile } = req.body;
    const userDept = req.user.dept_change_code;

    if (!importantInfo || !referenceNo) {
      return res.status(400).json({ 
        success: false,
        message: 'กรุณากรอกข้อมูลที่จำเป็น' 
      });
    }

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
        message: 'ไม่พบข้อมูลที่ต้องการแก้ไข'
      });
    }

    if (detail[0].dept_change_code !== userDept) {
      return res.status(403).json({
        success: false,
        message: 'ไม่มีสิทธิ์แก้ไขข้อมูลของแผนกอื่น'
      });
    }

    // จัดการกับการลบไฟล์และไฟล์เดิม
    let currentFilePaths = detail[0].file_path ? detail[0].file_path.split(',') : [];
    
    if (deletedFile) {
      // ลบไฟล์จากระบบไฟล์
      const fullPath = path.join(__dirname, 'uploads', path.basename(deletedFile));
      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
        console.log('Deleted file:', fullPath);
      }

      // ลบ path ของไฟล์ออกจาก array
      currentFilePaths = currentFilePaths.filter(path => path !== deletedFile);
    }

    // จัดการกับไฟล์ใหม่
    if (req.files && req.files.files) {
      const files = Array.isArray(req.files.files) ? req.files.files : [req.files.files];
      
      // สร้างโฟลเดอร์ถ้ายังไม่มี
      const uploadDir = path.join(__dirname, 'uploads');
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      // อัพโหลดไฟล์ใหม่
      for (const file of files) {
        // แก้ไขการจัดการชื่อไฟล์ภาษาไทย
        const timestamp = Date.now();
        const originalName = Buffer.from(file.name, 'binary').toString('utf8');
        const filename = `${timestamp}-${originalName}`;
        const uploadPath = path.join(uploadDir, filename);
        await file.mv(uploadPath);
        currentFilePaths.push('/uploads/' + filename);
      }
    }

    // อัพเดตข้อมูล
    const updateData = {
      important_info: importantInfo.trim(),
      reference_no: referenceNo.trim(),
      additional_info: additionalInfo?.trim() || null,
      file_path: currentFilePaths.length > 0 ? currentFilePaths.join(',') : null
    };

    const updateFields = Object.keys(updateData)
      .map(key => `${key} = ?`)
      .join(', ');

    const updateValues = Object.values(updateData);
    updateValues.push(id);

    await conn.query(`
      UPDATE system_details 
      SET ${updateFields}
      WHERE id = ?
    `, updateValues);

    // ดึงข้อมูลที่อัพเดตแล้วเพื่อส่งกลับ
    const [updatedDetail] = await conn.query(`
      SELECT * FROM system_details WHERE id = ?
    `, [id]);

    res.json({
      success: true,
      message: 'อัปเดตข้อมูลสำเร็จ',
      data: updatedDetail[0]
    });

  } catch (error) {
    console.error('Error updating system details:', error);
    res.status(500).json({
      success: false,
      message: 'ไม่สามารถอัปเดตข้อมูลได้',
      error: error.message
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
// ใช้ใน: system-activities.vue
app.post('/api/activities', getUserData, async (req, res) => {
  let conn;
  try {
    console.log('Received activity data:', req.body);
    console.log('Received files:', req.files);
    console.log('User data:', req.user);

  const { systemId, importantInfo, details } = req.body;
    const userDept = req.user.dept_change_code;
    const userDeptFull = req.user.dept_full;

    // Validate required fields
    if (!systemId || !details) {
      return res.status(400).json({ 
        status: 'error',
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
        status: 'error',
        message: 'ไม่พบข้อมูลระบบ'
      });
    }

    if (system[0].dept_change_code !== userDept) {
      return res.status(403).json({
        status: 'error',
        message: 'ไม่มีสิทธิ์เพิ่มข้อมูลให้ระบบของแผนกอื่น'
      });
    }

    // Process uploaded files
    let filePaths = [];
    let imagePaths = [];

    if (req.files) {
      // สร้างโฟลเดอร์ถ้ายังไม่มี
      const uploadDir = path.join(__dirname, 'uploads');
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      if (req.files.files) {
        const files = Array.isArray(req.files.files) ? req.files.files : [req.files.files];
        for (const file of files) {
          // แก้ไขการจัดการชื่อไฟล์ภาษาไทย
          const timestamp = Date.now();
          const originalName = Buffer.from(file.name, 'binary').toString('utf8');
          const filename = `${timestamp}-${originalName}`;
          const uploadPath = path.join(uploadDir, filename);
          await file.mv(uploadPath);
          filePaths.push('/uploads/' + filename);
        }
      }

      if (req.files.images) {
        const images = Array.isArray(req.files.images) ? req.files.images : [req.files.images];
        for (const file of images) {
          // แก้ไขการจัดการชื่อไฟล์ภาษาไทย
          const timestamp = Date.now();
          const originalName = Buffer.from(file.name, 'binary').toString('utf8');
          const filename = `${timestamp}-${originalName}`;
          const uploadPath = path.join(uploadDir, filename);
          await file.mv(uploadPath);
          imagePaths.push('/uploads/' + filename);
        }
      }
    }

    // Insert activity with department info and get the inserted ID
    const [result] = await conn.execute(
      `INSERT INTO activities 
       (system_id, important_info, details, file_paths, image_paths, dept_change_code, dept_full, created_by) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
      systemId,
        importantInfo || null,
      details,
        filePaths.join(',') || null,
        imagePaths.join(',') || null,
        userDept,
        userDeptFull,
        req.user.emp_id || null
      ]
    );

    // ดึงข้อมูลที่เพิ่งบันทึก
    const [newActivity] = await conn.query(
      `SELECT * FROM activities WHERE id = LAST_INSERT_ID()`,
      []
    );

    console.log('Inserted activity ID:', result.insertId);
    console.log('New activity data:', newActivity[0]);

    res.status(200).json({ 
      status: 'success',
      message: 'บันทึกกิจกรรมสำเร็จ',
      activity: {
        ...newActivity[0],
        id: result.insertId
      }
    });

  } catch (error) {
    console.error('Error saving activity:', error);
    res.status(500).json({ 
      status: 'error',
      message: 'ไม่สามารถบันทึกกิจกรรมได้',
      error: error.message 
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
    const { details, systemId, importantInfo, removedFiles, removedImages } = req.body;
    const userDept = req.user.dept_change_code;

    if (!details?.trim()) {
      return res.status(400).json({
        success: false,
        message: 'กรุณากรอกรายละเอียด'
      });
    }

    conn = await pool.getConnection();

    // ตรวจสอบว่ากิจกรรมนี้เป็นของแผนกผู้ใช้หรือไม่
    const [activity] = await conn.query(
      'SELECT dept_change_code, file_paths, image_paths FROM activities WHERE id = ?',
      [id]
    );

    if (activity.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'ไม่พบข้อมูลกิจกรรม'
      });
    }

    if (activity[0].dept_change_code !== userDept) {
      return res.status(403).json({
        success: false,
        message: 'ไม่มีสิทธิ์แก้ไขข้อมูลของแผนกอื่น'
      });
    }

    // จัดการไฟล์ที่ถูกลบ
    let currentFilePaths = activity[0].file_paths ? activity[0].file_paths.split(',') : [];
    let currentImagePaths = activity[0].image_paths ? activity[0].image_paths.split(',') : [];

    // ลบไฟล์ที่ถูกเลือก
    if (removedFiles) {
      const filesToRemove = Array.isArray(removedFiles) ? removedFiles : [removedFiles];
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
    if (removedImages) {
      const imagesToRemove = Array.isArray(removedImages) ? removedImages : [removedImages];
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
      const uploadDir = path.join(__dirname, 'uploads');
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      // อัพโหลดไฟล์ใหม่
      if (req.files.files) {
        const files = Array.isArray(req.files.files) ? req.files.files : [req.files.files];
        for (const file of files) {
          const timestamp = Date.now();
          const originalName = Buffer.from(file.name, 'binary').toString('utf8');
          const filename = `${timestamp}-${originalName}`;
          const uploadPath = path.join(uploadDir, filename);
          await file.mv(uploadPath);
          currentFilePaths.push('/uploads/' + filename);
        }
      }

      // อัพโหลดรูปภาพใหม่
      if (req.files.images) {
        const images = Array.isArray(req.files.images) ? req.files.images : [req.files.images];
        for (const image of images) {
          const timestamp = Date.now();
          const originalName = Buffer.from(image.name, 'binary').toString('utf8');
          const filename = `${timestamp}-${originalName}`;
          const uploadPath = path.join(uploadDir, filename);
          await image.mv(uploadPath);
          currentImagePaths.push('/uploads/' + filename);
        }
      }
    }

    // อัพเดตข้อมูลในฐานข้อมูล
    await conn.query(
      `UPDATE activities 
       SET details = ?, 
           file_paths = ?, 
           image_paths = ?,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [
        details.trim(),
        currentFilePaths.join(',') || null,
        currentImagePaths.join(',') || null,
        id
      ]
    );

    // ดึงข้อมูลที่อัพเดตแล้ว
    const [updatedActivity] = await conn.query(
      'SELECT * FROM activities WHERE id = ?',
      [id]
    );

    res.json({
      success: true,
      message: 'อัพเดตข้อมูลสำเร็จ',
      activity: updatedActivity[0]
    });

  } catch (error) {
    console.error('Error updating activity:', error);
    res.status(500).json({
      success: false,
      message: 'ไม่สามารถอัพเดตข้อมูลได้',
      error: error.message
    });
  } finally {
    if (conn) conn.release();
  }
});

// ใช้ใน: Dataactivities.vue
app.get('/api/activities/:systemId/:importantInfoId', getUserData, async (req, res) => {
  const { systemId, importantInfoId } = req.params;
  let conn;

  try {
    conn = await pool.getConnection();
    const userDept = req.user.dept_change_code;

    console.log('Fetching activities with params:', {
      systemId,
      importantInfoId,
      userDept
    });

    // ตรวจสอบว่าระบบนี้เป็นของแผนกผู้ใช้หรือไม่
    const [system] = await conn.query(
      'SELECT dept_change_code FROM system_master WHERE id = ?',
      [systemId]
    );

    if (system.length === 0) {
      console.log('System not found');
      return res.status(404).json({
        status: 'error',
        message: 'ไม่พบข้อมูลระบบ'
      });
    }

    if (system[0].dept_change_code !== userDept) {
      console.log('Department mismatch:', {
        systemDept: system[0].dept_change_code,
        userDept
      });
      return res.status(403).json({
        status: 'error',
        message: 'ไม่มีสิทธิ์ดูข้อมูลของระบบแผนกอื่น'
      });
    }
    
    // ดึงข้อมูลกิจกรรมที่ตรงกับ systemId และ importantInfoId
    const [activities] = await conn.query(
      `SELECT a.*, u.first_name, u.last_name
       FROM activities a
       LEFT JOIN users u ON a.created_by = u.emp_id
       WHERE a.system_id = ? 
       AND a.important_info = ?
       AND a.dept_change_code = ?
       ORDER BY a.created_at DESC`,
      [systemId, importantInfoId, userDept]
    );

    console.log('Found activities:', activities.length);
    res.json(activities);

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
app.get('/api/activities', withConnection, async (req, res) => {
  try {
    const [activities] = await req.db.query(`
      SELECT 
        a.*,
        u.first_name,
        u.last_name
      FROM activities a
      LEFT JOIN users u ON a.created_by = u.emp_id
      ORDER BY a.created_at DESC
    `);

    const formattedActivities = await Promise.all(activities.map(async activity => {
      let deptInfo = '';
      try {
        if (activity.created_by) {
          const userInfo = await ad.getUserInfo(activity.created_by);
          deptInfo = userInfo?.dept_full || '';
        }
      } catch (err) {
        console.error(`Error getting dept info for user ${activity.created_by}:`, err);
      }

      return {
        id: activity.id,
        system_id: activity.system_id,
        important_info: activity.important_info,
        details: activity.details || '',
        file_paths: activity.file_paths || '',
        image_paths: activity.image_paths || '',
        created_at: activity.created_at,
        updated_at: activity.updated_at,
        created_by: activity.created_by || '',
        first_name: activity.first_name || '',
        last_name: activity.last_name || '',
        dept_full: deptInfo
      };
    }));

    res.json(formattedActivities);

  } catch (error) {
    console.error('Error fetching activities:', error);
    res.status(500).json({
      status: 'error',
      message: 'ไม่สามารถดึงข้อมูลกิจกรรมได้'
    });
  } finally {
    if (req.db) req.db.release();
  }
});

// === Admin Management ===
// ใช้ใน: SuperAdmin.vue, UserManagement.vue
app.post('/api/save-admin-role', async (req, res) => {
  try {
    const { emp_id, role, first_name, last_name, dept_full } = req.body;

    // ตรวจสอบข้อมูลที่จำเป็น
    if (!emp_id || !role) {
      return res.status(400).json({
        status: 'error',
        message: 'กรุณาระบุรหัสพนักงานและระดับสิทธิ์'
      });
    }

    // หา role_id จากชื่อ role
    const connection = await pool.getConnection();
    const [roles] = await connection.query('SELECT id FROM roles WHERE name = ?', [role]);
    if (!roles.length) {
      return res.status(400).json({
        status: 'error',
        message: 'ไม่พบระดับสิทธิ์ที่ระบุ'
      });
    }
    const role_id = roles[0].id;

    // ตรวจสอบว่ามีในฐานข้อมูลแล้วหรือไม่
    const [existing] = await connection.query(
      'SELECT * FROM users WHERE emp_id = ?',
      [emp_id]
    );

    if (existing.length > 0) {
      // อัพเดตข้อมูล
      await connection.execute(
        `UPDATE users 
         SET role_id = ?, first_name = ?, last_name = ?, dept_full = ?
         WHERE emp_id = ?`,
        [role_id, first_name, last_name, dept_full, emp_id]
      );
    } else {
      // เพิ่มข้อมูลใหม่
      await connection.execute(
        `INSERT INTO users (emp_id, role_id, first_name, last_name, dept_full)
         VALUES (?, ?, ?, ?, ?)`,
        [emp_id, role_id, first_name, last_name, dept_full]
      );
    }

    res.json({
      status: 'success',
      message: 'บันทึกสิทธิ์ผู้ใช้งานสำเร็จ'
    });

  } catch (error) {
    console.error('Error saving admin role:', error);
    res.status(500).json({
      status: 'error',
      message: 'ไม่สามารถบันทึกสิทธิ์ผู้ใช้งานได้'
    });
  }
});

// ใช้ใน: SuperAdmin.vue, UserManagement.vue
app.delete('/api/remove-admin-role/:emp_id', async (req, res) => {
  try {
    const { emp_id } = req.params;

    // ลบข้อมูลจากตาราง users
    const connection = await pool.getConnection();
    await connection.execute(
      'DELETE FROM users WHERE emp_id = ?',
      [emp_id]
    );

    res.json({
      status: 'success',
      message: 'ลบสิทธิ์ผู้ใช้งานสำเร็จ'
    });

  } catch (error) {
    console.error('Error removing admin role:', error);
    res.status(500).json({
      status: 'error',
      message: 'ไม่สามารถลบสิทธิ์ผู้ใช้งานได้'
    });
  }
});

// ใช้ใน: SuperAdmin.vue, UserManagement.vue
app.get('/api/admin-users', async (req, res) => {
  try {
    const connection = await pool.getConnection();
    const [users] = await connection.query(`
      SELECT 
        u.*,
        r.name as role_name
      FROM users u
      LEFT JOIN roles r ON u.role_id = r.id
      WHERE r.name IN ('admin', 'superadmin')
    `);

    res.json(users);
  } catch (error) {
    console.error('Error fetching admin users:', error);
    res.status(500).json({
      status: 'error',
      message: 'ไม่สามารถดึงข้อมูลผู้ใช้งานได้'
    });
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
