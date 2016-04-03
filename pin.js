var payoutMessages = require('./messages').payout;
var BigNumber = require('bignumber.js');

var Pin = require('pinjs');
var pin = Pin.setup({
    key : 'AFhAptuFLfbKtU8V20qgWw',
    production: false
});

module.exports = {
    sendPayment : function(orderData, payout, callback) {
        var developerPayload = JSON.parse(orderData.developer_payload);

        var recipient = {
            'email': orderData.email,
            'name': developerPayload.account_holder_name,
            'bank_account': {
                'name': developerPayload.account_holder_name,
                'bsb': developerPayload.bsb,
                'number': developerPayload.account_number
            }
        };

        console.log('recipient is ' + JSON.stringify(recipient));

        pin.createRecipient(recipient, function(err, data) {
            if (err) {
                return callback(err);
            }

            console.log('recipient return data is ' + JSON.stringify(data));

            var recipientToken = data.token;

            var transferObject = {
                'description': payoutMessages.REFERENCE_NUMBER_TEMPLATE(orderData.order_id),
                'amount': payout.getPayoutValue(payout.CENTS),
                'currency': 'AUD',
                'recipient': recipientToken
            };

            console.log('transfer object is ' + JSON.stringify(transferObject));
            pin.createTransfer(transferObject, callback);
        });
    }
}
