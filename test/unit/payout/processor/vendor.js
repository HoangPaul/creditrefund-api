var assert = require('chai').assert;
var us = require('underscore');
var PayoutProcessorFactory = require('app/payout/processor/factory');

describe('Payout Processor All Vendors', function() {
    it('all processors should be have the expected methods', function() {
        var processorOptions = PayoutProcessorFactory.getAvailableOptions();

        assert.isArray(processorOptions);

        us.each(processorOptions, function(option) {
            assert.isString(option);
            var processorClass = null;

            assert.doesNotThrow(function() {
                processorClass = PayoutProcessorFactory.getPaymentProcessorClass(option);
            });

            assert.isFunction(processorClass);
            
            var dummyHelper = {
                isEnabled: function(someString, callback) {
                    assert.isString(someString);
                    assert.isFunction(callback);
                    return true;
                },
                hasRequiredData: function(someString, someArray) {
                    assert.isObject(someString);
                    assert.isArray(someArray);
                    return true;
                }
            };

            var dummyContext = {
                dbDriver: {},
                processor: {}
            };

            var processor = new processorClass(dummyContext, dummyHelper);

            assert.isFunction(processor.isEnabled);
            assert.isFunction(processor.isValidData);
            assert.isFunction(processor.sendPayment);

            processor.isEnabled(function(err, isEnabled) {
                assert.isUndefined(err);
                assert.isTrue(isEnabled);
            });

            assert.isTrue(processor.isValidData({'someKey': 'someValue'}));
        });
    });
});