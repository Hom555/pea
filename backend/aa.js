const express = require('express');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const axios = require('axios');
const mysql = require('mysql2/promise');
const net = require('net');

const app = express();
const SECRET_KEY = "I76iLBG2vrXQc6Y2gqQpT3r9oHDzQHuOaG89S+C2NE0="; // คีย์ลับสำหรับเซ็น Token

app.use(cors());
app.use(express.json()); // สำหรับรับข้อมูล JSON

app.get('/api/data', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.json({
      data: {
        dataDetail: [
          {
            "emp_id": 4981464,
            "title_s_desc": "นาย",
            "first_name": "วิลัย",
            "last_name": "บุญญะ",
            "eng_name_full": "MR.PORAWAT  JUNRAYAPES",
            "sex": "M",
            "posi_code": 94,
            "posi_text_short": ";ชผ.",
            "posi_text": ";ผู้ช่วยหัวหน้าแผนก",
            "level_code": "M1",
            "level_desc": "ชผ.",
            "plans_code": 3059264,
            "plans_text_short": "ชผ.",
            "plans_text_full": "ผู้ช่วยหัวหน้าแผนก",
            "posi_status_desc": "พนักงานปกติ",
            "dept_stable_code": null,
            "dept_change_code": "530105002000301",
            "dept_short": "ผรบ.",
            "dept_full": "แผนกพัฒนาระบบงานด้านการเงิน",
            "dept_sap": 7316,
            "dept_sap_short": "ผรบ./กพก./ฝพท./ผชก.(ทส)/รผก.(ทส)/ผวก.",
            "dept_sap_full": "แผนกพัฒนาระบบงานด้านทรัพยากรบุคคล/กองพัฒนาระบบสารสนเทศด้านการจัดการองค์กร/ฝ่ายวางแผนพัฒนาระบบสารสนเทศและสื่อสาร",
            "dept_upper": 7307,
            "region": 9900,
            "region_name": "สำนักงานใหญ่",
            "sub_region": 9900,
            "sub_region_name": "สนญ.(ปกติ)",
            "cost_center": "ZD01011030",
            "cost_center_name": "ผรบ.กพก.-บริหาร",
            "pea_code": "Z00000",
            "business_area": "Z000",
            "business_area_name": "การไฟฟ้าส่วนภูมิภาค สนญ.",
            "payroll_area": 0,
            "payroll_area_name": "พนง.-สนญ.",
            "vendor_code": "EM00498143",
            "resource_code": 500,
            "resource_name": "แผนก",
            "stell_code": 2000556,
            "stell_text_short": "ชผ.",
            "stell_text_full": "ผู้ช่วยหัวหน้าแผนก",
            "qualification": 350,
            "qualification_desc": "วิทยาศาสตร์มหาบัณฑิต(วท.ม.)",
            "qualification_level": 20,
            "qualification_level_desc": "ปริญญาโท",
            "qualification_dept": 1308,
            "qualification_dept_desc": "เทคโนโลยีสารสนเทศ",
            "entry_date": "2007-10-01",
            "staff_date": "2008-01-01",
            "posi_date": "2015-07-04",
            "retired": "9999-12-31",
            "retired2_date": "2045-08-03",
            "email": "porrawat.jun@pea.co.th",
            "tel_mobile": "0990907899",
            "location_building": "51",
            "location_floor": "3",
            "tel_org_ext": "9646",
            "age": 34,
            "sap_update_date": "2020-10-28",
            "updated_date": null
          },
        ]
      }
    });
});

// ฟังก์ชันสำหรับหาพอร์ตที่ว่าง
const findAvailablePort = (startPort) => {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.listen(startPort, () => {
      const port = server.address().port;
      server.close(() => resolve(port));
    });
    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        // ถ้าพอร์ตถูกใช้งานแล้ว ให้ลองพอร์ตถัดไป
        resolve(findAvailablePort(startPort + 1));
      } else {
        reject(err);
      }
    });
  });
};

// เริ่ม server
const startServer = async () => {
    try {
      const port = await findAvailablePort(3004);
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

// เรียกใช้งานฟังก์ชัน startServer
startServer();


