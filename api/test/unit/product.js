var assert = require('chai').assert;

var testContext = {
    dbDriver: require('app/db-driver/aws-db'),
    config: {
        PAYOUT: 60,
        ADMIN: 10,
        GOOGLE: 30,
        IS_SENDABLE: true
    }
};

describe('Product', function() {
    it('should load product if exists in database', function(done) {
        var Product = require('app/product/product');

        Product.load(testContext, '2.00', function(err, product) {
            if (err) {
                throw err;
            }

            assert.equal(2.00, product.getValue());
            done();
        });
    });
});