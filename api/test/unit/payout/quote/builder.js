var assert = require('chai').assert;
var deepcopy = require('deepcopy');
var QuoteError = require('app/payout/quote/error');

describe('QuoteBuilder', function() {
    it('should build the correct quote for easy values [CENTS]', function() {
        var QuoteBuilder = require('app/payout/quote/builder');
        var QuoteValue  = require('app/payout/quote/value');
        var Quote = require('app/payout/quote/quote');
        var BigNumber = require('bignumber.js');

        var totalValue = new QuoteValue(new BigNumber(10000), QuoteValue.CENTS);
        var quoteBuilder = new QuoteBuilder(totalValue);

        quoteBuilder.addFee('Google Fee', new BigNumber(30), new QuoteValue(new BigNumber(0), QuoteValue.CENTS));
        quoteBuilder.addFee('Admin Fee', new BigNumber(5), new QuoteValue(new BigNumber(0), QuoteValue.CENTS));

        var quote = quoteBuilder.build();

        assert.equal(quote.getQuoteValueByTitle(Quote.TOTAL_TITLE).getValue(QuoteValue.CENTS).toFixed(0), '10000');
        assert.equal(quote.getQuoteValueByTitle(Quote.PAYOUT_TITLE).getValue(QuoteValue.CENTS).toFixed(0), '6500');
        assert.equal(quote.getQuoteValueByTitle('Google Fee').getValue(QuoteValue.CENTS).toFixed(0), '3000');
        assert.equal(quote.getQuoteValueByTitle('Admin Fee').getValue(QuoteValue.CENTS).toFixed(0), '500');
    });

    it('should build the correct quote for easy values [DOLLARS]', function() {
        var QuoteBuilder = require('app/payout/quote/builder');
        var QuoteValue  = require('app/payout/quote/value');
        var Quote = require('app/payout/quote/quote');
        var BigNumber = require('bignumber.js');

        var totalValue = new QuoteValue(new BigNumber(100), QuoteValue.DOLLARS);
        var quoteBuilder = new QuoteBuilder(totalValue);

        quoteBuilder.addFee('Google Fee', new BigNumber(30), new QuoteValue(new BigNumber(0), QuoteValue.DOLLARS));
        quoteBuilder.addFee('Admin Fee', new BigNumber(5), new QuoteValue(new BigNumber(0), QuoteValue.DOLLARS));

        var quote = quoteBuilder.build();

        assert.equal(quote.getQuoteValueByTitle(Quote.TOTAL_TITLE).getValue(QuoteValue.DOLLARS).toFixed(2), '100.00');
        assert.equal(quote.getQuoteValueByTitle(Quote.PAYOUT_TITLE).getValue(QuoteValue.DOLLARS).toFixed(2), '65.00');
        assert.equal(quote.getQuoteValueByTitle('Google Fee').getValue(QuoteValue.DOLLARS).toFixed(2), '30.00');
        assert.equal(quote.getQuoteValueByTitle('Admin Fee').getValue(QuoteValue.DOLLARS).toFixed(2), '5.00');
    });

    it('should build the correct quote for easy values [CENTS -> DOLLARS]', function() {
        var QuoteBuilder = require('app/payout/quote/builder');
        var QuoteValue  = require('app/payout/quote/value');
        var Quote = require('app/payout/quote/quote');
        var BigNumber = require('bignumber.js');

        var totalValue = new QuoteValue(new BigNumber(10000), QuoteValue.CENTS);
        var quoteBuilder = new QuoteBuilder(totalValue);

        quoteBuilder.addFee('Google Fee', new BigNumber(30), new QuoteValue(new BigNumber(0), QuoteValue.CENTS));
        quoteBuilder.addFee('Admin Fee', new BigNumber(5), new QuoteValue(new BigNumber(0), QuoteValue.CENTS));

        var quote = quoteBuilder.build();

        assert.equal(quote.getQuoteValueByTitle(Quote.TOTAL_TITLE).getValue(QuoteValue.DOLLARS).toFixed(2), '100.00');
        assert.equal(quote.getQuoteValueByTitle(Quote.PAYOUT_TITLE).getValue(QuoteValue.DOLLARS).toFixed(2), '65.00');
        assert.equal(quote.getQuoteValueByTitle('Google Fee').getValue(QuoteValue.DOLLARS).toFixed(2), '30.00');
        assert.equal(quote.getQuoteValueByTitle('Admin Fee').getValue(QuoteValue.DOLLARS).toFixed(2), '5.00');
    });

    it('should build the correct quote for easy values [DOLLARS -> CENTS]', function() {
        var QuoteBuilder = require('app/payout/quote/builder');
        var QuoteValue  = require('app/payout/quote/value');
        var Quote = require('app/payout/quote/quote');
        var BigNumber = require('bignumber.js');

        var totalValue = new QuoteValue(new BigNumber(100), QuoteValue.DOLLARS);
        var quoteBuilder = new QuoteBuilder(totalValue);

        quoteBuilder.addFee('Google Fee', new BigNumber(30), new QuoteValue(new BigNumber(0), QuoteValue.DOLLARS));
        quoteBuilder.addFee('Admin Fee', new BigNumber(5), new QuoteValue(new BigNumber(0), QuoteValue.DOLLARS));

        var quote = quoteBuilder.build();

        assert.equal(quote.getQuoteValueByTitle(Quote.TOTAL_TITLE).getValue(QuoteValue.CENTS).toFixed(0), '10000');
        assert.equal(quote.getQuoteValueByTitle(Quote.PAYOUT_TITLE).getValue(QuoteValue.CENTS).toFixed(0), '6500');
        assert.equal(quote.getQuoteValueByTitle('Google Fee').getValue(QuoteValue.CENTS).toFixed(0), '3000');
        assert.equal(quote.getQuoteValueByTitle('Admin Fee').getValue(QuoteValue.CENTS).toFixed(0), '500');
    });

    it('should throw QuoteError if fee is greater than total', function() {
        var QuoteBuilder = require('app/payout/quote/builder');
        var QuoteValue  = require('app/payout/quote/value');
        var BigNumber = require('bignumber.js');

        var totalValue = new QuoteValue(new BigNumber(1), QuoteValue.DOLLARS);
        var quoteBuilder = new QuoteBuilder(totalValue);

        quoteBuilder.addFee('Google Fee', new BigNumber(30), new QuoteValue(new BigNumber(100), QuoteValue.CENTS));

        assert.throws(quoteBuilder.build.bind(quoteBuilder), QuoteError, 'is greater than total amount');
    });

    it('should throw QuoteError if fee is equal to total', function() {
        var QuoteBuilder = require('app/payout/quote/builder');
        var QuoteValue  = require('app/payout/quote/value');
        var BigNumber = require('bignumber.js');

        var totalValue = new QuoteValue(new BigNumber(1), QuoteValue.DOLLARS);
        var quoteBuilder = new QuoteBuilder(totalValue);

        quoteBuilder.addFee('Google Fee', new BigNumber(0), new QuoteValue(new BigNumber(100), QuoteValue.CENTS));

        assert.throws(quoteBuilder.build.bind(quoteBuilder), QuoteError, 'is greater than total amount');
    });

    it('should not throw any error if fee is 1 cent under total', function() {
        var QuoteBuilder = require('app/payout/quote/builder');
        var QuoteValue  = require('app/payout/quote/value');
        var Quote = require('app/payout/quote/quote');
        var BigNumber = require('bignumber.js');

        var totalValue = new QuoteValue(new BigNumber(1), QuoteValue.DOLLARS);
        var quoteBuilder = new QuoteBuilder(totalValue);

        quoteBuilder.addFee('Google Fee', new BigNumber(0), new QuoteValue(new BigNumber(99), QuoteValue.CENTS));

        var quote = quoteBuilder.build();

        assert.equal(quote.getQuoteValueByTitle(Quote.TOTAL_TITLE).getValue(QuoteValue.DOLLARS).toFixed(2), '1.00');
        assert.equal(quote.getQuoteValueByTitle(Quote.PAYOUT_TITLE).getValue(QuoteValue.DOLLARS).toFixed(2), '0.01');
    });
});