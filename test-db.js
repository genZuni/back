const mysql = require('mysql2');

const connection = mysql.createConnection({
    host: '37.32.5.159',
    port: 3306,
    user: 'admin',
    password: 'admin123',
    database: 'genZuni',
    ssl: false,
    connectTimeout: 60000
});

connection.connect((err) => {
    if (err) {
        console.error('❌ خطا:', err.message);
    } else {
        console.log('✅ اتصال موفق!');
        connection.query('SELECT 1', (err, results) => {
            if (err) console.error('Query error:', err);
            else console.log('Query result:', results);
            connection.end();
        });
    }
});