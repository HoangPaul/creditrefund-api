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
    it('should calculate the correct payouts', function(done) {
        var Customer = require('app/customer/customer');

        Customer.load(testContext, 'asd@asd.com', function(err, customer) {
            if (err) {
                throw err;
            }

            var PayoutValue = require('app/customer/payout-value');
            var totalAmount = 100;

            var customerPayout = customer.calculatePayoutValue(totalAmount, PayoutValue.DOLLARS);
            var adminPayout = customer.calculateAdminValue(totalAmount, PayoutValue.DOLLARS);
            var googlePayout = customer.calculateGoogleValue(totalAmount, PayoutValue.DOLLARS);

            assert.equal('0.00', customerPayout.getValue(PayoutValue.DOLLARS));
            assert.equal('30.00', googlePayout.getValue(PayoutValue.DOLLARS));
            assert.equal('70.00', adminPayout.getValue(PayoutValue.DOLLARS));

            done();
        });
    })
});