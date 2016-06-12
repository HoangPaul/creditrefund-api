var Quote = require('app/payout/quote/quote');
var QuoteValue = require('app/payout/quote/value');
var QuoteError = require('app/payout/quote/error');
var BigNumber = require('bignumber.js');
var us = require('underscore');
var assert = require('assert');
var deepcopy = require('deepcopy');

/**
 * @param {QuoteValue|Object} qTotalAmount
 * @constructor
 */
function QuoteBuilder(qTotalAmount) {
    this.qTotalAmount = qTotalAmount;
    this.quoteFeeVariables = {};
}

/**
 * @param {Object} quoteData
 * @throws {Error}
 * @returns {Quote}
 */
QuoteBuilder.createQuoteFromQuoteData = function(quoteData) {
    var total = new BigNumber(quoteData[Quote.TOTAL_TITLE]['value']);
    var payout = new BigNumber(quoteData[Quote.PAYOUT_TITLE]['value']);

    var quoteFees = deepcopy(quoteData);
    delete quoteFees[Quote.TOTAL_TITLE];
    delete quoteFees[Quote.PAYOUT_TITLE];

    var formattedQuoteFees = {};
    us.each(quoteFees, function(fee, title) {
        formattedQuoteFees[title] = new QuoteValue(new BigNumber(fee['value']), QuoteValue.CENTS);
    });

    var quote = buildQuoteFromAbsolute(formattedQuoteFees, new QuoteValue(total, QuoteValue.CENTS));

    assert(quote.getQuoteValueByTitle(Quote.TOTAL_TITLE).getValue(QuoteValue.CENTS).equals(total));
    assert(quote.getQuoteValueByTitle(Quote.PAYOUT_TITLE).getValue(QuoteValue.CENTS).equals(payout));

    return quote;
};

/**
 * @param {string} title
 * @param {BigNumber} percentOutOfHundred
 * @param {QuoteValue} qFlatAmount
 * @returns {QuoteBuilder}
 */
QuoteBuilder.prototype.addFee = function(title, percentOutOfHundred, qFlatAmount) {
    assert(title !== Quote.TOTAL_TITLE);
    assert(title !== Quote.PAYOUT_TITLE);
    assert(typeof this.quoteFeeVariables[title] === 'undefined');
    assert(percentOutOfHundred instanceof BigNumber);

    this.quoteFeeVariables[title] = {
        'percent': percentOutOfHundred,
        'qFlat': qFlatAmount
    };

    return this;
};

/**
 * // todo: actually pass in a collection here and not just an object array
 * @param {Object[]} feeCollection
 */
QuoteBuilder.prototype.addFees = function(feeCollection) {
    var self = this;
    us.each(feeCollection, function(feeData) {
        var feeTitle = feeData['title'];
        var percent = new BigNumber(feeData['percent']);
        var flat = new QuoteValue(new BigNumber(feeData['flat']), QuoteValue.CENTS);

        self.addFee(feeTitle, percent, flat);
    });
};

/**
 * @throws {Error}
 * @return {Quote}
 */
QuoteBuilder.prototype.build = function() {
    var self = this;

    // Calculate the absolute value for each fee
    var quoteFees = {};
    us.each(this.quoteFeeVariables, function(feeVariable, feeTitle) {
        var bTotalAmount = self.qTotalAmount.getValue(QuoteValue.CENTS);
        var percentageFee = feeVariable['percent'];
        var flatFee = feeVariable['qFlat'].getValue(QuoteValue.CENTS);

        quoteFees[feeTitle] = new QuoteValue(bTotalAmount.times(percentageFee).dividedBy(100).add(flatFee), QuoteValue.CENTS);
    });

    return buildQuoteFromAbsolute(quoteFees, self.qTotalAmount);
};

/**
 * @param {Object} quoteFees
 * @param {QuoteValue} qTotalAmount
 * @throws {Error}
 * @returns {Quote}
 */
function buildQuoteFromAbsolute(quoteFees, qTotalAmount) {
    var bTotalAmount = qTotalAmount.getValue(QuoteValue.CENTS);

    // Validate that the fee is less than the total amount
    var bRunningFeeTotal = new BigNumber(0);
    us.each(quoteFees, function(quoteFee) {
        bRunningFeeTotal = bRunningFeeTotal.add(quoteFee.getValue(QuoteValue.CENTS));
        if (bRunningFeeTotal.greaterThanOrEqualTo(bTotalAmount)) {
            throw new QuoteError('Looks like the fees are greater than the payout value. Please use a different payment method or increase the amount to convert');
        }
    });

    var quoteData = {};
    quoteData[Quote.TOTAL_TITLE] = qTotalAmount;
    quoteData[Quote.PAYOUT_TITLE] = new QuoteValue(bTotalAmount.minus(bRunningFeeTotal), QuoteValue.CENTS);

    quoteData = us.extend(quoteData, quoteFees);

    return new Quote(quoteData);
}

module.exports = QuoteBuilder;

