var OrderBuilder = require('app/order/builder');
var Quote = require('app/payout/quote/quote');
var assert = require('assert');

var TABLE_NAME = 'orders';

/**
 * @param {object} context
 * @param {string} orderId
 * @param {string} email
 * @param {boolean} hasError
 * @param {boolean} isProcessed
 * @param {object} signedData
 * @param {number} timestamp
 * @param {object} developerPayload
 * @param {Quote} quote
 * @class Order
 */
function Order(
    context,
    orderId,
    email,
    hasError,
    isProcessed,
    signedData,
    timestamp,
    developerPayload,
    quote) {
    assert(typeof context === 'object');
    assert(typeof orderId === 'string');
    assert(typeof email === 'string');
    assert(typeof signedData === 'object');
    assert(typeof developerPayload === 'object');
    assert(quote instanceof Quote);

    this.context = context;
    this.orderId = orderId;
    this.email = email;
    this.hasError = hasError;
    this.isProcessed = isProcessed;
    this.signedData = signedData;
    this.timestamp = timestamp;
    this.developerPayload = developerPayload;
    this.quote = quote;
}

/**
 * @param {{dbDriver: object}} context
 * @param {string} orderId
 * @param {function(?object, Order=)}callback
 */
Order.load = function(context, orderId, callback) {
    var dbDriver = context.dbDriver;
    var params = {
        TableName: TABLE_NAME,
        Key: {
            'orderId': orderId
        },
        ConsistentRead: true
    };

    dbDriver.get(params, function(err, orderData) {
        if (err) {
            return callback(err);
        }

        var orderBuilder = new OrderBuilder(context);

        orderBuilder.setData(orderData.Item);

        var order = null;
        try {
            order = orderBuilder.build();
        } catch (buildError) {
            return callback(buildError);
        }

        return callback(err, order);
    });
};

Order.prototype.save = function(callback) {
    var orderData = this.toObject();
    var dbDriver = this.context.dbDriver;

    var params = {
        TableName: TABLE_NAME,
        Item: orderData
    };

    dbDriver.put(params, callback);
};

/**
 * @param {boolean} isProcessed
 */
Order.prototype.setIsProcessed = function(isProcessed) {
    this.isProcessed = isProcessed;
};

/**
 * @param {boolean} hasError
 */
Order.prototype.setHasError = function(hasError) {
    this.hasError = hasError;
};

// Getters

/**
 * @return {string}
 */
Order.prototype.getOrderId = function() {
    return this.orderId;
};

/**
 * @return {string}
 */
Order.prototype.getEmail = function() {
    return this.email;
};

/**
 * @return {boolean}
 */
Order.prototype.getHasError = function() {
    return this.hasError;
};

/**
 * @return {boolean}
 */
Order.prototype.getIsProcessed = function() {
    return this.isProcessed;
};

/**
 * @return {object}
 */
Order.prototype.getSignedData = function() {
    return this.signedData;
};

/**
 * @return {number}
 */
Order.prototype.getTimestamp = function() {
    return this.timestamp;
};

/**
 * @return {object}
 */
Order.prototype.getDeveloperPayload = function() {
    return this.developerPayload;
};

/**
 * @return {Quote}
 */
Order.prototype.getQuote = function() {
    return this.quote;
};

/**
 * @return {object}
 */
Order.prototype.toObject = function() {
    return {
        'orderId': this.orderId,
        'email': this.email,
        'hasError': this.hasError,
        'isProcessed': this.isProcessed,
        'signedData': this.signedData,
        'timestamp': this.timestamp,
        'developerPayload': this.developerPayload,
        'quote': this.getQuote().toObject()
    };
};

/**
 * @rreturn {string}
 */
Order.prototype.toString = function() {
    return JSON.stringify(this.toObject());
};

module.exports = Order;