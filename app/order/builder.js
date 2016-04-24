var BigNumber = require('bignumber.js');

/**
 * Required fields for the order object
 *
 * @type {string[]}
 */
var required = [
    'orderId',
    'email',
    'hasError',
    'isProcessed',
    'signedData',
    'timestamp',
    'developerPayload'
];

/**
 * @param {object} context
 * @constructor
 */
function OrderBuilder(context) {
    this.context = context;
    // Default values
    this.hasError = false;
    this.isProcessed = false;
}

/**
 * todo: validate data input
 * @param {string[]} data
 * @return OrderBuilder
 */
OrderBuilder.prototype.setData = function(data) {
    for (var field in data) {
        if (data.hasOwnProperty(field)) {
            this[field] = data[field];
        }
    }

    return this;
};

/**
 * @param {string} orderId
 * @return OrderBuilder
 */
OrderBuilder.prototype.setOrderId = function(orderId) {
    if (typeof orderId !== 'string') {
        throw new TypeError('orderId is not a string value.');
    }
    this.orderId = orderId;
    return this;
};

/**
 * @param {string} email
 * @return OrderBuilder
 */
OrderBuilder.prototype.setEmail = function(email) {
    if (typeof orderId !== 'string') {
        throw new TypeError('orderId is not a string value.');
    }
    this.email = email;
    return this;
};

/**
 * @param {boolean} hasError
 * @return OrderBuilder
 */
OrderBuilder.prototype.setHasError = function(hasError) {
    if (typeof hasError !== 'boolean') {
        throw new TypeError('hasError is not a boolean value.');
    }
    this.hasError = hasError;
    return this;
};

/**
 * @param {boolean} isProcessed
 * @return OrderBuilder
 */
OrderBuilder.prototype.setIsProcessed = function(isProcessed) {
    if (typeof isProcessed !== 'boolean') {
        throw new TypeError('isProcessed is not a boolean value.');
    }
    this.isProcessed = isProcessed;
    return this;
};

/**
 * @param {string} signedData
 * @return OrderBuilder
 */
OrderBuilder.prototype.setSignedData = function(signedData) {
    if (typeof signedData !== 'string') {
        throw new TypeError('signedData is not a string value.');
    }
    this.signedData = signedData;
    return this;
};

/**
 * @param {number} timestamp
 * @return OrderBuilder
 */
OrderBuilder.prototype.setTimestamp = function(timestamp) {
    var bTimestamp = new BigNumber(timestamp);
    if (!bTimestamp.isInteger()) {
        throw new TypeError('Timestamp is not a number.');
    }
    this.timestamp = timestamp;
    return this;
};

/**
 * @param {string} developerPayload
 * @return OrderBuilder
 */
OrderBuilder.prototype.setDeveloperPayload = function(developerPayload) {
    if (typeof developerPayload !== 'string') {
        throw new TypeError('developerPayload is not a string value.');
    }
    this.developerPayload = developerPayload;
    return this;
};

/**
 * @return {Order}
 */
OrderBuilder.prototype.build = function() {
    var missingProperties = [];
    for (var i = 0; i < required.length; i++) {
        if (!this.hasOwnProperty(required[i])) {
            missingProperties.push(required[i]);
        }
    }

    if (missingProperties.length > 0) {
        throw new Error('Missing properties ' + JSON.stringify(missingProperties));
    }

    var Order = require('app/order/order');

    return new Order(
        this.context,
        this.orderId,
        this.email,
        this.hasError,
        this.isProcessed,
        this.signedData,
        this.timestamp,
        this.developerPayload
    );
};

module.exports = OrderBuilder;