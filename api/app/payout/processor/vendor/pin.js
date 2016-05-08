var QuoteValue = require('app/payout/quote/value');

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
 * @param {function(?object, boolean=)} callback
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
 * @param {function(?Object, object=)} callback
 */
Pin.prototype.sendPayment = function(order, callback) {
    var developerPayload = order.getDeveloperPayload();
    var quote = order.getQuote();

    var recipient = {
        'email': order.getEmail(),
        'name': developerPayload.account_holder_name,
        'bank_account': {
            'name': developerPayload.account_holder_name,
            'bsb': developerPayload.bsb,
            'number': developerPayload.account_number
        }
    };

    var self = this;
    this.context.processor.pin.createRecipient(recipient, function(err, data) {
        if (err) {
            return callback(err);
        }

        var payoutValue = quote.getQuoteValueByTitle(QuoteValue.PAYOUT_TITLE);

        var transferObject = {
            'description': self.context.payoutMessages.REFERENCE_NUMBER_TEMPLATE(order.getOrderId()),
            'amount': payoutValue.getValue(QuoteValue.CENTS),
            'currency': 'AUD',
            'recipient': data.token
        };

        pin.createTransfer(transferObject, callback);
    });

}

module.exports = Pin;
