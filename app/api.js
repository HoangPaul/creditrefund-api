var express = require('express');
var router = express.Router();

var apiMessages = require('app/messages').api;
var payouts = require('payouts');
var products = require('products');
var orders = require('orders');
var paypal = require('paypal');
var iap = require('iap');
var payoutProcessor = require('payout-processor');

var async = require('async');
var crypto = require('crypto');
var validator = require('validator');
var fs = require('fs');
var bunyan = require('bunyan');
var log = bunyan.createLogger({
    name: 'api',
    serializers: {
        err: bunyan.stdSerializers.err,
        req: bunyan.stdSerializers.req
    }
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
            var data = req.body;

            // Check email
            if (!validator.isEmail(data['email'])) {
                return callback(new Error('Malformed email "' + data['email'] + '"'));
            }

            // Check common required fields
            var requiredFields = [
                'product_id',
                'email',
                'payout_option'
            ];

            for (var i = 0; i < requiredFields.length; i++) {
                var requiredField = requiredFields[i];
                if (typeof data[requiredField] === 'undefined' || !data[requiredField]) {
                    return callback(new Error('Missing required field "' + requiredField + '"'));
                }
            }

            return payoutProcessor.validatePayoutData(data, callback);
        },
        function(callback) {
            var productId = req.body.product_id;
            return products.getProduct(productId, callback);
        },
        function(productData, callback) {
            var email = req.body.email;
            return payouts.getPayoutInfo(email, productData.value, callback);
        }
    ], function(err, payoutData) {
        if (err) {
            req.log.error({
                err: err,
                req: req,
                body: req.body
            });
            return next(apiMessages.DEFAULT_ERROR);
        }

        var result = {
            status: 0,
            message: '',
            payout_value: payoutData.getPayoutValue(),
            admin_value: payoutData.getAdminValue(),
            google_value: payoutData.getGoogleValue()
        };
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
    fs.writeFile('./logs/' + Date.now().toString(), JSON.stringify(req.body), 'utf-8', function(){});
    async.waterfall([
        function(callback) {
            var signature = req.body.signature;
            var signedData = req.body.signed_data;

            if (typeof signature === 'undefined' || typeof signedData === 'undefined') {
                return callback(new Error('Missing signature or signed data'));
            }
            return callback(null, signedData, signature);
        },
        function(signedData, signature, callback) {
            return iap.processOrder(signedData, signature, callback);
        },
        function(signedData, callback) {
            var developerPayload = JSON.parse(signedData.developerPayload);
            var productId = signedData.productId;
            console.log('product id is ' + productId);
            return products.getProduct(productId, function(err, product) {
                callback(err, product, signedData, developerPayload);
            });
        },
        function(product, signedData, developerPayload, callback) {
            return payouts.getPayoutInfo(developerPayload.email, product.value, function(err, payout) {
                callback(err, payout, product, signedData, developerPayload);
            });
        },
        function(payout, product, signedData, developerPayload, callback) {
            var orderData = {
                order_id: signedData.orderId,
                email: developerPayload.email,
                timestamp: Date.now(),
                is_processed: false,
                has_error: false,
                signed_data: signedData,
                developer_payload: developerPayload
            };

            req.log.info({
                state: 'Preparing to send',
                email: developerPayload.email,
                orderData: orderData
            });

            orders.saveOrder(orderData, function(err, _) {
                return callback(err, orderData, payout, product, signedData, developerPayload);
            })
        }
    ], function(err, order, payout, product, signedData, developerPayload) {
        if (err) {
            req.log.error({
                err: err,
                req: req,
                body: req.body
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
        if (payout.getIsSendable()) {
            console.log('sending');
            payoutProcessor.sendPayment(order, payout, function(err, payoutObject) {
                if (err) {
                    req.log.error({
                        error: err,
                        email: order,
                    });
                    orders.flagOrderFail(order);
                    return console.error(err);
                }
                req.log.info({
                    state: 'Payout successful',
                    payoutObject: payoutObject
                });
                return orders.flagOrderSuccess(order, function(err, response) {
                    if (err) {
                        return console.log(err);
                    }
                    return console.log(response);
                });
            });
        } else {
            console.log('not sending');
            return orders.flagOrderSuccess(order, function(err, response) {
                if (err) {
                    return console.log(err);
                }
                return console.log(response);
            });
        }
    });
});

router.post('/test', function(req, res, next) {
    var orderId = req.body.order_id;
    orders.getOrder(orderId, function(err, order) {
        return orders.flagOrderSuccess(order, function(err, response) {
            if (err) {
                res.send('Failed!');
                return console.log(err);
            }
            res.send('Success!');
            return console.log(response);
        });
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
