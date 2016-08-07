var us = require('underscore');

var TABLE_NAME = 'config';

/**
 * @constructor
 */
function Config() {}

/**
 * @param {{dbDriver: object, config: object}} context
 * @param {string} name
 * @param {function(?object {name: string, value: (string|number)}=)} callback
 */
Config.get = function(context, name, callback) {
    var params = {
        TableName: TABLE_NAME,
        Key: {
            'name': name
        }
    };

    context.dbDriver.get(params, function(err, dbData) {
        if (err) {
            return callback(err);
        }

        if (us.size(dbData) === 0) {
            return callback(new Error('Cannot find config "' + name + '"'));
        }

        return callback(null, dbData.Item);
    });
};

module.exports = Config;