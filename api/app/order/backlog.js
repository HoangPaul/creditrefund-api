var Order = require('app/order/order');
var us = require('underscore');

var TABLE_NAME = 'orderBacklog';

/**
 * @param {Object} dbDriver
 * @param {string} tableName
 * @constructor
 */
function OrderBacklog(dbDriver, tableName) {
    this.dbDriver = dbDriver;
    this.tableName = tableName || TABLE_NAME;
}

var _normaliseOrderId = function(order) {
    if (typeof order === 'string') {
        return order;
    } else if (order instanceof Order) {
        return order.getOrderId()
    } else {
        console.log(order);
        throw new Error('order is not of type (string|Order)');
    }
};

/**
 * @param {function(?Object, {orderId: string}[]=)} callback
 */
OrderBacklog.prototype.getAll = function(callback) {
    var params = {
        TableName: this.tableName,
        ConsistentRead: true
    };

    this.dbDriver.scan(params, function(err, data) {
        if (err) {
            return callback(err);
        }

        if (us.size(data.Items) === 0) {
            return callback(null, []);
        }

        return callback(null, data.Items);
    });
};

/**
 * @param {(Order|string)} order
 * @param {function(?Object, Object=)} callback
 * @throws {Error}
 */
OrderBacklog.prototype.add = function(order, callback) {
    var orderId = _normaliseOrderId(order);

    var params = {
        TableName: this.tableName,
        Item: {
            'orderId': orderId,
            'timestamp': Date.now()
        }
    };

    this.dbDriver.put(params, callback);
};

/**
 * @param {(Order|string)} order
 * @param {function(?Object, Object=)} callback
 */
OrderBacklog.prototype.remove = function(order, callback) {
    var orderId = _normaliseOrderId(order);

    var params = {
        TableName: this.tableName,
        Key: {
            'orderId': orderId
        }
    };

    this.dbDriver.delete(params, callback);
};

/**
 * @param {(Order|string)} order
 * @param {function(?Object, Object=)} callback
 */
OrderBacklog.prototype.get = function(order, callback) {
    var orderId = _normaliseOrderId(order);

    var params = {
        TableName: this.tableName,
        Key: {
            'orderId': orderId
        }
    };

    this.dbDriver.get(params, callback);
};

module.exports = OrderBacklog;