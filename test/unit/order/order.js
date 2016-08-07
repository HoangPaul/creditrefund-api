var assert = require('chai').assert;
var deepcopy = require('deepcopy');

var context = require('../../context');
var data = require('../../data');

var newOrderId = data.newOrderId;
var newOrderData = data.newOrderData;
var existingOrderId = data.existingOrderId;
var existingOrderData = data.existingOrderData;

describe('Order', function() {
    describe('OrderBuilder', function() {
        it('should throw error when building with insufficient data', function(done) {
            var OrderBuilder = require('app/order/builder');

            // Delete one key from the complete set and try to build. Should fail every time
            for (var keyToRemove in newOrderData) {
                if (!newOrderData.hasOwnProperty(keyToRemove)) {
                    continue;
                }
                // Deep copy of original data
                var incompleteData = deepcopy(newOrderData);
                delete incompleteData[keyToRemove];

                var orderBuilder = new OrderBuilder(context);
                for (var key in incompleteData) {
                    if (!incompleteData.hasOwnProperty(key)) {
                        continue;
                    }
                    switch (key) {
                        case 'orderId':
                            orderBuilder.setOrderId(incompleteData[key]);
                            break;
                        case 'email':
                            orderBuilder.setEmail(incompleteData[key]);
                            break;
                        case 'signedData':
                            orderBuilder.setSignedData(incompleteData[key]);
                            break;
                        case 'hasError':
                            orderBuilder.setHasError(incompleteData[key]);
                            break;
                        case 'isProcessed':
                            orderBuilder.setIsProcessed(incompleteData[key]);
                            break;
                        case 'timestamp':
                            orderBuilder.setTimestamp(incompleteData[key]);
                            break;
                        case 'developerPayload':
                            orderBuilder.setDeveloperPayload(incompleteData[key]);
                            break;
                        case 'quote':
                            orderBuilder.setQuote(incompleteData[key]);
                            break;
                        default:
                            throw new Error('Have additional property in test data ' + keyToRemove);
                            break;
                    }
                }

                // We need to bind "this" to itself since "this" is changed for some reason
                assert.throws(orderBuilder.build.bind(orderBuilder), 'Missing properties ["' + keyToRemove + '"]');
            }
            done();
        });

        it('should build successfully with full data through individual setters', function(done) {
            var Order = require('app/order/order');
            var OrderBuilder = require('app/order/builder');
            var orderBuilder = new OrderBuilder(context);

            for (var key in newOrderData) {
                if (newOrderData.hasOwnProperty(key)) {
                    switch (key) {
                        case 'orderId':
                            orderBuilder.setOrderId(newOrderData[key]);
                            break;
                        case 'email':
                            orderBuilder.setEmail(newOrderData[key]);
                            break;
                        case 'signedData':
                            orderBuilder.setSignedData(newOrderData[key]);
                            break;
                        case 'hasError':
                            orderBuilder.setHasError(newOrderData[key]);
                            break;
                        case 'isProcessed':
                            orderBuilder.setIsProcessed(newOrderData[key]);
                            break;
                        case 'timestamp':
                            orderBuilder.setTimestamp(newOrderData[key]);
                            break;
                        case 'developerPayload':
                            orderBuilder.setDeveloperPayload(newOrderData[key]);
                            break;
                        case 'quote':
                            orderBuilder.setQuote(newOrderData[key]);
                            break;
                        default:
                            throw new Error('Have additional property in test data ' + key);
                            break;
                    }
                }
            }

            var order = orderBuilder.build();

            assert.instanceOf(order, Order);
            assert.equal(newOrderId, order.getOrderId());

            done();
        });

        it('should build successfully with full data through full setter', function(done) {
            var Order = require('app/order/order');
            var OrderBuilder = require('app/order/builder');
            var orderBuilder = new OrderBuilder(context);

            orderBuilder.setData(newOrderData);

            var order = orderBuilder.build();

            assert.instanceOf(order, Order);
            assert.equal(newOrderId, order.getOrderId());

            done();
        });
    });

    describe('Order', function () {
        beforeEach(function(done) {
            data.insertExistingOrder(done, context);
        });

        afterEach(function(done) {
            data.deleteNewOrder(function() {
                data.deleteExistingOrder(done, context);
            }, context);
        });

        it('should load order if exists in database', function (done) {
            var Order = require('app/order/order');

            Order.load(context, existingOrderId, function (err, order) {
                if (err) {
                    throw err;
                }

                assert.equal(existingOrderId, order.getOrderId());
                done();
            });
        });

        it('should load order if exists in database and get quote', function (done) {
            var Order = require('app/order/order');
            var Quote = require('app/payout/quote/quote');
            var QuoteValue = require('app/payout/quote/value');

            Order.load(context, existingOrderId, function (err, order) {
                if (err) {
                    throw err;
                }

                var quote = order.getQuote();
                assert.equal(existingOrderId, order.getOrderId());
                assert.instanceOf(quote, Quote);
                assert.equal(quote.getQuoteValueByTitle(Quote.TOTAL_TITLE).getValue(QuoteValue.DOLLARS).toFixed(2), '1.00');
                assert.isAbove(quote.getQuoteValueByTitle(Quote.PAYOUT_TITLE).getValue(QuoteValue.DOLLARS).toFixed(2), '0.50');
                done();
            });
        });

        it('should create new order through builder and save successfully', function(done) {
            var Order = require('app/order/order');
            var OrderBuilder = require('app/order/builder');
            var orderBuilder = new OrderBuilder(context);

            orderBuilder.setData(newOrderData);

            var newOrder = orderBuilder.build();

            newOrder.save(function(err) {
                if (err) {
                    throw err;
                }

                Order.load(context, newOrderId, function (err, order) {
                    if (err) {
                        throw err;
                    }

                    assert.equal(newOrderId, order.getOrderId());
                    assert.equal(newOrder.getOrderId(), order.getOrderId());
                    assert.instanceOf(order, Order);
                    done();
                });
            });
        });
    });
});