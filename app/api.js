var express = require('express');
var router = express.Router();

var Blacklist = require('app/blacklist');
var Config = require('app/config');
var PayoutProcessorFactory = require('app/payout/processor/factory');
var Product = require('app/product/product');
var FeeCollection = require('app/payout/fee/collection');
var QuoteBuilder = require('app/payout/quote/builder');
var QuoteValue =  require('app/payout/quote/value');
var Quote =  require('app/payout/quote/quote');
var Customer = require('app/customer/customer');
var Order = require('app/order/order');
var OrderBuilder = require('app/order/builder');
var OrderViewProcessor = require('app/order/view/processor');
var Stats = require('app/stats');

var PayoutProcessorHelper = require('app/payout/helper');

var Iap = require('app/iap');
var VisibleError = require('app/error/visible');
var ValidationError = require('app/validation/error');

var apiMessages = require('app/messages').api;

var us = require('underscore');
var assert = require('assert');
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
 *      "deviceId": string
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
                'payoutOption',
                'deviceId'
            ];

            var payoutProcessorHelper = new PayoutProcessorHelper(context);
            var validationResult = payoutProcessorHelper.hasRequiredData(data, requiredFields);

            if (validationResult.hasErrors()) {
                return callback(
                    new ValidationError(
                        validationResult.getErrorMessages('. ')
                    )
                );
            }

            // All fields present, normalise them
            us.each(requiredFields, function(field) {
                data[field] = data[field].toString();
            });

            // Check email
            if (!validator.isEmail(data['email'])) {
                return callback(
                    new ValidationError(
                        new VisibleError('Malformed email ' + data['email'])
                    )
                );
            }

            var payoutOption = data['payoutOption'];
            try {
                var payoutProcessorClass = PayoutProcessorFactory.getPaymentProcessorClass(payoutOption);
                var payoutProcessor = new payoutProcessorClass(context, payoutProcessorHelper);
                var payoutValidationResult = payoutProcessor.isValidData(data);

                if (payoutValidationResult.hasErrors()) {
                    return callback(
                        new ValidationError(
                            payoutValidationResult.getErrorMessages('. ')
                        )
                    );
                }
            } catch (err) {
                return callback(err);
            }
            callback(null);
        },
        function(callback) {
            return async.parallel({
                'maxBatchTotal': function(callback) {
                    return Config.get(context, 'maxBatchTotal', callback);
                },
                'batchTotal': function(callback) {
                    return Stats.get(context, 'batchTotal', callback);
                }
            }, callback);
        },
        function(results, callback) {
            var maxBatchTotal = results.maxBatchTotal;
            var batchTotal = results.batchTotal;
            if (batchTotal.value >= maxBatchTotal.value) {
                return callback(new VisibleError(
                    apiMessages.DEFAULT_ERROR_TEMPLATE(),
                    apiMessages.BATCH_TOTAL_EXCEEDED));
            }
            return callback();
        },
        function(callback) {
            var payoutProcessorClass = PayoutProcessorFactory.getPaymentProcessorClass(data['payoutOption']);
            var payoutProcessorHelper = new PayoutProcessorHelper(context);
            var payoutProcessor = new payoutProcessorClass(context, payoutProcessorHelper);

            payoutProcessor.isEnabled(function(err, isEnabled) {
                if (err) {
                    return callback(err);
                }
                if (!isEnabled) {
                    return callback(new VisibleError(
                        'Sorry, this payout option is not available. Please choose a different option',
                        apiMessages.PAYOUT_METHOD_NOT_AVAILABLE
                    ));
                }
                return callback();
            });
        },
        // Check if blacklisted
        function(callback) {
            var payoutProcessorClass = PayoutProcessorFactory.getPaymentProcessorClass(data['payoutOption']);
            var payoutProcessorHelper = new PayoutProcessorHelper(context);
            var payoutProcessor = new payoutProcessorClass(context, payoutProcessorHelper);

            var deviceIid = data['deviceId'].split('--')[1];
            var blacklistDataToCheck = [
                data['email'],
                deviceIid,
                payoutProcessor.getDataHash(data)
            ];

            var deviceMacAddress = data['deviceId'].split('--')[0];
            if (deviceMacAddress !== 'null') {
                blacklistDataToCheck.push(deviceMacAddress);
            }

            var blacklist = new Blacklist(context);
            return blacklist.hasBlacklistedData(blacklistDataToCheck, function(err, isInBlacklist) {
                if (err) {
                    req.log.info({err: err});
                    return callback(new VisibleError(apiMessages.BLACKLIST_ERROR_TEMPLATE(), apiMessages.BLACKLIST_ERROR_CODE));
                }

                if (isInBlacklist) {
                    req.log.info({err: 'Is in blacklist but no error was outputted'});
                    return callback(new VisibleError(apiMessages.BLACKLIST_ERROR_TEMPLATE(), apiMessages.BLACKLIST_ERROR_CODE));
                }
                return callback(null, context, data['productId'], data['payoutOption']);
            });
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
                return next(err);
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
            res
                .status(200)
                .send(JSON.stringify(result));
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
    fs.writeFile('./logs/' + Date.now().toString(), JSON.stringify(req.body), 'utf-8', function(err){
        if (err) {
            console.log(err);
        }
    });

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
            var payoutOption = developerPayload['payoutOption'];

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
            return Customer.load(context, order.getEmail(), function(err, customer) {
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
            'message': '',
            'orderId': order.getOrderId(),
            'email': order.getEmail()
        }));

        // If this customer doesn't need to send money, mark it as complete and return immediately
        if (typeof customer !== 'undefined' && customer.getIsSendable() === false) {
            order.setIsProcessed(true);
            order.save(function(err) {
                if (err) {
                    req.log.error({
                        error: err,
                        order: order
                    });
                }
            });
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
                    .save(function(err) {
                        if (err) {
                            req.log.error({
                                error: err,
                                order: order
                            });
                        }
                    });
                return req.log.error({
                    error: err,
                    order: order
                });
            }

            req.log.info(JSON.stringify(result, null, 2));

            order
                .setIsProcessed(true)
                .setHasError(false)
                .save(function(err) {
                    if (err) {
                        req.log.error({
                            error: err,
                            order: order
                        });
                    }
                });

            var mailOptions = {
                'from': '<support@creditrefund.com.au>',
                'to': order.getEmail(),
                'subject': OrderViewProcessor.getSubject(order),
                'text': OrderViewProcessor.processTextNewOrderEmail(order),
                'xMailer': false
            };

            context.mailer.sendMail(mailOptions, function(err, info) {
                if (err) {
                    return req.log.error(err);
                }
                req.log.info({
                    'mailInfo': info,
                    'payoutResult': result
                });
            });

            var total = order.getQuote().getQuoteValueByTitle(Quote.TOTAL_TITLE).getValue(QuoteValue.DOLLARS).toFixed(2);
            Stats.add(context, 'batchTotal', total, function(err, _) {
                if (err) {
                    return req.log.err(err);
                }
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
    assert(typeof productId !== 'undefined');
    assert(typeof payoutOption !== 'undefined');
    assert(typeof topCallback !== 'undefined');
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
            quoteBuilder.addFees(fees.getMandatoryFees());

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
    req.log.error({err: err, req: req});
    next(err);
});

router.use(function(err, req, res, next) {
    if (err instanceof VisibleError) {
        // Visible errors are viewable to the world
        err = {
            'status': err.errorCode,
            'message': err.message,
            'reference': req.reqId
        }
    } else {
        // Some random error that we're not suppose to show the world
        err = {
            'status': 4000,
            'message': apiMessages.DEFAULT_ERROR_TEMPLATE(),
            'reference': req.reqId
        }
    }
    res.status(400).send(JSON.stringify(err, null, 2));
});

module.exports = router;
