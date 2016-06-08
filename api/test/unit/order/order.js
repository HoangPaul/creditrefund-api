var assert = require('chai').assert;
var deepcopy = require('deepcopy');

var testExistingOrderId = 'GPA.1361-0852-2559-97342';
var testNewOrderId = 'GPA.1361-0852-2559-97343';
var testContext = require('../../testContext');

var testOrderData = {
    "developerPayload": {
        "email": "marionette-labs-customer@gmail.com",
        "payoutOption": "paypal"
    },
    "email": "marionette-labs-customer@gmail.com",
    "hasError": false,
    "isProcessed": false,
    "signedData": {
        "developerPayload": "{\"payoutOption\":\"paypal\",\"email\":\"marionette-labs-customer@gmail.com\"}",
        "orderId": "GPA.1361-0852-2559-97342",
        "packageName": "hoangpaul.nihil",
        "productId": "3.00",
        "purchaseState": 0,
        "purchaseTime": 1460373887080,
        "purchaseToken": "onphmgpfdboobggggehnahph.AO-J1OxbaAQtKJbufm6lL4doAc4X27lEg8GKRkISzgRUwmfAeMiHUM8tq4Gql2586jlwMxMJ9CErm-GtqS5evNiJkj1JMfmiqw_Bd3pvQvzOnKkTmSx0-E8",
        "service": "google",
        "status": 0
    },
    "timestamp": 1460373890238,
    "quote": {
        "Total": {
            "value": "10000"
        },
        "Payout": {
            "value": "6500"
        },
        "Google Fee": {
            "value": "3000"
        },
        "Admin Fee": {
            "value": "500"
        }
    }
};

var testExistingOrderData = deepcopy(testOrderData);
testExistingOrderData['orderId'] = testExistingOrderId;

var testNewOrderData = deepcopy(testOrderData);
testNewOrderData['orderId'] = testNewOrderId;

describe('Order', function() {
    describe('OrderBuilder', function() {
        it('should throw error when building with insufficient data', function(done) {
            var OrderBuilder = require('app/order/builder');

            // Delete one key from the complete set and try to build. Should fail every time
            for (var keyToRemove in testNewOrderData) {
                if (!testNewOrderData.hasOwnProperty(keyToRemove)) {
                    continue;
                }
                // Deep copy of original data
                var incompleteData = deepcopy(testNewOrderData);
                delete incompleteData[keyToRemove];

                var orderBuilder = new OrderBuilder(testContext);
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
            var orderBuilder = new OrderBuilder(testContext);

            for (var key in testNewOrderData) {
                if (testNewOrderData.hasOwnProperty(key)) {
                    switch (key) {
                        case 'orderId':
                            orderBuilder.setOrderId(testNewOrderData[key]);
                            break;
                        case 'email':
                            orderBuilder.setEmail(testNewOrderData[key]);
                            break;
                        case 'signedData':
                            orderBuilder.setSignedData(testNewOrderData[key]);
                            break;
                        case 'hasError':
                            orderBuilder.setHasError(testNewOrderData[key]);
                            break;
                        case 'isProcessed':
                            orderBuilder.setIsProcessed(testNewOrderData[key]);
                            break;
                        case 'timestamp':
                            orderBuilder.setTimestamp(testNewOrderData[key]);
                            break;
                        case 'developerPayload':
                            orderBuilder.setDeveloperPayload(testNewOrderData[key]);
                            break;
                        case 'quote':
                            orderBuilder.setQuote(testNewOrderData[key]);
                            break;
                        default:
                            throw new Error('Have additional property in test data ' + key);
                            break;
                    }
                }
            }

            var order = orderBuilder.build();

            assert.instanceOf(order, Order);
            assert.equal(testNewOrderId, order.getOrderId());

            done();
        });

        it('should build successfully with full data through full setter', function(done) {
            var Order = require('app/order/order');
            var OrderBuilder = require('app/order/builder');
            var orderBuilder = new OrderBuilder(testContext);

            orderBuilder.setData(testNewOrderData);

            var order = orderBuilder.build();

            assert.instanceOf(order, Order);
            assert.equal(testNewOrderId, order.getOrderId());

            done();
        });
    });

    describe('Order', function () {
        // Set up all existing orders in database
        beforeEach('reset order database', function(done) {
            var params = {
                TableName: 'orders',
                Key: {
                    orderId: testExistingOrderId
                },
                Item: testExistingOrderData
            };

            testContext.dbDriver.put(params, done);
        });

        // Clean up all new orders in database
        afterEach(function(done) {
            var deleteParams = {
                TableName: 'orders',
                Key: {
                    orderId: testNewOrderId
                }
            };

            testContext.dbDriver.delete(deleteParams, done);
        });

        it('should load order if exists in database', function (done) {
            var Order = require('app/order/order');

            Order.load(testContext, testExistingOrderId, function (err, order) {
                if (err) {
                    throw err;
                }

                assert.equal(testExistingOrderId, order.getOrderId());
                done();
            });
        });

        it('should load order if exists in database and get quote', function (done) {
            var Order = require('app/order/order');
            var Quote = require('app/payout/quote/quote');
            var QuoteValue = require('app/payout/quote/value');

            Order.load(testContext, testExistingOrderId, function (err, order) {
                if (err) {
                    throw err;
                }

                var quote = order.getQuote();
                assert.equal(testExistingOrderId, order.getOrderId());
                assert.instanceOf(quote, Quote);
                assert.equal(quote.getQuoteValueByTitle(Quote.TOTAL_TITLE).getValue(QuoteValue.DOLLARS).toFixed(2), '100.00');
                assert.equal(quote.getQuoteValueByTitle(Quote.PAYOUT_TITLE).getValue(QuoteValue.DOLLARS).toFixed(2), '65.00');
                done();
            });
        });

        it('should flag an existing order as is_processed', function (done) {
            var Order = require('app/order/order');

            Order.load(testContext, testExistingOrderId, function (err, order) {
                if (err) {
                    throw err;
                }

                assert.equal(false, order.getIsProcessed());

                order.setIsProcessed(true);

                assert.equal(true, order.getIsProcessed());

                order.save(function (saveErr, saveResult) {
                    if (saveErr) {
                        throw saveErr;
                    }

                    Order.load(testContext, testExistingOrderId, function (err, orderReloaded) {
                        assert.equal(true, orderReloaded.getIsProcessed());
                        done();
                    });
                });
            });
        });

        it('should create new order through builder and save successfully', function(done) {
            var Order = require('app/order/order');
            var OrderBuilder = require('app/order/builder');
            var orderBuilder = new OrderBuilder(testContext);

            orderBuilder.setData(testNewOrderData);

            var newOrder = orderBuilder.build();

            newOrder.save(function(err) {
                if (err) {
                    throw err;
                }

                Order.load(testContext, testNewOrderId, function (err, order) {
                    if (err) {
                        throw err;
                    }

                    assert.equal(testNewOrderId, order.getOrderId());
                    assert.equal(newOrder.getOrderId(), order.getOrderId());
                    assert.instanceOf(order, Order);
                    done();
                });
            });
        });
    });
});