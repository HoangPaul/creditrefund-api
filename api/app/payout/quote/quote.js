var us = require('underscore');
var deepcopy = require('deepcopy');

/**
 * @param {object} quoteValues
 * @constructor
 */
function Quote(quoteValues) {
    this.quoteValues = quoteValues;
}

/**
 * @type {string}
 */
Quote.PAYOUT_TITLE = 'Payout';

/**
 *
 * @type {string}
 */
Quote.TOTAL_TITLE = 'Total';

/**
 * @param {string} title
 * @returns {QuoteValue}
 */
Quote.prototype.getQuoteValueByTitle = function(title) {
    if (typeof this.quoteValues[title] === 'undefined') {
        throw new Error('Missing quote value of title "' + title + '"');
    }
    return this.quoteValues[title];
};

/**
 * @returns {QuoteValue[]}
 */
Quote.prototype.getFees = function() {
    var quoteFeeValues = deepcopy(this.quoteValues);
    delete quoteFeeValues[Quote.TOTAL_TITLE];
    delete quoteFeeValues[Quote.PAYOUT_TITLE];

    return quoteFeeValues;
};

/**
 * @returns {Object}
 */
Quote.prototype.toObject = function () {
    var result = {};
    us.each(this.quoteValues, function(quoteValue, title) {
        result[title] = quoteValue.toObject()
    });
    return result;
};

module.exports = Quote;