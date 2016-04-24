var BigNumber = require('bignumber.js');
var PayoutValue = require('customer/payout-value');

function Pin(context) {
    this.context = context;
}

Pin.prototype.sendPayment = function(order, payoutValue, callback) {
    var developerPayload = order.getDeveloperPayload();

    var recipient = {
        'email': order.getEmail(),
        'name': developerPayload.account_holder_name,
        'bank_account': {
            'name': developerPayload.account_holder_name,
            'bsb': developerPayload.bsb,
            'number': developerPayload.account_number
        }
    };

    var that = this;
    this.context.processor.pin.createRecipient(recipient, function(err, data) {
        if (err) {
            return callback(err);
        }

        var transferObject = {
            'description': that.context.payoutMessages.REFERENCE_NUMBER_TEMPLATE(orderData.order_id),
            'amount': payoutValue.getValue(PayoutValue.CENTS),
            'currency': 'AUD',
            'recipient': data.token
        };

        pin.createTransfer(transferObject, callback);
    });

}

module.exports = Pin;
