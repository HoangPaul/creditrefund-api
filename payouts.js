var BigNumber = require('bignumber.js');
var defaults = require('./defaults');
var dynamodb = require('./aws-db');

var TABLE_NAME = 'emails';

var DOLLARS = 1;
var CENTS = 2;

function Payout(totalAmount, percentages, isSendable) {
    this.totalAmount = new BigNumber(totalAmount);

    // Convert dollars into cents
    this.totalAmount = this.totalAmount.times(100);

    this.payoutValue = this.totalAmount.times(percentages.payout).dividedBy(100)
    this.googleValue = this.totalAmount.times(percentages.google).dividedBy(100)
    this.adminValue = this.totalAmount.minus(this.payoutValue).minus(this.googleValue);

    this.isSendable = isSendable || true;
}

Payout.prototype.DOLLARS  = DOLLARS;
Payout.prototype.CENTS  = CENTS;

Payout.prototype.getTotalValue = function(format) {
    return _getPayoutValue(this.totalAmount, format);
}

Payout.prototype.getPayoutValue = function(format) {
    return _getPayoutValue(this.payoutValue, format);
}

Payout.prototype.getGoogleValue = function(format) {
    return _getPayoutValue(this.googleValue, format);
}

Payout.prototype.getAdminValue = function(format) {
    return _getPayoutValue(this.adminValue, format);
}

Payout.prototype.isSendable = function() {
    return this.isSendable;
}

Payout.prototype.toString = function() {
    return JSON.stringify({
        'total': this.totalAmount.toString(),
        'payout': this.payoutValue.toString(),
        'google': this.googleValue.toString(),
        'admin': this.adminValue.toString()
    });
}

var _getPayoutValue = function(bigNumber, format) {
    var format = format || DOLLARS;
    if (format === DOLLARS) {
        return bigNumber.dividedBy(100).toFixed(2, BigNumber.ROUND_UP);
    } else if (format === CENTS) {
        return bigNumber.toFixed(0, BigNumber.ROUND_UP);
    } else {
        return new Error('Unknown format');
    }
}

module.exports = {
    getPayoutInfo: function(email, amount, callback) {
        var params = {
            TableName: TABLE_NAME,
            KeyConditionExpression: "#email = :email",
            ExpressionAttributeNames:{
                "#email": "email"
            },
            ExpressionAttributeValues: {
                ":email": email
            }
        };

        dynamodb.query(params, function(err, data) {
            if (err) {
                return callback(err);
            }

            if (data.Count > 1) {
                return callback(new Error('Multiple email addresses retrieved'))
            }

            var data = {
                payout: defaults.PAYOUT,
                admin: defaults.ADMIN,
                google: defaults.GOOGLE
            };

            var isSendable = defaults.IS_SENDABLE;

            if (data.Count == 1) {
                data['payout'] = data.Items[0].payout;
                data['admin'] = data.Items[0].admin;
                data['google'] = data.Items[0].google;

                isSendable = data.Items[0].is_sendable;
            }

            var payout = new Payout(amount, data, isSendable);

            return callback(null, payout);
        });
    }
};
