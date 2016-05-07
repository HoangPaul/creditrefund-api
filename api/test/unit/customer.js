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

describe('Customer', function() {
    it('should load customer if exists in database', function(done) {
        var Customer = require('app/customer/customer');

        Customer.load(testContext, 'asd@asd.com', function(err, customer) {
            if (err) {
                throw err;
            }

            assert.equal('asd@asd.com', customer.getEmail());
            done();
        });
    });
});