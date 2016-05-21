var express = require('express');
var router = express.Router();

var PayoutProcessorFactory = require('app/payout/processor/factory');
var Product = require('app/product/product');
var FeeCollection = require('app/payout/fee/collection');
var QuoteBuilder = require('app/payout/quote/builder');
var QuoteValue =  require('app/payout/quote/value');
var Quote =  require('app/payout/quote/quote');
var Customer = require('app/customer/customer');

var PayoutProcessorHelper = require('app/payout/helper');

var Iap = require('app/iap');

var apiMessages = require('app/messages').api;

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
    res.setHeader('Content-Type', 'application/json');
    
    crypto.randomBytes(4, function(ex, buf) {
        var token = buf.toString('hex');
        req.reqId = token;
        req.log = log.child({
            reqId: token
        });
        next();
    });
});

/**
 * Request expects the following data:
 * {
 *      "productId": string
 *      "email": string
 *      "payoutOption": ("paypal"|"pin")
 *      "accountHolderName": string
 *      "bsb": string
 *      "accountNumber": string
 * }
 * Where account_holder_name, bsb and account_number are required for
 * payout option "bank"
 *
 * Result contains
 * {
 *      "status": number,
 *      "message": string,
 *      "reference: string
 * }
 */
router.post('/verify', function(req, res, next) {
    var context = req.context;
    var data = req.body;
    async.waterfall([
        /**
         * Validate data
         *
         * @param {function(?Object, ...)} callback
         */
        function(callback) {
            // Check common required fields
            var requiredFields = [
                'productId',
                'email',
                'payoutOption'
            ];

            var payoutProcessorHelper = new PayoutProcessorHelper(context);
            var validationResult = payoutProcessorHelper.hasRequiredData(data, requiredFields);

            if (validationResult.hasErrors()) {
                console.log(validationResult.getErrors('. '));
                return callback(validationResult.getErrors('. '));
            }

            // Check email
            if (!validator.isEmail(data['email'])) {
                return callback(new Error('Malformed email ' + data['email']));
            }

            var payoutOption = data['payoutOption'];
            try {
                var payoutProcessorClass = PayoutProcessorFactory.getPaymentProcessorClass(payoutOption);
                var payoutProcessor = new payoutProcessorClass(context, payoutProcessorHelper);
                var payoutValidationResult = payoutProcessor.isValidData(data);

                if (payoutValidationResult.hasErrors()) {
                    return callback(payoutValidationResult.getErrors('. '));
                }
            } catch (err) {
                return callback(err);
            }

            var productId = data['productId'];
            return callback(null, context, productId, payoutOption);
        },

        // Build quote
        _buildQuote
    ],
        /**
         * @param {?Object} err
         * @param {Quote} quote
         */
        function(err, quote) {
            if (err) {
                req.log.error({
                    err: err,
                    req: req,
                    body: req.body
                });
                if (err instanceof Error) {
                    return next(err.message);
                } else if (typeof err === 'string') {
                    return next(err);
                } else {
                    return(apiMessages.DEFAULT_ERROR_TEMPLATE());
                }
            }

            var result = {
                status: 0,
                message: ''
            };

            var quoteValueFees = quote.getFees();
            var resultFees = {};
            us.each(quoteValueFees, function(quoteValueFee, title) {
                resultFees[title] = quoteValueFee.getValue(QuoteValue.DOLLARS).toFixed(2);
            });
            result['fees'] = resultFees;
            result['processorTitle'] = PayoutProcessorFactory.getPaymentProcessorClass(data['payoutOption']).PROCESSOR_TITLE;
            result[Quote.PAYOUT_TITLE] = quote.getQuoteValueByTitle(Quote.PAYOUT_TITLE).getValue(QuoteValue.DOLLARS).toFixed(2);
            result[Quote.TOTAL_TITLE] = quote.getQuoteValueByTitle(Quote.TOTAL_TITLE).getValue(QuoteValue.DOLLARS).toFixed(2);

            req.log.info(result);
            res.status(200).send(JSON.stringify(result));
        }
    );
});


/**
 * Expects the following data:
 * {
 *      "signature" : string
 *      "signedData" : string
 * }
 *
 * Where signedData contains the following:
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
 *      "productId": string
 *      "email": string
 *      "payoutOption": ("paypal"|"bank")
 *      "accountHolderName": string
 *      "bsb": string
 *      "accountNumber": string
 * }
 * Where account_holder_name, bsb and account_number are required for
 * payout option "bank"
 *
 */
