var assert = require('chai').assert;
var us = require('underscore');
var deepcopy = require('deepcopy');
var BigNumber = require('bignumber.js');

var Paypal = require('app/payout/processor/vendor/paypal');
var PayoutHelper = require('app/payout/helper');
var Order = require('app/order/order');
var OrderBuilder = require('app/order/builder');
var Quote = require('app/payout/quote/quote');
var QuoteBuilder = require('app/payout/quote/builder');
var QuoteValue = require('app/payout/quote/value');

var context = require('../../../../context');
var data = require('../../../../data');
var testExistingOrderId = 'test' + Date.now();

describe('Payout Processor Paypal Payments', function() {
    var data = {
        'email': 'testpaypalpayout@example.com',
    };

    it('should have processor title', function() {
        assert.equal('Paypal', Paypal.PROCESSOR_TITLE);
    });

    describe('Validation', function() {
        it('should validate email', function() {
            var helper = new PayoutHelper(context);
            var paypal = new Paypal(context, helper);

            var validationResult = paypal.isValidData(data);
            assert.isFalse(validationResult.hasErrors());
        });

        it('should validate email, even with extra data', function() {
            var helper = new PayoutHelper(context);
            var paypal = new Paypal(context, helper);

            var validationResult = paypal.isValidData(data);
            assert.isFalse(validationResult.hasErrors());
        });

        it('should throw error if email is missing', function() {
            var helper = new PayoutHelper(context);
            var paypal = new Paypal(context, helper);

            us.each(data, function(_, key) {
                var clonedData = deepcopy(data);
                delete clonedData[key];

                var validationResult = paypal.isValidData(clonedData);
                assert.isTrue(validationResult.hasErrors());
            });
        });
    });

    describe('Sending Payment', function() {
        it('should send payment from order successfully', function(done) {
            this.timeout(100000);

            var PayoutProcessorFactory = require('app/payout/processor/factory');
            var helper = new PayoutHelper(context);
            var paypalClass = PayoutProcessorFactory.getPaymentProcessorClass('paypal');
            var paypal = new paypalClass(context, helper);
            //var paypal = new Paypal(context, helper);

            var quoteBuilder = new QuoteBuilder(new QuoteValue(new BigNumber(100), QuoteValue.CENTS));
            quoteBuilder.addFee('Test fee', new BigNumber(0), new QuoteValue(new BigNumber(0), QuoteValue.CENTS));
            var quote = quoteBuilder.build();

            var orderBuilder = new OrderBuilder(context);

            orderBuilder.setOrderId(testExistingOrderId);
            orderBuilder.setEmail('testpaypalpayout@example.com');
            orderBuilder.setHasError(false);
            orderBuilder.setIsProcessed(false);
            orderBuilder.setSignedData({'productId': 'testProductId'});
            orderBuilder.setTimestamp(1);
            orderBuilder.setDeveloperPayload(data);
            orderBuilder.setQuote(quote);

            var order = orderBuilder.build();

            paypal.sendPayment(order, function(err, result) {
                if (err) {
                    throw err;
                }

                assert.equal('Success', result['ACK']);
                done();
            });
        });
    });
});