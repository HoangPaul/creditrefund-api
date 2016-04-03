var dynamodb = require('./aws-db');

var TABLE_NAME = 'products';

module.exports = {
    getProduct: function(productId, callback) {
        var params = {
            TableName: TABLE_NAME,
            KeyConditionExpression: "#id = :product_id",
            ExpressionAttributeNames:{
                "#id": "product_id"
            },
            ExpressionAttributeValues: {
                ":product_id": productId
            }

            dynamodb.query(params, function(err, data) {
                if (err) {
                    return callback(err);
                }

                if (data.Count != 1) {
                    return callback(new Error('Failed to retrieve product, got a non-single result.'));
                }

                return callback(null, data.Items[0]);
            });
        }
    }
};
