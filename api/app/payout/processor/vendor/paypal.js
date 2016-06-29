var QuoteValue = require('app/payout/quote/value');
var Quote = require('app/payout/quote/quote');
var us = require('underscore');

var PAYOUT_OPTION = 'paypal';
var REQUIRED_PARAMS = ['email'];

/**
 * @param {{dbDriver: object, processor: object}} context
 * @param {{
 *      isEnabled: function(string, function(?Object, boolean=)),
 *      hasRequiredData: function(Object, string[])
 *  }} helper
 * @constructor
 */
function Paypal(context, helper) {
    this.context = context;
    this.helper = helper;
}

/**
 * @type {string}
 */
Paypal.PROCESSOR_TITLE = 'Paypal';

/**
 * @param {function(?object, boolean=)} callback
 */
Paypal.prototype.isEnabled = function(callback) {
    return this.helper.isEnabled(PAYOUT_OPTION, callback);
};

/**
 * @param {{email: string}} data
 * @return {ValidationResult}
 */
Paypal.prototype.isValidData = function(data) {
    return this.helper.hasRequiredData(data, REQUIRED_PARAMS);
};

/**
 * @param {Order} order
 * @param {function(?Object, object=)} callback
 */
Paypal.prototype.sendPayment = function(order, callback) {
    var syncMode = 'true';
    var quote = order.getQuote();
    var payoutValue = quote.getQuoteValueByTitle(Quote.PAYOUT_TITLE);

    var payoutObject = {
        'sender_batch_header': {
            'sender_batch_id': order.getOrderId(),
            'email_subject': 'test paypal subject' // todo: self.context.payoutMessages.REFERENCE_NUMBER_TEMPLATE(order.getOrderId()),
        },
        'items': [{
            'recipient_type': 'EMAIL',
            'amount': {
                'value': payoutValue.getValue(QuoteValue.DOLLARS).toFixed(2),
                'currency': 'AUD'
            },
            'receiver': order.getEmail(),
            'note': 'test paypal note',// todo: self.context.payoutMessages.REFERENCE_NUMBER_TEMPLATE(order.getOrderId()),
            'sender_item_id': order.getSignedData.productId
        }]
    };

    this.context.processor.paypal.payout.create(payoutObject, syncMode, callback);
};

/**
 * @param {Object} data
 */
Paypal.prototype.getDataHash = function(data) {
    var requiredData = us.pick(data, REQUIRED_PARAMS);
    return JSON.stringify(requiredData);
};

module.exports = Paypal;
