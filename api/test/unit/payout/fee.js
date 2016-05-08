var assert = require('chai').assert;
var us = require('underscore');

var testContext = {
    'dbDriver': require('app/db-driver/aws-db')
};

describe('Fee', function() {
    it('should load fees from database', function(done) {
        var PayoutFeeCollection = require('app/payout/fee/collection');

        PayoutFeeCollection.load(testContext, function(err, fees) {
            if (err) {
                throw err;
            }

            assert.instanceOf(fees, PayoutFeeCollection);

            done();
        });
    });

    it('should get mandatory fees from collection', function(done) {
        var PayoutFeeCollection = require('app/payout/fee/collection');

        PayoutFeeCollection.load(testContext, function(err, fees) {
            if (err) {
                throw err;
            }
            
            var mandatoryFees = fees.getMandatoryFees();

            assert.property(mandatoryFees, 'google');
            assert.property(mandatoryFees, 'creditrefund');

            us.each(mandatoryFees, function(feeObject) {
                assert.property(feeObject, 'code');
                assert.property(feeObject, 'title');
                assert.property(feeObject, 'flat');
                assert.property(feeObject, 'mandatory');
                assert.property(feeObject, 'percent');
            });

            done();
        });
    });

    it('should get named fee from collection', function(done) {
        var PayoutFeeCollection = require('app/payout/fee/collection');

        PayoutFeeCollection.load(testContext, function(err, fees) {
            if (err) {
                throw err;
            }

            var paypalFee = fees.getFeeByCode('paypal');

            assert.property(paypalFee, 'code');
            assert.property(paypalFee, 'title');
            assert.property(paypalFee, 'flat');
            assert.property(paypalFee, 'mandatory');
            assert.property(paypalFee, 'percent');

            done();
        });
    });
});