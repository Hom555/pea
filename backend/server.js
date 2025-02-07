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
    fileSize: 50 * 1024 * 1024 // 50MB max-file-size
  },
  useTempFiles: false,
  parseNested: true, // เพิ่มตัวเลือกนี้
  debug: true
}));

// เพิ่ม body size limit
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

app.use('/uploads', express.static('uploads'));

app.use('/uploads', (req, res, next) => {
  const filePath = path.join(__dirname, req.url);
  console.log('Accessing file:', filePath);
  if (fs.existsSync(filePath)) {
    next();
  } else {
    res.status(404).send('File not found');
  }
});

function generateUniqueFilename(originalname) {
  const timestamp = Date.now();
  const extension = originalname.split('.').pop();
  return `${timestamp}-${Math.random().toString(36).substring(7)}.${extension}`;
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
  password: '12345678', 
  database: 'PEA',        
  waitForConnections: true,
  connectionLimit: 10,     // ลดจำนวน connection ลง    
  queueLimit: 0
});

// เพิ่ม error handler สำหรับ pool
pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
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

app.post('/api/system-record', async (req, res) => {
  let conn;
  try {
    conn = await pool.getConnection();
    const { nameTH, nameEN, dept_change_code, dept_full } = req.body;

    if (!nameTH || !nameEN) {
      return res.status(400).json({
        status: 'error',
        message: 'กรุณากรอกชื่อภาษาไทยและภาษาอังกฤษ'
      });
    }

    const [result] = await conn.query(`
      INSERT INTO system_master 
      (name_th, name_en, is_active, dept_change_code, dept_full) 
      VALUES (?, ?, 1, ?, ?)
    `, [nameTH, nameEN, dept_change_code, dept_full]);

    res.json({
      status: 'success',
      message: 'บันทึกข้อมูลสำเร็จ',
      id: result.insertId
    });

  } catch (error) {
    console.error('Error saving system:', error);
    res.status(500).json({
      status: 'error',
      message: 'ไม่สามารถบันทึกข้อมูลได้',
      error: error.message
    });
  } finally {
    if (conn) conn.release();
  }
});

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

// API endpoint สำหรับดึงข้อมูลระบบทั้งหมด
app.get('/api/system-records', async (req, res) => {
  let conn;
  try {
    conn = await pool.getConnection();
    console.log('Connected to database');

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

    console.log('Fetched systems:', systems.length);
    res.json(systems);

  } catch (error) {
    console.error('Error fetching systems:', error);
    res.status(500).json({ 
      status: 'error',
      message: 'ไม่สามารถดึงข้อมูลได้',
      error: error.message 
    });
  } finally {
    if (conn) conn.release();
  }
});

app.post('/api/system-details', upload.array('files', 10), async (req, res) => {
  try {
    console.log('Received data:', req.body);
    
    const { systemId, importantInfo, referenceNo, additionalInfo } = req.body;

    // ตรวจสอบข้อมูลที่จำเป็น
    if (!systemId) {
      return res.status(400).json({
        success: false,
        message: 'กรุณาเลือกระบบงาน'
      });
    }

    if (!importantInfo?.trim()) {
      return res.status(400).json({
        success: false,
        message: 'กรุณากรอกข้อมูลสำคัญ'
      });
    }

    if (!referenceNo?.trim()) {
      return res.status(400).json({
        success: false,
        message: 'กรุณากรอกเลขที่หนังสืออ้างอิง'
      });
    }

    // สร้าง file path string จากไฟล์ที่อัพโหลด
    const filePath = req.files && req.files.length > 0 
      ? req.files.map(file => `/uploads/${file.filename}`).join(',')
      : null;

    // บันทึกข้อมูล
    const connection = await pool.getConnection();
    const [result] = await connection.execute(
      `INSERT INTO system_details 
       (system_id, important_info, reference_no, additional_info, file_path, created_at) 
       VALUES (?, ?, ?, ?, ?, NOW())`,
      [
        parseInt(systemId), // แปลงเป็น int
        importantInfo.trim(),
        referenceNo.trim(),
        additionalInfo?.trim() || null,
        filePath
      ]
    );

    res.json({
      success: true,
      message: 'บันทึกข้อมูลสำเร็จ',
      data: {
        id: result.insertId,
        systemId: parseInt(systemId),
        importantInfo: importantInfo.trim(),
        referenceNo: referenceNo.trim(),
        additionalInfo: additionalInfo?.trim() || null,
        filePath
      }
    });

  } catch (error) {
    console.error('Error saving system details:', error);
    
    // ลบไฟล์ที่อัพโหลดถ้าเกิด error
    if (req.files) {
      req.files.forEach(file => {
        fs.unlink(file.path, err => {
          if (err) console.error('Error deleting file:', err);
        });
      });
    }

    res.status(500).json({
      success: false,
      message: 'ไม่สามารถบันทึกข้อมูลได้',
      error: error.message
    });
  }
});

