var Paypal = require('app/payout/processor/vendor/paypal');
var Pin = require('app/payout/processor/vendor/pin');
var us = require('underscore');

var processorOptions = {
    'paypal': Paypal,
    'pin': Pin
};

module.exports = {
    /**
     * @returns {string[]}
     */
    getAvailableOptions: function() {
        return us.keys(processorOptions);
    },
    /**
     * @param {string} processorType
     * @return (Paypal|Pin)
     */
    getPaymentProcessorClass: function(processorType) {
        if (typeof processorOptions[processorType] === 'undefined') {
            throw new Error("Unknown processor type '" + processorType + "'");
        }

        return processorOptions[processorType];
    }
};
