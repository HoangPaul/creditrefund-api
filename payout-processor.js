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
            KeyConditionExpression: "#payout_option = :payout_option",
            ExpressionAttributeNames:{
                "#payout_option": "payout_option"
            },
            ExpressionAttributeValues: {
                ":payout_option": payoutOption
            }
        };

        dynamodb.query(params, function(err, dbData) {
            if (err) {
                return callback(err);
            }

            if (dbData.Count != 1) {
                return callback(new Error('Failed to retrieve payout option, got a non-single result.'));
            }

            var isEnabled = dbData.Items[0].is_enabled;

            if (!isEnabled) {
                return callback(new Error('Payout option is not enabled.'));
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
        }
    },
    sendPayment: function(orderData, payout, callback) {
        switch (orderData.payout_option) {
            case PAYOUT_OPTION_PAYPAL:
                paypal.sendPayment(orderData, payout, callback);
                break;
            case PAYOUT_OPTION_BANK:
                pinjs.sendPayment(orderData, payout, callback);
                break;
        }
    }
};
