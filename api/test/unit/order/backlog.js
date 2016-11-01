var assert = require('chai').assert;
var async = require('async');
var context = require('../../context');
var crypto = require('crypto');
var data = require('../../data');
var OrderBacklog = require('app/order/backlog');
var us = require('underscore');

var ORDER_QUEUE_TABLE_NAME = 'orderBacklog';

describe('OrderBacklog', function() {
    this.timeout(10000);
    before(function(done) {
        data.insertExistingOrder(done, context);

    });
    after(function(done) {
        data.deleteExistingOrder(done, context);
    });

    afterEach(function(done) {
        var params = {
            TableName: ORDER_QUEUE_TABLE_NAME,
            ConsistentRead: true
        };

        context.dbDriver.scan(params, function(err, data) {
            if (err) {
                throw err;
            }

            if (us.size(data.Items) === 0) {
                return done();
            }
            
            var batchWriteParams = {};
            batchWriteParams[ORDER_QUEUE_TABLE_NAME] = [];

            us.each(data.Items, function(orderIdContainer) {
                batchWriteParams[ORDER_QUEUE_TABLE_NAME].push({
                    'DeleteRequest': {
                        'Key': {
                            'orderId': orderIdContainer.orderId
                        }
                    }
                });
            });

            context.dbDriver.batchWrite({'RequestItems': batchWriteParams}, done);
        });
    });

    it('should add new orderId in backlog', function (done) {
        var orderQueue = new OrderBacklog(context.dbDriver, ORDER_QUEUE_TABLE_NAME);
        var orderId = crypto.randomBytes(8).toString('hex');
        orderQueue.add(orderId, function(err, _) {
            if (err) {
                throw err;
            }
            var params = {
                TableName: ORDER_QUEUE_TABLE_NAME,
                Key: {
                    'orderId': orderId
                }
            };

            context.dbDriver.get(params, function(err, data) {
                if (err) {
                    throw err;
                }

                assert.property(data, 'Item');
                assert.property(data.Item, 'orderId');
                assert.isTrue(us.size(data.Item) > 0);
                done();
            });
        });
    });

    it('should get all orderIds in backlog', function(done) {
        var orderQueue = new OrderBacklog(context.dbDriver, ORDER_QUEUE_TABLE_NAME);
        var numberOfOrderIds = Math.floor((Math.random() * 10) + 10);

        async.times(numberOfOrderIds, function(n, next) {
            var orderId = crypto.randomBytes(8).toString('hex');
            orderQueue.add(orderId, next);
        }, function(err) {
            if (err) {
                throw err;
            }
            orderQueue.getAll(function(err, orderIds) {
                if (err) {
                    throw err;
                }

                assert.equal(numberOfOrderIds, us.size(orderIds));
                done();
            })
        });
    });

    it('should remove an existing orderIds in backlog', function(done) {
        var orderQueue = new OrderBacklog(context.dbDriver, ORDER_QUEUE_TABLE_NAME);
        var orderId = crypto.randomBytes(8).toString('hex');

        orderQueue.add(orderId, function(err) {
            if (err) {
                throw err;
            }

            // Confirm that the order exists
            orderQueue.get(orderId, function(err, data) {
                if (err) {
                    throw err;
                }

                assert.isTrue(us.size(data.Item) > 0);

                orderQueue.remove(orderId, function(err, data) {
                    if (err) {
                        throw err;
                    }

                    orderQueue.get(orderId, function(err, data) {
                        if (err) {
                            throw err;
                        }
                        assert.notProperty(data, 'Item');
                        done();
                    });
                });
            })
        });
    });
});