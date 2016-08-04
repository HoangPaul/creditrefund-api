var Handlebars = require('handlebars');
var fs = require('fs');
var Quote = require('app/payout/quote/quote');
var QuoteValue = require('app/payout/quote/value');
var PayoutProcesorFactory = require('app/payout/processor/factory');
var us = require('underscore');
var moment = require('moment-timezone');

function loadEmailTemplate(templatePath) {
    return fs.readFileSync('app/order/view/email/' + templatePath, {'encoding': 'utf8'});
}

module.exports = {
    'getSubject': function(order) {
        var template = Handlebars.compile(loadEmailTemplate('new/title.handlebars'));
        return template({'orderId': order.getOrderId()});
    },
    /**
     * @param {Order} order
     * @return string
     */
    'processTextNewOrderEmail': function(order) {
        var template = Handlebars.compile(loadEmailTemplate('new/text.handlebars'));
        var fees = [];
        us.each(order.getQuote().getFees(), function(fee, title) {
            fees.push({
                'title': title,
                'value': fee.getValue(QuoteValue.DOLLARS).toFixed(2)
            });
        });

        var data = {
            'email': order.getEmail(),
            'orderId': order.getOrderId(),
            'dateString': moment(order.getTimestamp()).tz('Australia/Melbourne').format('YYYY-MM-DD hh:mm a z'),
            'payoutMethod': PayoutProcesorFactory.getPaymentProcessorClass(order.getDeveloperPayload()['payoutOption']).PROCESSOR_TITLE,
            'total': order.getQuote().getQuoteValueByTitle(Quote.TOTAL_TITLE).getValue(QuoteValue.DOLLARS).toFixed(2),
            'fees' : fees,
            'payout': order.getQuote().getQuoteValueByTitle(Quote.PAYOUT_TITLE).getValue(QuoteValue.DOLLARS).toFixed(2)
        };

        return template(data);
    }
};