var PayoutValue = require('customer/payout-value');
var ValidationResult = require('app/validation/result');

var TABLE_NAME = 'payout_options';
var PAYOUT_OPTION = 'pin';

/**
 * @param {{dbDriver: object}} context
 * @constructor
 */
function Pin(context) {
    this.context = context;
}

/**
 * @param function(?object, boolean=) callback
 */
Pin.prototype.isEnabled = function(callback) {
    var params = {
        TableName: TABLE_NAME,
        Key: {
            "payout_option": PAYOUT_OPTION
        }
    };

    this.context.dbDriver.get(params, function(err, dbData) {
        if (err) {
            return callback(err);
        }

        if (typeof dbData.Item === 'undefined') {
            return callback(new Error('Failed to retrieve payout option "' + PAYOUT_OPTION + '"'));
        }

        var isEnabled = dbData.Item.is_enabled;

        if (!isEnabled) {
            return callback(new Error('Payout option "' + PAYOUT_OPTION + '" is not enabled.'));
        }

        return callback(null, true);
    });
};

/**
 * @param {{accountHolderName: string, bsb: string, accountNumber: string}} data
 * @return {ValidationResult}
 */
Pin.prototype.isValidData = function(data) {
    var bankRequiredFields = ['accountHolderName', 'bsb', 'accountNumber'];
    var validationResult = new ValidationResult();

    for (var i = 0; i < bankRequiredFields.length; i++) {
        var requiredField = bankRequiredFields[i];
        if (typeof data[requiredField] === 'undefined' || !data[requiredField]) {
            validationResult.addError(new Error("Missing required field '" + requiredField + "'"));
        }
    }
    return validationResult;
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
