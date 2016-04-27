var PayoutValue = require('customer/payout-value');
var ValidationResult = require('app/validation/result');

var TABLE_NAME = 'payout_options';
var PAYOUT_OPTION = 'pin';

/**
 * @param {{dbDriver: object}} context
 * @param {object} helper
 * @constructor
 */
function Pin(context, helper) {
    this.context = context;
    this.helper = helper;
}

/**
 * @param function(?object, boolean=) callback
 */
Pin.prototype.isEnabled = function(callback) {
    return this.helper.isEnabled(PAYOUT_OPTION, callback);
};

/**
 * @param {{accountHolderName: string, bsb: string, accountNumber: string}} data
 * @return {ValidationResult}
 */
Pin.prototype.isValidData = function(data) {
    return this.helper.isValidData(PAYOUT_OPTION, data, ['accountHolderName', 'bsb', 'accountNumber']);
};

/**
 * @param {Order} order
 * @param {PayoutValue} payoutValue
 * @param {function(?Error, object=) callback
 */
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
            'description': that.context.payoutMessages.REFERENCE_NUMBER_TEMPLATE(order.getOrderId()),
            'amount': payoutValue.getValue(PayoutValue.CENTS),
            'currency': 'AUD',
            'recipient': data.token
        };

        pin.createTransfer(transferObject, callback);
    });

}

module.exports = Pin;
