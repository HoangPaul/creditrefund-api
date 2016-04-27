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


//----

var paypal = require('./paypal');
var pinjs = require('./pin');
var dynamodb = require('./aws-db');

var TABLE_NAME = 'payout_options';

var PAYOUT_OPTION_PAYPAL = 'paypal';
var PAYOUT_OPTION_BANK = 'bank';

var bankRequiredFields = [
    'account_holder_name',
    'bsb',
    'account_number'
];

module.exports = {
    validatePayoutData: function(data, callback) {
        // Check payout option
        var payoutOption = data['payout_option'];

        var params = {
            TableName: TABLE_NAME,
            Key: {
                "payout_option": payoutOption
            }
        };

        dynamodb.get(params, function(err, dbData) {
            if (err) {
                return callback(err);
            }

            if (typeof dbData.Item === 'undefined') {
                return callback(new Error('Failed to retrieve payout option "' + payoutOption + '"'));
            }

            var isEnabled = dbData.Item.is_enabled;

            if (!isEnabled) {
                return callback(new Error('Payout option "' + payoutOption + '" is not enabled.'));
            }

            // Check bank required fields
            if (payoutOption === PAYOUT_OPTION_BANK) {
                for (var i = 0; i < bankRequiredFields.length; i++) {
                    var requiredField = bankRequiredFields[i];
                    if (typeof data[requiredField] === 'undefined' || !data[requiredField]) {
                        return callback(new Error('Missing required field'));
                    }
                }
            }

            return callback();
        });
    },
    sendPayment: function(order, payoutValue, callback) {
        switch (orderData.developer_payload.payout_option) {
            case PAYOUT_OPTION_PAYPAL:
                paypal.sendPayment(orderData, payout, callback);
                break;
            case PAYOUT_OPTION_BANK:
                pinjs.sendPayment(orderData, payout, callback);
                break;
            default:
                return callback(new Error('Could not find payout option "' + orderData.payout_option + '"'));
        }
    }
};
