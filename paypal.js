var payoutMessages = require('./messages').payout;

var paypal = require('paypal-rest-sdk');
paypal.configure({
	'mode' : 'sandbox',
	'client_id': 'AfiWiNMdUf3iJkXGe1gEzXi7-dbBgZH_Su6psLJ3yr0uUxRYxAIMWw5_sOUVLy57iupNwOypn_R3fGuF',
  	'client_secret': 'EOesmVWLw8dPAlTWnIfCpyYOFESxQGsAUh2IO1enNb7H1Q2StayOB0mUp9a3ZcMGS2VrkbXzXk4XZTWZ'
});

module.exports = {
	sendPayment : function(orderData, callback) {
		var syncMode = 'true';
		var payoutObject = {
			'sender_batch_header': {
				'sender_batch_id': orderData.order_id,
				'email_subject': defaults.APP_TITLE + ' payout'
			},
			'items': [
				{
					'recipient_type': 'EMAIL',
					'amount': {
						'value': orderData.payout_value,
						'currency': 'AUD'
					},
					'receiver': orderData.email,
					'note': payoutMessages.REFERENCE_NUMBER_TEMPLATE(orderData.order_id),
					'sender_item_id': orderData.product_id
				}
			]
		};

		paypal.payout.create(payoutObject, syncMode, callback);
    }
};
