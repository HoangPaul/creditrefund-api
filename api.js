var express = require('express');
var router = express.Router();

var defaults = require('./defaults');
var apiMessages = require('./messages').api;
var payouts = require('./payouts');
var products = require('./products');
var orders = require('./orders');
var paypal = require('./paypal');
var iap = require('./iap');

var async = require('async');
var crypto = require('crypto');
var validator = require('validator');
var bunyan = require('bunyan');
var log = bunyan.createLogger({
    name: 'api'
});

router.use(function(req, res, next) {
    crypto.randomBytes(4, function(ex, buf) {
        var token = buf.toString('hex');
        req.log = log.child({
            reqId: token
        });
        next();
    });
});

/**
 * @var data : object
 * @var invalidInput : object
 */
var isValidVerifyInput = function(data, invalidInput) {
    var requiredFields = [
        'product_id',
        'email',
        'payout_option'
    ];

    // Check common required fields
    for (var i = 0; i < requiredFields.length; i++) {
        var requiredField = requiredFields[i];
        if (typeof data[requiredField] === 'undefined' || !data[requiredField]) {
            invalidInput[requiredField] = data[requiredField] || 'undefined';
            return false;
        }
    }

    // Check payout option
    var payoutOption = data['payout_option'];
    var requiredPayoutOption = [
        PAYOUT_OPTION_PAYPAL,
        PAYOUT_OPTION_BANK
    ];

    if (requiredPayoutOption.indexOf(payoutOption) === -1) {
        invalidInput['payout_option'] = payoutOption;
        return false;
    }


    // Check bank required fields
    if (payoutOption === PAYOUT_OPTION_BANK) {
        var bankRequiredFields = [
            'account_holder_name',
            'bsb',
            'account_number'
        ];

        for (var i = 0; i < bankRequiredFields.length; i++) {
            var requiredField = bankRequiredFields[i];
            if (typeof data[requiredField] === 'undefined' || !data[requiredField]) {
                invalidInput[requiredField] = data[requiredField];
                return false;
            }
        }
    }

    var email = data['email'];

    // Check email
    if (!validator.isEmail(email)) {
        invalidInput['email'] = email;
        return false;
    }
    return true;
}

/**
 * Expects the following data:
 * {
 *      "product_id" : string
 *      "email" : string
 *      "payout_option" : ("paypal"|"bank")
 *      "account_holder_name" : string
 *      "bsb" : string
 *      "account_number" : string
 * }
 * Where account_holder_name, bsb and account_number are requried for
 * payout option "bank"
 *
 */
router.post('/verify', function(req, res, next) {
    async.waterfall([
        function(callback) {
            var invalidInput = {};
            if (!isValidVerifyInput(req.body, invalidInput)) {
                return callback('Invalid input ' + JSON.stringify(invalidInput));
            }
            return callback();
        },
        function(callback) {
            var productId = req.body.product_id;
            return products.getProduct(productId, callback);
        },
        function(productData, callback) {
            var email = req.body.email;
            return payouts.payout(email, productData.value, callback);
        }
    ], function(err, result) {
        if (err) {
            req.log.error({
                error: err,
                requestBody : req.body
            });
            return next(apiMessages.DEFAULT_ERROR);
        }
        result['status'] = 0;
        result['message'] = '';
        req.log.info(result);
        res.status(200).send(JSON.stringify(result));
    });
});


/**
 * Expects the following data:
 * {
 *      "signature" : string
 *      "signed_data" : string
 * }
 *
 * Where signed_data contains the following:
 * {
 *      "orderId" : string
 *      "packageName" : string
 *      "productId" : string
 *      "purchaseTime" : long
 *      "purchaseState" : int
 *      "purchaseToken" : string
 *      "developerPayload" : string
 * }
 * Where developerPayload contains the following:
 * {
 *      "product_id" : string
 *      "email" : string
 *      "payout_option" : ("paypal"|"bank")
 *      "account_holder_name" : string
 *      "bsb" : string
 *      "account_number" : string
 * }
 * Where account_holder_name, bsb and account_number are requried for
 * payout option "bank"
 *
 */
router.post('/confirm', function(req, res, next) {
    async.waterfall([
        function(callback) {
            var signature = req.body.signature;
            var signedData = req.body.signed_data;

            if (typeof signature === 'undefined' || typeof signedData === 'undefined') {
                return callback('Missing signature or signed data');
            }
            return callback();
        }
        function(callback) {
            return iap.processOrder(signedData, signature, callback);
        },
        function(iapRes, callback) {
            var payloadObject = JSON.parse(iapRes.developerPayload);
            var productId = iapRes.productId;
            return products.getProduct(productId, function(err, productData) {
                callback(err, productData, iapRes, payloadObject);
            });
        },
        function(productData, iapRes, payloadObject, callback) {
            return payouts.payout(payloadObject.email, productData.value, function(err, payoutData) {
                callback(err, payoutData, productData, iapRes, payloadObject);
            });
        },
        function(payoutData, productData, iapRes, payloadObject, callback) {
            var orderData = {
                order_id: iapRes.orderId,
                token: iapRes.purchaseToken,
                product_id: iapRes.productId,
                timestamp: Date.now(),
                is_processed: 0,
                email: payloadObject.email,
                total_value: productData.value,
                payout_value: payoutData.payout_value,
                admin_value: payoutData.admin_value,
                google_value: payoutData.google_value
            };

            req.log.info({
                state: 'Preparing to send',
                email: payloadObject.email,
                orderData: orderData
            });

            orders.saveOrder(orderData, function(err, _) {
                return callback(err, payoutData, productData, iapRes, payloadObject);
            })
        }
    ], function(err, payoutData, productData, iapRes, payloadObject) {
        if (err) {
            req.log.error({
                error: err,
                requestBody : req.body
            });
            return next(apiMessages.CONFIRM_ERROR);
        }

        // We've successfully saved the data in the DB. We can notify the customer that
        // the order is processing.
        res.send(JSON.stringify({
            'status': 0,
            'message': ''
        }));

        // Make the Paypal immediately.
        // Only make the Paypal request when there's no errors in saving the order. This
        // protects the payment from being sent twice. If there's an error, a human
        // should deal with it manually.
        if (typeof payoutData.is_sendable !== 'undefined' && payoutData.is_sendable) {
            console.log('before send');
            return;
            paypal.sendPayment(orderData, function(err, payoutObject) {
                if (err) {
                    req.log.error({
                        error: err,
                        email: orderData,
                    });
                    orders.flagOrderFail(orderData);
                    return console.error(err);
                }
                req.log.info({
                    state: 'Payout successful',
                    payoutObject: payoutObject
                });
                return orders.flagOrderSuccess(orderData);
            });
        }
    });
});

router.use(function(req, res, next) {
    res.status(403).send();
});

router.use(function(err, req, res, next) {
    req.log.warn(err);
    next(err);
});

router.use(function(err, req, res, next) {
    res.status(400).send(JSON.stringify({
        error: err
    }))
});

module.exports = router;
