var Customer = require('app/customer/customer');
var Order = require('app/order/order');
var OrderViewProcessor = require('app/order/view/processor');
var PayoutProcessorHelper = require('app/payout/helper');
var PayoutProcessorFactory = require('app/payout/processor/factory');
var CustomerDoesNotExistError = require('app/customer/error/customerDoesNotExist');
var context = require('app/context');
var us = require('underscore');
var async = require('async');

module.exports = function(context) {
    var orderBacklog = context.orderBacklog;

    orderBacklog.getAll(function(err, orderIdsToBeProcessed) {
        if (err) {
            throw err;
        }
        us.each(orderIdsToBeProcessed, function(orderIdContainer) {
            var orderId = orderIdContainer.orderId;
            async.waterfall([
                // Load order
                function(callback) {
                    return Order.load(context, orderId, callback);
                },
                // Load customer
                function(order, callback) {
                    return Customer.load(context, order.getEmail(), function(err, customer) {
                        if (err) {
                            if (err instanceof CustomerDoesNotExistError) {
                                return callback(null, order);
                            } else {
                                return callback(err);
                            }
                        }
                        return callback(null, order, customer);
                    });
                }
            ], function(err, order, customer) {
                if (err) {
                    console.error(err);
                    return;
                }

                orderBacklog.remove(order.getOrderId(), function(err) {
                    if (err) {
                        return console.error(err);
                    }
                });

                if (order.getIsProcessed()) {
                    console.error('This order (ID: ' + order.getOrderId() + ') has already been processed.');
                    return;
                }

                if (typeof customer !== 'undefined' && customer.getIsSendable() === false) {
                    order.setIsProcessed(true);
                    order.save(function(err) {
                        if (err) {
                            throw err;
                        }
                    });
                    return;
                }

                // Load the payment processor from the payload
                var developerPayload = order.getDeveloperPayload();
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
                                    throw err;
                                }
                            });
                        throw err;
                    }

                    order
                        .setIsProcessed(true)
                        .setHasError(false)
                        .save(function(err) {
                            if (err) {
                                throw err;
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
                            throw err;
                        }
                    });
                });
            });
        });
    });
};