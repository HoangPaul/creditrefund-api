var mysql = require('mysql');

var pool = mysql.createPool({
	connectionLimit : 10,
	database		: 'credit2cash',
	host 			: 'localhost',
	user 			: 'root',
	password		: 'asd123'
});

module.exports = pool;
