// test-db-ipv4.js
const mysql = require('mysql2');
const dns = require('dns');

// اطمینان از استفاده از IPv4
dns.setDefaultResultOrder('ipv4first');

const connection = mysql.createConnection({
  host: '192.168.1.3',
  port: 3306,
  user: 'test',
  password: 'StTeBr80corzEYaOvsB03r5I',
  database: 'test',
  connectTimeout: 10000,
  localAddress: '192.168.1.4' ,
  // اجباری به IPv4
  family: 4
});

connection.connect((err) => {
  if (err) {
    console.error('❌ Error:', err.code);
    console.error('Message:', err.message);
    return;
  }
  console.log('✅ Connected!');
  connection.end();
});