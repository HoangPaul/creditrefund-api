var assert = require('chai').assert;
var deepcopy = require('deepcopy');
var Quote = require('app/payout/quote/quote');
var QuoteValue = require('app/payout/quote/value');
var BigNumber = require('bignumber.js');
var us = require('underscore');

var quoteData = {};

quoteData[Quote.TOTAL_TITLE] = new QuoteValue(new BigNumber(200), QuoteValue.CENTS);
quoteData[Quote.PAYOUT_TITLE] = new QuoteValue(new BigNumber(100), QuoteValue.CENTS);
quoteData['test'] = new QuoteValue(new BigNumber(50), QuoteValue.CENTS);


describe('Quote', function() {
    it('should get quote value by title', function() {
        var testQuoteData = deepcopy(quoteData);

        var quote = new Quote(testQuoteData);

        var quoteValue = quote.getQuoteValueByTitle('test');

        assert.instanceOf(quoteValue, QuoteValue);
        assert.equal('0.50', quoteValue.getValue(QuoteValue.DOLLARS).toFixed(2));

        var quoteValueAgain = quote.getQuoteValueByTitle('test');

        assert.instanceOf(quoteValueAgain, QuoteValue);
        assert.equal('0.50', quoteValueAgain.getValue(QuoteValue.DOLLARS).toFixed(2));
    });

    it('should get fees if present and not destroy object', function() {
        var testQuoteData = deepcopy(quoteData);

        var quote = new Quote(testQuoteData);

        var fees = quote.getFees();

        assert.equal(us.size(fees), 1);
        assert.property(fees, 'test');
        assert.instanceOf(fees['test'], QuoteValue);

        var quoteValue = quote.getQuoteValueByTitle(Quote.PAYOUT_TITLE);

        assert.instanceOf(quoteValue, QuoteValue);
        assert.equal('1.00', quoteValue.getValue(QuoteValue.DOLLARS).toFixed(2));
    });
});