var Paypal = require('app/payout/processor/vendor/paypal');
var Pin = require('app/payout/processor/vendor/pin');

module.exports = {
    /**
     * @param processorType
     * @return (Paypal|Pin)
     */
    getPaymentProcessorClass: function(processorType) {
        switch (processorType) {
            case 'paypal':
                return Paypal;
                break;
            case 'bank':
                return Pin;
                break;
            default:
                throw new Error("Unknown processor type '" + processorType + "'");
        }
    }
};
