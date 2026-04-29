// test-connection.js
const mysql = require('mysql2/promise');

async function testConnection() {
  try {
    const connection = await mysql.createConnection({
      host: '188.121.97.243',
      port: 3306,
      user: 'outUser',  // کاربری که ساختید
      password: '#Test1234',
      connectTimeout: 60000
    });
    
    console.log('✅ اتصال موفق بود!');
    const [rows] = await connection.execute('SELECT 1 as test');
    console.log('✅ Query result:', rows);
    await connection.end();
  } catch (error) {
    console.error('❌ خطا در اتصال:', error.message);
    console.error('جزئیات:', error);
  }
}

testConnection();