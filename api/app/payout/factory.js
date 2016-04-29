var Paypal = require('app/payout/processor/paypal');
var Pin = require('app/payout/processor/pin');

module.exports = {
    getPaymentProcessorClass: function(processorType) {
        switch (processorType) {
            case 'paypal':
                return Paypal;
                break;
            case 'bank':
                return Pin;
                break
            default:
                throw new Error("Unknown processor type '" + processorType + "'");
        }
    }
};
