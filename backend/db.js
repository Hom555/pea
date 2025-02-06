const mysql = require('mysql');

const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '12345678',
  database: 'pea', // ใส่ชื่อฐานข้อมูลของคุณ
});

db.connect((err) => {
  if (err) {
    console.error('เกิดข้อผิดพลาดในการเชื่อมต่อฐานข้อมูล:', err);
    process.exit(1);
  }
  console.log('เชื่อมต่อฐานข้อมูลสำเร็จ');
});

module.exports = db;
