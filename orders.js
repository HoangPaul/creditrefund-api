var dynamodb = require('./aws-db');

var TABLE_NAME = 'orders';

module.exports = {
	saveOrder : function(orderData, callback) {
		var params = {
			TableName: TABLE_NAME,
			Item: orderData
		};

		dynamodb.put(params, callback);
	},
	getOrder : function(orderId, callback) {
		var params = {
			TableName: TABLE_NAME,
			Key: {
				"order_id": orderId
			}
		};

		dynamodb.get(params, function(err, orderData) {
			if (err) {
				return callback(err);
			}

			return callback(err, orderData.Item);
		});
	},
	flagOrderSuccess : function(orderData, callback) {
		var params = {
			TableName: TABLE_NAME,
			Key: {
				"order_id": orderData.order_id
			},
		    UpdateExpression: "SET is_processed = :val1, has_error = :val2",
		    ExpressionAttributeValues: {
		        ":val1": true,
		        ":val2": false
		    }
		};

		dynamodb.update(params, callback);
	},
	flagOrderFail : function(orderData, callback) {
		var params = {
			TableName: TABLE_NAME,
			Key: {
				"order_id": orderData.order_id
			},
		    UpdateExpression: "SET is_processed = :val1, has_error = :val2",
			ExpressionAttributeValues: {
		        ":val1": true,
		        ":val2": false
		    }
		};

		dynamodb.update(params, callback);
	}
};
