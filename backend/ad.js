const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// Mock Data
const mockEmployees = [
  {
    emp_id: 498146444,
    "dept_change_code": "530105002000301",
    dept_full: "แผนกพัฒนาระบบงานด้านการเงิน",
    first_name: "วิลัย",
    last_name: "บุญญะ"
  },
  {
    emp_id: 498146445,
    dept_full: "แผนกการเงิน",
    first_name: "ปิยะพร",
    last_name: "สุขสวัสดิ์"
  },
  {
    emp_id: 498146446,
    dept_full: "แผนกIT",
    first_name: "ธีรภัทร",
    last_name: "ทองประภา"
  }
];

// ฟังก์ชันสำหรับดึงข้อมูลพนักงาน
const getUserInfo = async (empId) => {
  if (!empId) return null;
  const employee = mockEmployees.find(
    emp => emp.emp_id.toString() === empId.toString()
  );
  return employee ? { dept_full: employee.dept_full } : null;
};

// Export functions
module.exports = {
  getUserInfo
};

// API endpoints
app.get('/api/data', (req, res) => {
  res.json({
    data: {
      dataDetail: mockEmployees
    }
  });
});

// ฟังก์ชันสำหรับหาพอร์ตที่ว่าง
const findAvailablePort = async (startPort) => {
  const net = require('net');
  
  const isPortAvailable = (port) => {
    return new Promise((resolve) => {
      const server = net.createServer();
      
      server.once('error', () => {
        resolve(false);
      });
      
      server.once('listening', () => {
        server.close();
        resolve(true);
      });
      
      server.listen(port);
    });
  };

  let port = startPort;
  while (!(await isPortAvailable(port))) {
    port++;
  }
  return port;
};

// เริ่ม server
const startServer = async () => {
  try {
    const port = await findAvailablePort(3007);
    app.listen(port, () => {
      console.log(`AD Service running on port ${port}`);
      // บันทึกพอร์ตที่ใช้งานได้
      process.env.AD_PORT = port;
    });
  } catch (err) {
    console.error('Error starting server:', err);
    process.exit(1);
  }
};

startServer();
