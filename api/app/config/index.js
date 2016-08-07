var us = require('underscore');

var TABLE_NAME = 'config';

/**
 * {Object} dbDriver
 * @constructor
 */
function Config(dbDriver, name) {
    this.dbDriver = dbDriver;
    this.name = name;
}

/**
 * @param {string} name
 * @param {function(?object {name: string, value: (string|number)}=)} callback
 */
Config.prototype.get = function(name, callback) {
    var self = this;
    var _getConfig = function(name, callback) {
        if (typeof self.config[name] === 'undefined') {
            return callback(new Error('Cannot find config "' + name + '"'));
        } else {
            return callback(null, self.config[name]);
        }
    };

    if (typeof this.config === 'undefined') {
        var params = {
            TableName: TABLE_NAME,
            Key: {
                'name': this.name
            }
        };

        this.dbDriver.get(params, function(err, dbData) {
            if (err) {
                return callback(err);
            }

            if (us.size(dbData) === 0) {
                return callback(new Error('Cannot find config collection "' + self.name + '"'));
            }

            self.config = dbData.Item.config;

            return _getConfig(name, callback);
        });
    } else {
        return _getConfig(name, callback);
    }
};

module.exports = Config;