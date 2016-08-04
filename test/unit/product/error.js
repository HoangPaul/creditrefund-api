var assert = require('chai').assert;
var ProductError = require('app/product/error');
var VisibleError = require('app/error/visible');

describe('ProductError', function() {
    var err = new ProductError('Some string');
    it('should be an instance of Error', function() {
        assert.instanceOf(err, Error);
    });
    it('should be an instance of VisibleError', function() {
        assert.instanceOf(err, VisibleError);
    });
    it('should have the relevant properties', function() {
        assert.property(err, 'name');
        assert.property(err, 'stack');
        assert.property(err, 'message');
        assert.property(err, 'errorCode');
    });
    it('should have the correct property values', function() {
        assert.equal(4004, err.errorCode);
        assert.equal('ProductError', err.name);
    });
});