router.post('/confirm', function(req, res, next) {
    fs.writeFile('../logs/' + Date.now().toString(), JSON.stringify(req.body), 'utf-8', function(){});

    var context = req.context;
    var iap = new Iap(context);
    var signature = req.body.signature;
    var signedData = JSON.parse(req.body.signedData);
    var developerPayload = JSON.parse(signedData.developerPayload);

    async.waterfall([
        /**
         * Verify input
         *
         * @param {function(?Object, ...)} callback
         */
        function(callback) {
            if (typeof signature === 'undefined' || typeof signedData === 'undefined') {
                return callback(new Error('Missing signature or signed data'));
            }
            iap.processGoogleOrder(signedData, signature, callback);
        },

        /**
         * Verify signed data
         *
         * @param {Object} iapSignedData
         * @param {function(?Object, ...)} callback
         */
        function(iapSignedData, callback) {
            var productId = signedData['productId'];
            var payoutOption = signedData['payoutOption'];

            if (JSON.stringify(iapSignedData) !== JSON.stringify(signedData)) {
                 console.log('signed data are different. ' + JSON.stringify(iapSignedData, null, 2) + ' and ' + JSON.stringify(signedData, null, 2));
            }
            // Overwrite the two signed data
            signedData = iapSignedData;

            callback(null, context, productId, payoutOption);
        },

        // Build quote
        _buildQuote,

        /**
         * Ensure that the order doesn't exist
         *
         * @param {Quote} quote
         * @param {function(?Object, ...)} callback
         */
        function (quote, callback) {
            Order.load(context, signedData.orderId, function(err) {
                if (err) {
                    // Order doesn't exist, continue normally
                    return callback(null, quote);
                }
                callback(new Error('This transaction has already been processed'));
            });
        },

        /**
         * Create a new order and save it in the database
         *
         * @param {Quote} quote
         * @param {function(?Object, ...)} callback
         */
        function(quote, callback) {
            var orderBuilder = new OrderBuilder(context);
            orderBuilder
                .setOrderId(signedData.orderId)
                .setEmail(developerPayload.email)
                .setHasError(false)
                .setIsProcessed(false)
                .setSignedData(signedData)
                .setTimestamp(Date.now())
                .setDeveloperPayload(developerPayload)
                .setQuote(quote);

            var order = orderBuilder.build();
            order.save(function(err) {
                return callback(err, order);
            });
        },

        /**
         * Try to load a customer if one exists
         *
         * @param {Order} order
         * @param {function(?Object, ...)} callback
         */
        function(order, callback) {
            return Customer.load(order.getEmail(), function(err, customer) {
                if (err) {
                    return callback(null, order);
                }

                return callback(null, order, customer);
            });
        }
    ],
        /**
         * @param {?Object} err
         * @param {Order=} order
         * @param {Order=} customer
         * @returns {*}
         */
        function(err, order, customer) {
        if (err) {
            req.log.error({
                err: err,
                req: req,
                body: req.body
            });
            return next(apiMessages.DEFAULT_ERROR_TEMPLATE());
        }

        // We've successfully saved the data in the DB. We can notify the customer that
        // the order is processing.
        res.send(JSON.stringify({
            'status': 0,
            'message': ''
        }));

        // If this customer doesn't need to send money, mark it as complete and return immediately
        if (typeof customer !== 'undefined' && customer.getIsSendable() === false) {
            order.setIsProcessed(true);
            order.save();
            return;
        }

        // Load the payment processor from the payload
        var payoutOption = developerPayload['payoutOption'];
        var payoutProcessorHelper = new PayoutProcessorHelper(context);
        var payoutOptionClass = PayoutProcessorFactory.getPaymentProcessorClass(payoutOption);
        var payoutProcessor = new payoutOptionClass(context, payoutProcessorHelper);

        payoutProcessor.sendPayment(order, function(err, result) {
            if (err) {
                order.setIsProcessed(true)
                    .setHasError(true)
                    .save();
                return req.log.error({
                    error: err,
                    order: order
                });
            }

            order
                .setIsProcessed(true)
                .setHasError(false)
                .save();

            req.log.info({
                'payoutResult': result
            });
        });
    });
});

/**
 * @param {Object} context
 * @param {string} productId
 * @param {string} payoutOption
 * @param {function(?Object, Quote=)} topCallback
 * @private
 */
var _buildQuote = function(context, productId, payoutOption, topCallback) {
    async.waterfall([
        function(callback) {
            async.parallel({
                'product': function(callback) {
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

            var payoutFee = fees.getFeeByCode(payoutOption);
            var payoutFeePercent = new BigNumber(payoutFee['percent']);
            var payoutFeeFlat = new QuoteValue(new BigNumber(payoutFee['flat']), QuoteValue.CENTS);
            quoteBuilder.addFee(payoutFee['title'], payoutFeePercent, payoutFeeFlat);

            var quote = null;
            try {
                quote = quoteBuilder.build();
            } catch (err) {
                return callback(err);
            }

            callback(null, quote)
        }
    ], topCallback);
};

router.use(function(req, res, next) {
    res.status(403).send();
});

router.use(function(err, req, res, next) {
    req.log.warn(err);
    next(err);
});

router.use(function(err, req, res, next) {
    if (typeof err === 'string') {
        err = {
            'message': err
        };
    }
    if (typeof err === 'object') {
        err = us.extend({
            'status': -1,
            'message': apiMessages.DEFAULT_ERROR_TEMPLATE(),
            'reference': req.reqId
        }, err);
    }
    res.status(400).send(JSON.stringify(err, null, 2));
});

module.exports = router;
