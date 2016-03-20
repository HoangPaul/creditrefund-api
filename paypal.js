var payoutMessages = require('./messages').payout;
var defaults = require('./defaults');

var paypal = require('paypal-rest-sdk');
paypal.configure({
    'mode': 'sandbox',
    'client_id': 'Aah_eRod7Nx6G_QAZjMSZ8TNkEYzT_2XGHuPIZLNv2K29819ODBNxrGTotSDnWL2nNeagFl5WvFujk0T',
    'client_secret': 'EBTLUkFUqKtAIR1U9VcB5GIIymNgbW1ToKfEL8aDREJtcyn_FRT6xyUNeD4Jyf9jlfLgUncg0Fg1A35u'
});

module.exports = {
    sendPayment: function(orderData, callback) {
        var syncMode = 'true';
        var payoutObject = {
            'sender_batch_header': {
                'sender_batch_id': orderData.order_id,
                'email_subject': defaults.APP_TITLE + ' payout'
            },
            'items': [{
                'recipient_type': 'EMAIL',
                'amount': {
                    'value': orderData.payout_value,
                    'currency': 'AUD'
                },
                'receiver': orderData.email,
                'note': payoutMessages.REFERENCE_NUMBER_TEMPLATE(orderData.order_id),
                'sender_item_id': orderData.product_id
            }]
        };

        paypal.payout.create(payoutObject, syncMode, callback);
    }
};
