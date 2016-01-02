var pool = require('./mysql');
var errors = require('./errors');

module.exports = {
	getProduct : function(productId, callback) {
		pool.query('SELECT * FROM `products` WHERE product_id = ?', productId, function(err, row) {
			if (err) {
				return callback(err);
			}

			if (row.length !== 1) {
				return callback(
					errors.hiddenError('Retrieving product ID does not result in exactly 1 result', {
						productId : productId,
						numResults : row.length
					})
				);
			}

			return callback(null, row[0]);
		});
	}
};
