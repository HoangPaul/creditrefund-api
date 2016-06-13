var Quote = require('app/payout/quote/quote');
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
 * @type {string}
 */
Pin.PROCESSOR_TITLE = 'Bank (Pin Payments)';

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
    return this.helper.hasRequiredData(data, ['accountHolderName', 'bsb', 'accountNumber']);
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
        'name': developerPayload.accountHolderName,
        'bank_account': {
            'name': developerPayload.accountHolderName,
            'bsb': developerPayload.bsb,
            'number': developerPayload.accountNumber
        }
    };

    var self = this;
    this.context.processor.pin.createRecipient(recipient, function(err, data) {
        if (err) {
            return callback(err);
        }

        var payoutValue = quote.getQuoteValueByTitle(Quote.PAYOUT_TITLE);

        var transferObject = {
            'description': 'Credit Refund order ID: ' + order.getOrderId(), // todo: self.context.payoutMessages.REFERENCE_NUMBER_TEMPLATE(order.getOrderId()),
            'amount': payoutValue.getValue(QuoteValue.CENTS).toFixed(0),
            'currency': 'AUD',
            'recipient': data.token
        };

        self.context.processor.pin.createTransfer(transferObject, callback);
    });
};

module.exports = Pin;
