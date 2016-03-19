var payoutMessages = require('./messages').payout;

var Pin = require('pinjs');
var pin = Pin.setup({
    key : 'AFhAptuFLfbKtU8V20qgWw',
    production: false
});

module.exports = {
    sendPayment : function(orderData, callback) {
        var recipient = {
            'email': orderData.email,
            'name': orderData.name,
            'bank_account': {
                'name': orderData.name,
                'bsb': orderData.bsb,
                'number': orderData.bankNumber
            }
        };

        pin.createTransfer({
            'description': payoutMessages.REFERENCE_NUMBER_TEMPLATE(orderData.order_id),
            'amount': orderData.payout_value,
            'currency': 'AUD'
            'recipient': recipient
        }, callback);
    }
}
