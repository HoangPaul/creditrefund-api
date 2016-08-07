var us = require('underscore');

var TABLE_NAME = 'stats';

function Stats(dbDriver, name) {
    this.dbDriver = dbDriver;
    this.name = name;
}

/**
 * @param {string} statName Name of the stat
 * @param {function(?object Object=)} callback
 */
Stats.prototype.get = function(statName, callback) {
    var params = {
        TableName: TABLE_NAME,
        Key: {
            'name': this.name
        },
        ConsistentRead: true
    };

    this.dbDriver.get(params, function(err, dbData) {
        if (err) {
            return callback(err);
        }

        if (us.size(dbData) === 0) {
            return callback(new Error('Cannot find stat "' + statName + '"'));
        }

        return callback(null, dbData.Item.stats[statName]);
    });
};

/**
 * @param {string} statName Name of the stat
 * @param {number} value Value to increase the stat by
 * @param {function(?object, object=)} callback
 */
Stats.prototype.add = function(statName, value, callback) {
    var params = {
        TableName: TABLE_NAME,
        Key: {
            'name': this.name
        },
        UpdateExpression: 'add #s.#n :y',
        ExpressionAttributeNames: {
            '#s': 'stats',
            '#n': statName
        },
        ExpressionAttributeValues: {':y': value},
        ReturnValues: 'UPDATED_NEW'
    };

    this.dbDriver.update(params, function (err, data) {
        if (err) {
            return callback(err);
        }

        return callback(null, data.Attributes.stats[statName]);
    });
};

module.exports = Stats;