var assert = require('chai').assert;
var context = require('../../context');
var data = require('../../data');
var Config = require('app/config');

describe('Config', function() {
    beforeEach(function(done) {
        data.addConfig(done, context);
    });

    afterEach(function(done) {
        data.deleteConfig(done, context);
    });

    it('should retrieve existing config', function(done) {
        Config.get(context, data.configName, function(err, config) {
            if (err) {
                throw err;
            }
            assert.equal(config.name, data.configName);
            assert.equal(config.value, data.configValue);
            done();
        });
    });
    
    it('should throw error when trying to retrieve non-existent config', function(done) {
        Config.get(context, data.newConfigName, function(err, config) {
            assert.instanceOf(err, Error);
            assert.isUndefined(config);
            done();
        });
    });
});