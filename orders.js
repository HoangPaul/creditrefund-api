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
	flagOrderSuccess : function(orderData, callback) {
		var params = {
			TableName: TABLE_NAME,
			Key: {
				"order_id": orderData.order_id
			},
		    UpdateExpression: "SET is_processed = true, has_error = false"
		};

		dynamodb.update(params, callback);
	},
	flagOrderFail : function(orderData, callback) {
		var params = {
			TableName: TABLE_NAME,
			Key: {
				"order_id": orderData.order_id
			},
		    UpdateExpression: "SET is_processed = true, has_error = true"
		};

		dynamodb.update(params, callback);
	}
};
