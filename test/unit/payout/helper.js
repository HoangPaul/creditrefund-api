var assert = require('chai').assert;

var context = require('../../context');
var data = require('../../data');

describe('Payout Helper', function() {
    this.timeout(0);

    var enabledPayoutOption = data.enabledPayoutOptionId;
    var disabledPayoutOption = data.disabledPayoutOptionId;

    before(function(done) {
        data.addPayoutOptions(done, context);
    });
    after(function(done) {
        data.removePayoutOptions(done, context);
    });

    describe('payout helper isEnabled', function() {
        it('should load payout and return true for enabled payout', function(done) {
            var PayoutGenericHelper = require('app/payout/helper');

            var payoutHelper = new PayoutGenericHelper(context);

            payoutHelper.isEnabled(enabledPayoutOption, function(err, isEnabled) {
                if (err) {
                    throw err;
                }

                assert.isTrue(isEnabled);
                done();
            });
        });

        it('should load payout and return false for disabled payout', function(done) {
            var PayoutGenericHelper = require('app/payout/helper');

            var payoutHelper = new PayoutGenericHelper(context);

            payoutHelper.isEnabled(disabledPayoutOption, function (err, isEnabled) {
                if (err) {
                    throw err;
                }

                assert.isFalse(isEnabled);
                done();
            });
        });

        it('should return error if payout does not exist', function(done) {
            var PayoutGenericHelper = require('app/payout/helper');

            var payoutHelper = new PayoutGenericHelper(context);

            payoutHelper.isEnabled('non-existent-payout-option', function(err, isEnabled) {
                assert.isNotNull(err);
                done();
            });
        });
    });

    describe('payout helper isValidData', function() {
        it('should return successfully on exact same data as required', function(done) {
            var PayoutGenericHelper = require('app/payout/helper');

            var payoutHelper = new PayoutGenericHelper(context);
            var data = {
                'a': 'asdasd',
                'b': 'qweqweq',
                'c': 'zxczxcz'
            };
            var required = ['a', 'b', 'c'];

            var result = payoutHelper.hasRequiredData(data, required);

            assert.isFalse(result.hasErrors());
            assert.isArray(result.getErrorMessages());
            assert.lengthOf(result.getErrorMessages(), 0);
            done();
        });

        it('should return successfully on more data than required', function(done) {
            var PayoutGenericHelper = require('app/payout/helper');

            var payoutHelper = new PayoutGenericHelper(context);
            var data = {
                'a': 'asdasd',
                'b': 'qweqweq',
                'c': 'zxczxcz',
                'd': 'werwer'
            };
            var required = ['a', 'b', 'c'];

            var result = payoutHelper.hasRequiredData(data, required);

            assert.isFalse(result.hasErrors());
            assert.isArray(result.getErrorMessages());
            assert.lengthOf(result.getErrorMessages(), 0);
            done();
        });

        it('should return errors on data not present in required', function(done) {
            var PayoutGenericHelper = require('app/payout/helper');

            var payoutHelper = new PayoutGenericHelper(context);
            var data = {
                'a': 'asdasd',
                'b': 'qweqweq'
            };
            var required = ['a', 'b', 'c'];

            var result = payoutHelper.hasRequiredData( data, required);

            assert.isTrue(result.hasErrors());
            assert.isArray(result.getErrorMessages());
            assert.lengthOf(result.getErrorMessages(), 1);
            done();
        });

        it('should return errors on empty data and some required', function(done) {
            var PayoutGenericHelper = require('app/payout/helper');

            var payoutHelper = new PayoutGenericHelper(context);
            var data = {};
            var required = ['a', 'b', 'c'];

            var result = payoutHelper.hasRequiredData(data, required);

            assert.isTrue(result.hasErrors());
            assert.isArray(result.getErrorMessages());
            assert.lengthOf(result.getErrorMessages(), 3);
            done();
        });

        it('should return successfully on some data and empty required', function(done) {
            var PayoutGenericHelper = require('app/payout/helper');

            var payoutHelper = new PayoutGenericHelper(context);
            var data = {
                'a': 'asdasd',
                'b': 'qweqweq'
            };
            var required = [];

            var result = payoutHelper.hasRequiredData(data, required);

            assert.isFalse(result.hasErrors());
            assert.isArray(result.getErrorMessages());
            assert.lengthOf(result.getErrorMessages(), 0);
            done();
        });
    });
});