var pool = require('./mysql');

var ORDER_SUCCESS = 0;
var ORDER_FAIL = 1;

var updateQuery = 'UPDATE `orders` SET `is_processed` = 1, `has_error` = ? WHERE `order_id` = ?';

module.exports = {
	saveOrder : function(data, callback) {
		pool.query('INSERT INTO orders SET ?', data, function(err, rows) {

			if (typeof callback === 'undefined') {
				return;
			}
			if (err) {
				return callback(err);
			}
			return callback(null, rows);
		});
	},
	flagOrderSuccess : function(orderData, callback) {
		pool.query(updateQuery, [ORDER_SUCCESS, orderData.order_id], function(err, rows) {
			if (typeof callback === 'undefined') {
				return;
			}
			if (err) {
				return callback(err);
			}
			return callback(null, rows);
		});
	},
	flagOrderFail : function(orderData, callback) {
		pool.query(updateQuery, [ORDER_FAIL, orderData.order_id],  function(err, rows) {
			if (typeof callback === 'undefined') {
				return;
			}
			if (err) {
				return callback(err);
			}
			return callback(null, rows);
		});
	}
};
