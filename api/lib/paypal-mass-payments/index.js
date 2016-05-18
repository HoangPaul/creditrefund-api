var request = require('request');
var qs = require('qs');
var us = require('underscore');

/**
 * @param {{
 *      isProduction: boolean,
 *      user: string,
 *      pwd: string
 *      signature: string
 *  }} config
 * @constructor
 */
function PaypalMassPayments(config) {
    if (typeof config !== 'object') {
        throw new Error('Paypal Mass Payments constructor expects an object');
    }

    var requiredParams = [
        'user',
        'pwd',
        'signature',
        'isProduction'
    ];

    us.each(requiredParams, function(param) {
        if (!config.hasOwnProperty(param)) {
            throw new Error('Paypal Mass Payments missing required param ' + param + '.');
        }
    });

    if (typeof config.isProduction === 'boolean' && config.isProduction) {
        this.url = 'https://api-3t.paypal.com/nvp'
    } else {
        this.url = 'https://api-3t.sandbox.paypal.com/nvp'
    }

    this.config = {
        'USER': config.user,
        'PWD': config.pwd,
        'SIGNATURE': config.signature,
        'METHOD': 'MassPay',
        'VERSION': '90'
    };
}

/**
 * @param {{
 *      RECEIVERTYPE: string,
 *      CURRENCYCODE: string,
 *      L_EMAIL0: string,
 *      L_AMT0: string
 * }} data
 * @param {function(?Object, Object=)} callback
 */
PaypalMassPayments.prototype.send = function(data, callback) {
    var body = us.extend(this.config, data);

    request({
        url: this.url,
        method: 'POST',
        body: qs.stringify(body)
    }, function(err, _, res) {
        if (err) {
            return callback(err, res);
        }

        var resObj = qs.parse(res);
        if (resObj['ACK'] === 'Failure') {
            return callback(resObj);
        }

        return callback(err, resObj);
    });
};

module.exports = PaypalMassPayments;