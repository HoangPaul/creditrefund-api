var assert = require('chai').assert;
var us = require('underscore');

var Pin = require('app/payout/processor/vendor/pin');
var PayoutProcessorFactory = require('app/payout/processor/factory');
var Paypal = require('app/payout/processor/vendor/paypal');
var PaypalMassPayments = require('app/payout/processor/vendor/paypal-mass-payments');

describe('Payout Processor Factory', function() {
    it('all options should be loadable', function() {
        var processorOptions = PayoutProcessorFactory.getAvailableOptions();

        assert.isArray(processorOptions);

        us.each(processorOptions, function(option) {
            assert.isString(option);
            var processorClass = null;

            assert.doesNotThrow(function() {
                processorClass = PayoutProcessorFactory.getPaymentProcessorClass(option);
            });

            assert.isFunction(processorClass);
        });
    });

    it('should load paypal mass payments class', function() {
        var payoutClass = PayoutProcessorFactory.getPaymentProcessorClass('paypal');

        assert.deepEqual(payoutClass, PaypalMassPayments);
        assert.notDeepEqual(payoutClass, Paypal);
        assert.notDeepEqual(payoutClass, Pin);
    });

    it('should load pin class', function() {
        var payoutClass = PayoutProcessorFactory.getPaymentProcessorClass('pin');

        assert.deepEqual(payoutClass, Pin);
        assert.notDeepEqual(payoutClass, Paypal);
        assert.notDeepEqual(payoutClass, PaypalMassPayments);
    });

    it('should throw error when cannot load class', function() {
        assert.throws(function() {PayoutProcessorFactory.getPaymentProcessorClass('some non existent option')});
    });
});