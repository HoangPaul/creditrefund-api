var us = require('underscore');
var async = require('async');

var TABLE_NAME = 'blacklist';

/**
 * @param {{dbDriver: object}} context
 * @constructor
 */
function Blacklist(context) {
    this.context = context;
}

/**
 * @param {string[]} hashes
 * @param {function(?object, boolean=)} callback
 */
Blacklist.prototype.hasBlacklistedData = function(hashes, callback) {
    var self = this;
    var checkIfHashExists = function(hash, callback) {
        var params = {
            TableName: TABLE_NAME,
            Key: {
                "id": hash
            }
        };

        self.context.dbDriver.get(params, function(err, dbData) {
            if (err) {
                return callback(err);
            }

            if (us.size(dbData) === 0) {
                return callback(null, false);
            } else {
                return callback(new Error('The following hash is present in the blacklist: "' + hash + '"'));
            }
        });
    };
    async.map(hashes, checkIfHashExists, function(err, results) {
        if (err) {
            return callback(err);
        }

        var atLeastOneHashExists = us.reduce(results, function(memo, result) {
            return memo || result;
        });

        return callback(null, atLeastOneHashExists);
    });
};

module.exports = Blacklist;