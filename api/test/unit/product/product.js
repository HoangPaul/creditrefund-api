var assert = require('chai').assert;

var testContext = require('../../testContext');

describe('Product', function() {
    it('should load product if exists in database', function(done) {
        var Product = require('app/product/product');

        Product.load(testContext, '200', function(err, product) {
            if (err) {
                throw err;
            }

            assert.equal(200, product.getValue());
            done();
        });
    });
});