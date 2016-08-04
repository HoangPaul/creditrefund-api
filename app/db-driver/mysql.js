var mysql = require('mysql');

var pool = mysql.createPool({
    connectionLimit: 10,
    database: 'creditrefund',
    host: 'mysql',
    user: 'root',
    password: 'asd123'
});

module.exports = pool;
