var errors = require('./errors');
var defaults = require('./defaults');
var pool = require('./mysql');
var vsprintf = require("sprintf-js").vsprintf;

var paypal = require('paypal-rest-sdk');
paypal.configure({
	'mode' : 'sandbox',
	'client_id': 'AfiWiNMdUf3iJkXGe1gEzXi7-dbBgZH_Su6psLJ3yr0uUxRYxAIMWw5_sOUVLy57iupNwOypn_R3fGuF',
  	'client_secret': 'EOesmVWLw8dPAlTWnIfCpyYOFESxQGsAUh2IO1enNb7H1Q2StayOB0mUp9a3ZcMGS2VrkbXzXk4XZTWZ'
});


var messageTemplate = 'Reference Number: "%s"';


var populatePayoutMessage = function(data) {
	return vsprintf(messageTemplate, [
		data.order_id,
	]);
}

module.exports = {
	sendPayment : function(orderData, callback) {
		var create_payout_json = {
			"sender_batch_header": {
				"sender_batch_id": orderData.order_id,
				"email_subject": defaults.APP_TITLE + " payout"
			},
			"items": [
				{
					"recipient_type": "EMAIL",
					"amount": {
						"value": orderData.payout_value,
						"currency": "AUD"
					},
					"receiver": orderData.email,
					"note": populatePayoutMessage(orderData),
					"sender_item_id": orderData.product_id
				}
			]
		};
		var sync_mode = 'true';

		paypal.payout.create(create_payout_json, sync_mode, function (error, payout) {
			if (error) {
				return callback(error);
			}
			return callback(null, payout);
		});
	}
};
