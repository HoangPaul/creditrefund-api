var pool = require('./mysql');

module.exports = {
    getProduct: function(productId, callback) {
        pool.query('SELECT * FROM `products` WHERE product_id = ?', productId, function(err, row) {
            if (err) {
                return callback(err);
            }

            if (row.length !== 1) {
                return callback(
                    new Error('Retrieving product ID does not result in exactly 1 result')
                );
            }

            return callback(null, row[0]);
        });
    }
};
