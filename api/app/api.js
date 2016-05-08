var express = require('express');
var router = express.Router();

var PayoutProcessorFactory = require('app/payout/processor/factory');
var Product = require('app/product/product');
var FeeCollection = require('app/payout/fee/collection');
var QuoteBuilder = require('app/payout/quote/builder');
var QuoteValue =  require('app/payout/quote/value');
var Quote =  require('app/payout/quote/quote');

var us = require('underscore');
var BigNumber = require('bignumber.js');
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

var context = {
    dbDriver: require('app/db-driver/aws-db'),
    config: {
        PAYOUT: 60,
        ADMIN: 10,
        GOOGLE: 30,
        IS_SENDABLE: true
    }
};

/**
 * Expects the following data:
 * {
 *      "productId" : string
 *      "email" : string
 *      "payoutOption" : ("paypal"|"bank")
 *      "accountHolderName" : string
 *      "bsb" : string
 *      "accountNumber" : string
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
                'productId',
                'email',
                'payoutOption'
            ];

            for (var i = 0; i < requiredFields.length; i++) {
                var requiredField = requiredFields[i];
                if (typeof data[requiredField] === 'undefined' || !data[requiredField]) {
                    return callback(new Error('Missing required field "' + requiredField + '"'));
                }
            }

            var payoutOption = data['payoutOption'];
            try {
                var payoutProcessor = PayoutProcessorFactory.getPaymentProcessorClass(payoutOption);

                var validationResult = payoutProcessor.validatePayoutData(data);

                if (validationResult.hasErrors()) {
                    return callback(validationResult.getErrors());
                }
            } catch (err) {
                return callback(err);
            }

            return callback();
        },
        function(callback) {
            async.parallel({
                'product': function(callback) {
                    var productId = req.body.productId;
                    return Product.load(context, productId, callback)
                },
                'fees': function(callback) {
                    return FeeCollection.load(context, callback);
                }
            }, callback);
        },
        function(results, callback) {
            var product = results['product'];
            var fees = results['fees'];

            var quoteBuilder = new QuoteBuilder(new QuoteValue(product.getValue(), QuoteValue.CENTS));
            us.each(fees.getMandatoryFees(), function(feeData) {
                var feeTitle = feeData['title'];
                var percent = new BigNumber(feeData['percent']);
                var flat = new QuoteValue(new BigNumber(feeData['flat']), QuoteValue.CENTS);

                quoteBuilder.addFee(feeTitle, percent, flat);
            });

            var quote = null;
            try {
                quote = quoteBuilder.build();
            } catch (err) {
                return callback(err);
            }

            callback(quote)
        }
    ], function(err, quote) {
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
            message: ''
        };

        var quoteValueFees = quote.getFees();
        us.each(quoteValueFees, function(quoteValueFee, title) {
            result[title] = quoteValueFee.getValue(QuoteValue.DOLLARS).toFixed(2);
        });

        result[Quote.PAYOUT_TITLE] = quote.getQuoteValueByTitle(Quote.PAYOUT_TITLE);
        result[Quote.TOTAL_TITLE] = quote.getQuoteValueByTitle(Quote.TOTAL_TITLE);

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
