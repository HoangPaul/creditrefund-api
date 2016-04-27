var assert = require('chai').assert;

var testContext = {
    dbDriver: require('app/db-driver/aws-db')
};

describe('Payout Helper', function() {
    this.timeout(0);
    describe('payout helper isEnabled', function() {
        it('should load payout and return true for enabled payout', function(done) {
            var PayoutGenericHelper = require('app/payout/helper');

            var payoutHelper = new PayoutGenericHelper(testContext);
            var testPayoutOption = 'paypal_test_enabled';

            payoutHelper.isEnabledGeneric(testPayoutOption, function(err, isEnabled) {
                if (err) {
                    throw err;
                }

                assert.isTrue(isEnabled);
                done();
            });
        });

        it('should load payout and return false for enabled payout', function(done) {
            var PayoutGenericHelper = require('app/payout/helper');

            var payoutHelper = new PayoutGenericHelper(testContext);
            var testPayoutOption = 'paypal_test_disabled';

            payoutHelper.isEnabledGeneric(testPayoutOption, function (err, isEnabled) {
                if (err) {
                    throw err;
                }

                assert.isFalse(isEnabled);
                done();
            });
        });

        it('should return error if payout does not exist', function(done) {
            var PayoutGenericHelper = require('app/payout/helper');

            var payoutHelper = new PayoutGenericHelper(testContext);
            var testPayoutOption = 'non-existent-payout-option';

            payoutHelper.isEnabledGeneric(testPayoutOption, function(err, isEnabled) {
                assert.isNotNull(err);
                done();
            });
        });
    });

    describe('payout helper isValidData', function() {
        it('should return successfully on exact same data as required', function(done) {
            var PayoutGenericHelper = require('app/payout/helper');

            var payoutHelper = new PayoutGenericHelper(testContext);
            var testPayoutOption = 'paypal_test_enabled';
            var data = {
                'a': 'asdasd',
                'b': 'qweqweq',
                'c': 'zxczxcz'
            };
            var required = ['a', 'b', 'c'];

            var result = payoutHelper.isValidDataGeneric(testPayoutOption, data, required);

            assert.isFalse(result.hasErrors());
            assert.isArray(result.getErrors());
            assert.lengthOf(result.getErrors(), 0);
            done();
        });

        it('should return successfully on more data than required', function(done) {
            var PayoutGenericHelper = require('app/payout/helper');

            var payoutHelper = new PayoutGenericHelper(testContext);
            var testPayoutOption = 'paypal_test_enabled';
            var data = {
                'a': 'asdasd',
                'b': 'qweqweq',
                'c': 'zxczxcz',
                'd': 'werwer'
            };
            var required = ['a', 'b', 'c'];

            var result = payoutHelper.isValidDataGeneric(testPayoutOption, data, required);

            assert.isFalse(result.hasErrors());
            assert.isArray(result.getErrors());
            assert.lengthOf(result.getErrors(), 0);
            done();
        });

        it('should return errors on data not present in required', function(done) {
            var PayoutGenericHelper = require('app/payout/helper');

            var payoutHelper = new PayoutGenericHelper(testContext);
            var testPayoutOption = 'paypal_test_enabled';
            var data = {
                'a': 'asdasd',
                'b': 'qweqweq'
            };
            var required = ['a', 'b', 'c'];

            var result = payoutHelper.isValidDataGeneric(testPayoutOption, data, required);

            assert.isTrue(result.hasErrors());
            assert.isArray(result.getErrors());
            assert.lengthOf(result.getErrors(), 1);
            done();
        });

        it('should return errors on empty data and some required', function(done) {
            var PayoutGenericHelper = require('app/payout/helper');

            var payoutHelper = new PayoutGenericHelper(testContext);
            var testPayoutOption = 'paypal_test_enabled';
            var data = {};
            var required = ['a', 'b', 'c'];

            var result = payoutHelper.isValidDataGeneric(testPayoutOption, data, required);

            assert.isTrue(result.hasErrors());
            assert.isArray(result.getErrors());
            assert.lengthOf(result.getErrors(), 3);
            done();
        });

        it('should return successfully on some data and empty required', function(done) {
            var PayoutGenericHelper = require('app/payout/helper');

            var payoutHelper = new PayoutGenericHelper(testContext);
            var testPayoutOption = 'paypal_test_enabled';
            var data = {
                'a': 'asdasd',
                'b': 'qweqweq'
            };
            var required = [];

            var result = payoutHelper.isValidDataGeneric(testPayoutOption, data, required);

            assert.isFalse(result.hasErrors());
            assert.isArray(result.getErrors());
            assert.lengthOf(result.getErrors(), 0);
            done();
        });
    });
});