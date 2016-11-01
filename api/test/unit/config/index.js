var assert = require('chai').assert;
var context = require('../../context');
var data = require('../../data');
var Config = require('app/config');
var crypto = require('crypto');

describe('Config', function() {
    this.timeout(10000);
    beforeEach(function(done) {
        data.addConfig(done, context);
    });

    afterEach(function(done) {
        data.deleteConfig(done, context);
    });

    it('should retrieve existing config', function(done) {
        var config = new Config(context.dbDriver, data.configCollectionName);
        config.get(data.configName, function(err, configValue) {
            if (err) {
                throw err;
            }
            assert.equal(configValue, data.configValue);
            done();
        });
    });
    
    it('should throw error when trying to retrieve non-existent config', function(done) {
        var config = new Config(context.dbDriver, data.configCollectionName);
        config.get(data.newConfigName, function(err, configValue) {
            assert.instanceOf(err, Error);
            assert.isUndefined(configValue);
            done();
        });
    });

    it('should used cached value', function(done) {
        var config = new Config(context.dbDriver, data.configCollectionName);
        config.get(data.configName, function(err, configValue) {
            if (err) {
                throw err;
            }

            assert.equal(configValue, data.configValue);

            var someRandomValue = crypto.randomBytes(32).toString('hex');
            data.editConfig(context, someRandomValue, function() {
                // We need to confirm if the random config has been set
                var someOtherConfig = new Config(context.dbDriver, data.configCollectionName);
                someOtherConfig.get(data.configName, function(err, randomConfigValue) {
                    if (err) {
                        throw err;
                    }
                    assert.equal(someRandomValue, randomConfigValue);

                    // Now we check if we're using a cached value
                    config.get(data.configName, function(err, newConfigValue) {
                        if (err) {
                            throw err;
                        }
                        assert.equal(configValue, newConfigValue);
                        done();
                    });
                });
            });
        });
    });
});