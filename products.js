var dynamodb = require('./aws-db');

var TABLE_NAME = 'products';

module.exports = {
    getProduct: function(productId, callback) {
        var params = {
            TableName: TABLE_NAME,
            Key: {
                "product_id": productId
            }
        };

        dynamodb.get(params, function(err, dbData) {
            if (err) {
                return callback(err);
            }

            if (typeof dbData.Item === 'undefined') {
                return callback(new Error('Failed to retrieve product, got a non-single result.'));
            }

            return callback(null, dbData.Item);
        });
    }
};
