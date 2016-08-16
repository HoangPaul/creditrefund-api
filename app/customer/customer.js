var assert = require('assert');
var us = require('underscore');
var CustomerDoesNotExistError = require('app/customer/error/customerDoesNotExist');

var TABLE_NAME = 'customers';

/**
 * @param {string} email
 * @param {boolean} isSendable
 * @constructor
 */
function Customer(email, isSendable) {
    assert(typeof email === 'string');
    assert(typeof isSendable === 'boolean');

    this.email = email;
    this.isSendable = isSendable;
}

/**
 * @param {{dbDriver: object, config: object}} context
 * @param {string} email
 * @param {function(?(Object|CustomerDoesNotExistError) Customer=)} callback
 */
Customer.load = function(context, email, callback) {
    var params = {
        TableName: TABLE_NAME,
        Key: {
            "email": email
        }
    };

    context.dbDriver.get(params, function(err, dbData) {
        if (err) {
            return callback(err);
        }

        if (us.size(dbData) === 0) {
            return callback(new CustomerDoesNotExistError('Cannot find customer with email "' + email + '"'));
        }

        var customer = new Customer(email, dbData.Item['isSendable']);

        return callback(null, customer);
    });
};

/**
 * @returns {string}
 */
Customer.prototype.getEmail = function() {
    return this.email;
};

/**
 * @returns {boolean}
 */
Customer.prototype.getIsSendable = function() {
    return this.isSendable;
};

/**
 * @return {string}
 */
Customer.prototype.toString = function() {
    return JSON.stringify(this.toObject());
};

/**
 * @returns {{email: string, percentages: object, isSendable: boolean}}
 */
Customer.prototype.toObject = function() {
    return {
        'email': this.email,
        'isSendable': this.isSendable
    };
};

module.exports = Customer;