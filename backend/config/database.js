const mysql = require('mysql2');

// สร้าง connection pool
const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '12345678aa',
  database: 'PEA',
  port: 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Export promise pool
module.exports = pool.promise(); 