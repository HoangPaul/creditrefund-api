return;

var assert = require('chai').assert;
var us = require('underscore');
var deepcopy = require('deepcopy');
var BigNumber = require('bignumber.js');

var Pin = require('app/payout/processor/vendor/pin');
var PayoutHelper = require('app/payout/helper');
var Order = require('app/order/order');
var OrderBuilder = require('app/order/builder');
var Quote = require('app/payout/quote/quote');
var QuoteBuilder = require('app/payout/quote/builder');
var QuoteValue = require('app/payout/quote/value');

var context = require('../../../../context');
var data = require('../../../../data');
var testExistingOrderId = 'test' + Date.now();

describe('Payout Processor Pin Payments', function() {
    var data = {
        'accountHolderName': data.accountHolderName,
        'bsb': data.bsb,
        'accountNumber': data.accountNumber
    };

    it('should have processor title', function() {
        assert.property(Pin, 'PROCESSOR_TITLE');
    });

    describe('Validation', function() {
        it('should validate account holder, bsb and account number', function() {
            var helper = new PayoutHelper(context);
            var pin = new Pin(context, helper);

            var validationResult = pin.isValidData(data);
            assert.isFalse(validationResult.hasErrors());
        });

        it('should validate account holder, bsb and account number, even with extra data', function() {
            var helper = new PayoutHelper(context);
            var pin = new Pin(context, helper);

            var validationResult = pin.isValidData(data);
            assert.isFalse(validationResult.hasErrors());
        });

        it('should throw error if any of account holder, bsb and account number is missing', function() {
            var helper = new PayoutHelper(context);
            var pin = new Pin(context, helper);

            us.each(data, function(_, key) {
                var clonedData = deepcopy(data);
                delete clonedData[key];

                var validationResult = pin.isValidData(clonedData);
                assert.isTrue(validationResult.hasErrors());
            });
        });
    });

    describe('Sending Payment', function() {
        it('should send payment from order successfully', function(done) {
            this.timeout(10000);

            var helper = new PayoutHelper(context);
            var pin = new Pin(context, helper);

            var quoteBuilder = new QuoteBuilder(new QuoteValue(new BigNumber(100), QuoteValue.CENTS));
            quoteBuilder.addFee('Test fee', new BigNumber(30), new QuoteValue(new BigNumber(0), QuoteValue.CENTS));
            var quote = quoteBuilder.build();

            var orderBuilder = new OrderBuilder(context);

            orderBuilder.setOrderId(testExistingOrderId);
            orderBuilder.setEmail('testPinPayment@example.com');
            orderBuilder.setHasError(false);
            orderBuilder.setIsProcessed(false);
            orderBuilder.setSignedData({});
            orderBuilder.setTimestamp(1);
            orderBuilder.setDeveloperPayload(data);
            orderBuilder.setQuote(quote);

            var order = orderBuilder.build();

            pin.sendPayment(order, function(err, result) {
                if (err) {
                    throw err;
                }

                assert.equal('succeeded', result['status']);
                assert.equal(quote.getQuoteValueByTitle(Quote.PAYOUT_TITLE).getValue(QuoteValue.CENTS).toFixed(0), result['amount']);
                assert.equal(quote.getQuoteValueByTitle(Quote.PAYOUT_TITLE).getValue(QuoteValue.CENTS).toFixed(0), result['total_credits']);
                done();
            });
        });
    });
});