app.get('/api/system-details/:systemId', async (req, res) => {
  const { systemId } = req.params;

  const query = `
    SELECT * FROM system_details 
    WHERE system_id = ?
    ORDER BY created_at DESC
  `;

  try {
    const connection = await pool.getConnection();
    const [rows] = await connection.query(query, [systemId]);
    console.log('Fetched system details:', rows);
    res.status(200).json(rows);
  } catch (error) {
    console.error('Error fetching system details:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.put('/api/system-details/:id', upload.array('files', 10), async (req, res) => {
  const { id } = req.params;
  const { importantInfo, referenceNo, additionalInfo } = req.body;
  const files = req.files || [];

  if (!importantInfo || !referenceNo) {
    return res.status(400).json({ message: 'กรุณากรอกข้อมูลที่จำเป็น' });
  }

  try {
    // อัปเดตข้อมูลในฐานข้อมูล
    const connection = await pool.getConnection();
    const updateQuery = `
      UPDATE system_details
      SET important_info = ?, reference_no = ?, additional_info = ?
      WHERE id = ?
    `;
    await connection.execute(updateQuery, [importantInfo, referenceNo, additionalInfo, id]);

    // หากมีไฟล์ใหม่ให้เพิ่มในฐานข้อมูล
    if (files.length > 0) {
      const filePaths = files.map((file) => `/uploads/${file.filename}`).join(',');
      const updateFileQuery = `
        UPDATE system_details
        SET file_path = ?
        WHERE id = ?
      `;
      await connection.execute(updateFileQuery, [filePaths, id]);
    }

    res.status(200).json({ 
      message: 'อัปเดตข้อมูลสำเร็จ', 
      data: {
        id,
        importantInfo,
        referenceNo,
        additionalInfo,
        file_path: files.length > 0 ? files.map((file) => `/uploads/${file.filename}`).join(',') : ''
      }
    });
  } catch (error) {
    console.error('Error updating details:', error);
    if (files.length > 0) {
      files.forEach(file => {
        fs.unlink(file.path, (err) => {
          if (err) console.error('Error deleting file:', err);
        });
      });
    }
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการอัปเดตข้อมูล' });
  }
});

app.delete('/api/system-details/:id', async (req, res) => {
  const detailId = req.params.id;
  
  try {
    const connection = await pool.getConnection();
    const [result] = await connection.execute(
      'DELETE FROM system_details WHERE id = ?',
      [detailId]
    );

    if (result.affectedRows > 0) {
      console.log('Deleted successfully:', detailId);
      res.status(200).json({ message: 'ลบข้อมูลสำเร็จ' });
    } else {
      console.log('Record not found:', detailId);
      res.status(404).json({ error: 'ไม่พบข้อมูลที่ต้องการลบ' });
    }
  } catch (error) {
    console.error('Error deleting:', error);
    res.status(500).json({ error: 'ไม่สามารถลบข้อมูลได้' });
  }
});

//กิจกรรม
app.post("/api/activities", upload.fields([{ name: "files" }, { name: "images" }]), async (req, res) => {
  const { systemId, importantInfo, details } = req.body;

  try {
    // Add validation
    if (!systemId || !importantInfo || !details) {
      return res.status(400).json({ 
        success: false,
        message: "กรุณากรอกข้อมูลให้ครบถ้วน" 
      });
    }

    // Get department info from system_master
    const [system] = await pool.query(
      'SELECT dept_change_code, dept_full FROM system_master WHERE id = ?',
      [systemId]
    );

    if (system.length === 0) {
      return res.status(400).json({
        success: false,
        message: "ไม่พบข้อมูลระบบ"
      });
    }

    // Process files
    const filePaths = req.files?.["files"]
      ? req.files["files"].map((file) => `/uploads/${file.filename}`)
      : [];
    const imagePaths = req.files?.["images"]
      ? req.files["images"].map((file) => `/uploads/${file.filename}`)
      : [];

    // Insert with department info
    const query = `
      INSERT INTO activities 
      (system_id, important_info, details, file_paths, image_paths, dept_change_code, dept_full) 
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    const [result] = await pool.execute(query, [
      systemId,
      importantInfo,
      details,
      filePaths.join(","),
      imagePaths.join(","),
      system[0].dept_change_code,
      system[0].dept_full
    ]);

    res.status(200).json({ 
      success: true,
      message: "บันทึกกิจกรรมสำเร็จ",
      activityId: result.insertId
    });

  } catch (error) {
    console.error("Error saving activity:", error);
    res.status(500).json({ 
      success: false,
      message: "ไม่สามารถบันทึกกิจกรรมได้",
      error: error.message 
    });
  }
});

// API endpoint สำหรับดึงข้อมูลกิจกรรมทั้งหมด
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

app.get('/api/activities/count', async (req, res) => {
  try {
    const connection = await pool.getConnection();
    const [result] = await connection.query(`
      SELECT COUNT(*) as count 
      FROM activities
    `);
    res.json({ count: result[0].count });
  } catch (error) {
    console.error('Error counting activities:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ดึงเวลาอัพเดตล่าสุด
app.get('/api/system-activities/last-update', async (req, res) => {
  try {
    const connection = await pool.getConnection();
    const [result] = await connection.query('SELECT MAX(created_at) as lastUpdate FROM system_activities');
    res.json({ lastUpdate: result[0].lastUpdate });
  } catch (error) {
    console.error('Error fetching last update:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ค้นหาข้อมูล
app.get('/api/search', async (req, res) => {
  const { q } = req.query;
  if (!q) return res.json([]);

  try {
    const connection = await pool.getConnection();
    const [activities] = await connection.query(`
      SELECT 
        sa.id,
        sa.details,
        sa.created_at,
        sm.name_th as system_name,
        sd.important_info as important_info_name,
        'activity' as type
      FROM system_activities sa
      LEFT JOIN system_master sm ON sa.system_id = sm.id
      LEFT JOIN system_details sd ON sa.important_info = sd.important_info
      WHERE 
        sa.details LIKE ? OR
        sd.important_info_name LIKE ?
      ORDER BY sa.created_at DESC
      LIMIT 10
    `, [`%${q}%`, `%${q}%`, `%${q}%`]);

    const results = activities.map(activity => ({
      id: activity.id,
      type: 'activity',
      title: `${activity.system_name || 'ไม่ระบุระบบ'} - ${activity.important_info_name || 'ไม่ระบุข้อมูลสำคัญ'}`,
      description: activity.details || '',
      link: `/Dataactivities`,
      date: activity.created_at
    }));

    console.log('Search results:', results);
    res.json(results);
  } catch (error) {
    console.error('Error searching:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/activities/count', async (req, res) => {
  try {
    const connection = await pool.getConnection();
    const [result] = await connection.query(`
      SELECT COUNT(*) as count 
      FROM activities
    `);
    res.json({ count: result[0].count });
  } catch (error) {
    console.error('Error counting activities:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/activities/current-month', async (req, res) => {
  try {
    const connection = await pool.getConnection();
    const currentDate = new Date();
    const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    
    const [currentMonth] = await connection.query(`
      SELECT COUNT(*) as count 
      FROM activities 
      WHERE created_at >= ?
    `, [firstDayOfMonth]);

    const firstDayLastMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
    const [lastMonth] = await connection.query(`
      SELECT COUNT(*) as count 
      FROM activities 
      WHERE created_at >= ? AND created_at < ?
    `, [firstDayLastMonth, firstDayOfMonth]);

    const currentCount = currentMonth[0].count;
    const lastCount = lastMonth[0].count;
    const trend = lastCount > 0 
      ? Math.round(((currentCount - lastCount) / lastCount) * 100)
      : 0;
    
    res.json({
      count: currentCount,
      trend: trend
    });
  } catch (error) {
    console.error('Error getting monthly activities:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.put('/api/activities/:id', upload.fields([{ name: 'files' }, { name: 'images' }]), async (req, res) => {
  const { id } = req.params;
  const { details, removedFiles, removedImages } = req.body;
  const files = req.files['files'] || [];
  const images = req.files['images'] || [];

  try {
    // Fetch existing activity
    const connection = await pool.getConnection();
    const [existingActivity] = await connection.query('SELECT * FROM activities WHERE id = ?', [id]);
    if (existingActivity.length === 0) {
      return res.status(404).json({ message: 'Activity not found' });
    }

    // Remove files and images
    const existingFiles = existingActivity[0].file_paths ? existingActivity[0].file_paths.split(',') : [];
    const existingImages = existingActivity[0].image_paths ? existingActivity[0].image_paths.split(',') : [];

    const updatedFiles = existingFiles.filter(file => !removedFiles.includes(file));
    const updatedImages = existingImages.filter(image => !removedImages.includes(image));

    // Add new files and images
    const newFiles = files.map(file => `/uploads/${file.filename}`);
    const newImages = images.map(image => `/uploads/${image.filename}`);

    const allFiles = [...updatedFiles, ...newFiles];
    const allImages = [...updatedImages, ...newImages];

    // Update activity
    await connection.execute(
      'UPDATE activities SET details = ?, file_paths = ?, image_paths = ? WHERE id = ?',
      [details, allFiles.join(','), allImages.join(','), id]
    );

    res.json({ message: 'Activity updated successfully' });
  } catch (error) {
    console.error('Error updating activity:', error);
    res.status(500).json({ error: 'Failed to update activity' });
  }
});


app.delete('/api/activities/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const connection = await pool.getConnection();
    const [result] = await connection.execute('DELETE FROM activities WHERE id = ?', [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Activity not found' });
    }
    res.json({ message: 'Activity deleted successfully' });
  } catch (error) {
    console.error('Error deleting activity:', error);
    res.status(500).json({ error: 'Failed to delete activity' });
  }
});

//API MANEGERS USERS
app.post('/api/add-system-record', (req, res) => {
  const { nameTH, nameEN } = req.body;

  // ตรวจสอบข้อมูลที่ส่งมา
  if (!nameTH || !nameEN) {
    return res.status(400).json({ success: false, message: 'กรุณากรอกข้อมูลให้ครบถ้วน' });
  }

  // สร้าง ID ใหม่ (Mock)
  const newId = employeesData.data.dataDetail.length + 1;

  // เพิ่มข้อมูลใหม่ใน Mock Data
  employeesData.data.dataDetail.push({
    id: newId,
    name_th: nameTH,
    name_en: nameEN,
  });

  res.json({ success: true, message: 'เพิ่มข้อมูลสำเร็จ' });
});

app.get('/api/user-info', (req, res) => {
  res.json({
    name: 'ผู้ใช้งานระบบ',
    role: 'ผู้ใช้ทั่วไป'
  });
});

// API endpoint สำหรับเปลี่ยนสถานะการใช้งาน
app.put('/api/system-records/:id/toggle-status', async (req, res) => {
  try {
    const systemId = req.params.id;
    console.log('Toggling status for system:', systemId);
    
    // ดึงข้อมูลสถานะปัจจุบัน
    const connection = await pool.getConnection();
    const [rows] = await connection.query(
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
    await connection.execute(
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
      message: 'ไม่สามารถเปลี่ยนสถานะการใช้งานได้'
    });
  }
});

// เพิ่ม endpoint สำหรับจัดการสิทธิ์ผู้ใช้
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

// endpoint สำหรับลบสิทธิ์ admin
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

// endpoint สำหรับดึงข้อมูล admin users
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

// เพิ่ม route สำหรับดึงข้อมูลกิจกรรมตาม ID
app.get('/api/activities/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const connection = await pool.getConnection();
    const [activities] = await connection.query(`
      SELECT 
        a.*,
        u.first_name,
        u.last_name,
        sd.important_info as importance_name
      FROM activities a
      LEFT JOIN users u ON a.created_by = u.emp_id
      LEFT JOIN system_details sd ON a.important_info = sd.id
      WHERE a.id = ?
    `, [id]);

    if (activities.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'ไม่พบข้อมูลกิจกรรม'
      });
    }

    const activity = activities[0];
    let deptInfo = '';
    try {
      if (activity.created_by) {
        const userInfo = await ad.getUserInfo(activity.created_by);
        deptInfo = userInfo?.dept_full || '';
      }
    } catch (err) {
      console.error(`Error getting dept info for user ${activity.created_by}:`, err);
    }

    const formattedActivity = {
      id: activity.id,
      system_id: activity.system_id,
      important_info: activity.importance_name || activity.important_info || '',
      details: activity.details || '',
      file_paths: activity.file_paths || '',
      image_paths: activity.image_paths || '',
      created_at: activity.created_at,
      updated_at: activity.updated_at,
      created_by: activity.created_by,
      first_name: activity.first_name || '',
      last_name: activity.last_name || '',
      dept_full: deptInfo
    };

    res.json(formattedActivity);

  } catch (error) {
    console.error('Error fetching activity:', error);
    res.status(500).json({
      status: 'error',
      message: 'ไม่สามารถดึงข้อมูลกิจกรรมได้'
    });
  }
});

// สร้างโฟลเดอร์ถ้ายังไม่มี
const uploadDirs = ['./public/uploads/files', './public/uploads/images'];
uploadDirs.forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
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

// เพิ่ม endpoint สำหรับดึงข้อมูล user และ role
app.get('/api/data', async (req, res) => {
  let conn;
  try {
    conn = await pool.getConnection();
    const [users] = await conn.query(`
      SELECT 
        u.emp_id,
        u.first_name,
        u.last_name,
        u.dept_change_code,
        u.dept_full,
        u.role_id
      FROM users u
      WHERE u.emp_id = ?
      LIMIT 1
    `, [498146444]); // ใส่ emp_id ตามที่ต้องการ

    if (users.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'ไม่พบข้อมูลผู้ใช้'
      });
    }

    res.json({
      status: 'success',
      data: {
        dataDetail: users.map(user => ({
          ...user,
          role_id: Number(user.role_id),
          dept_change_code: user.dept_change_code || '530105002000301',
          dept_full: user.dept_full || 'แผนกพัฒนาระบบงานด้านการเงิน'
        }))
      }
    });

  } catch (error) {
    console.error('Error fetching user data:', error);
    res.status(500).json({
      status: 'error',
      message: 'ไม่สามารถดึงข้อมูลผู้ใช้ได้'
    });
  } finally {
    if (conn) conn.release();
  }
});

// เพิ่ม endpoint สำหรับตรวจสอบสิทธิ์
app.get('/api/check-permission', async (req, res) => {
  try {
    const connection = await pool.getConnection();
    const [user] = await connection.query(`
      SELECT 
        u.*,
        r.id as role_id,
        r.name as role_name
      FROM users u
      LEFT JOIN roles r ON u.role_id = r.id
      WHERE u.emp_id = ?
    `, [req.user?.emp_id]);

    if (user.length === 0) {
      return res.status(403).json({
        status: 'error',
        message: 'ไม่มีสิทธิ์เข้าถึง'
      });
    }

    const permissions = {
      canManageSystem: user[0].role_id === 2 || user[0].role_id === 3,
      canManageUsers: user[0].role_id === 3,
      isAdmin: user[0].role_id === 2 || user[0].role_id === 3
    };

    res.json({
      status: 'success',
      data: permissions
    });

  } catch (error) {
    console.error('Error checking permissions:', error);
    res.status(500).json({
      status: 'error',
      message: 'ไม่สามารถตรวจสอบสิทธิ์ได้'
    });
  }
});

// เพิ่ม middleware สำหรับตรวจสอบ token
const authMiddleware = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({
        status: 'error',
        message: 'ไม่พบ token'
      });
    }

    // ตรวจสอบ token และดึงข้อมูล user
    // (ต้องเพิ่มการ implement ตรวจสอบ token จริงๆ)
    const userData = await verifyToken(token);
    req.user = userData;
    next();

  } catch (error) {
    console.error('Auth error:', error);
    res.status(401).json({
      status: 'error',
      message: 'ไม่มีสิทธิ์เข้าถึง'
    });
  }
};

// ใช้ middleware กับ routes ที่ต้องการตรวจสอบสิทธิ์
// app.use('/api/data', authMiddleware);
// app.use('/api/check-permission', authMiddleware);

// แก้ไข endpoint สำหรับลบระบบ
app.delete('/api/system-record/:id', async (req, res) => {
  const id = req.params.id;

  try {
    const connection = await pool.getConnection();
    try {
      const [result] = await connection.query(
        'DELETE FROM system_master WHERE id = ?',
        [id]
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({
          status: 'error',
          message: 'ไม่พบข้อมูลที่ต้องการลบ'
        });
      }

      res.json({
        status: 'success',
        message: 'ลบข้อมูลสำเร็จ'
      });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error deleting system record:', error);
    res.status(500).json({
      status: 'error',
      message: 'ไม่สามารถลบข้อมูลได้'
    });
  }
});
