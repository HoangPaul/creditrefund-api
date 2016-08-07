var us = require('underscore');

var TABLE_NAME = 'stats';

function Stats() {}

/**
 * @param {{dbDriver: object, config: object}} context
 * @param {string} name Name of the stat
 * @param {function(?object Object=)} callback
 */
Stats.get = function(context, name, callback) {
    var params = {
        TableName: TABLE_NAME,
        Key: {
            'name': name
        },
        ConsistentRead: true
    };

    context.dbDriver.get(params, function(err, dbData) {
        if (err) {
            return callback(err);
        }

        if (us.size(dbData) === 0) {
            return callback(new Error('Cannot find stat "' + name + '"'));
        }

        return callback(null, dbData.Item);
    });
};

/**
 * @param {{dbDriver: object, config: object}} context
 * @param {string} name Name of the stat
 * @param {number} value Value to increase the stat by
 * @param {function(?object, object=)} callback
 */
Stats.add = function(context, name, value, callback) {
    var params = {
        TableName: TABLE_NAME,
        Key: {
            'name': name
        },
        UpdateExpression: 'add #a :y',
        ExpressionAttributeNames: {'#a': 'value'},
        ExpressionAttributeValues: {':y': value},
        ReturnValues: 'ALL_NEW'
    };

    context.dbDriver.update(params, function (err, data) {
        if (err) {
            return callback(err);
        }

        return callback(null, data.Attributes);
    });
};

module.exports = Stats;