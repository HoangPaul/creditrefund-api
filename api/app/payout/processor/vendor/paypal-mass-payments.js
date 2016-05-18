var QuoteValue = require('app/payout/quote/value');
var Quote = require('app/payout/quote/quote');
var us = require('underscore');

var PAYOUT_OPTION = 'paypalMassPayments';

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
    return this.helper.hasRequiredData(data, ['email']);
};

/**
 * @param {Order} order
 * @param {function(?Object, object=)} callback
 */
Paypal.prototype.sendPayment = function(order, callback) {
    var quote = order.getQuote();
    var payoutValue = quote.getQuoteValueByTitle(Quote.PAYOUT_TITLE);

    var data = {
        "RECEIVERTYPE": "EmailAddress",
        'CURRENCYCODE': 'AUD'
    };

    var recipients = {
        'L_EMAIL0': order.getEmail(),
        'L_AMT0': payoutValue.getValue(QuoteValue.DOLLARS).toFixed(2),
        'L_UNIQUEID0': order.getOrderId(),
        'L_NOTE0': 'test paypal note'
    };

    data = us.extend(data, recipients);

    this.context.processor.paypalMassPayments.send(data, callback);
};

module.exports = Paypal;
