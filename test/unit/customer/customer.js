var assert = require('chai').assert;

var context = require('../../context');

describe('Customer', function() {
    it('should load customer if exists in database', function(done) {
        var Customer = require('app/customer/customer');

        Customer.load(context, 'asd@asd.com', function(err, customer) {
            if (err) {
                throw err;
            }

            assert.equal('asd@asd.com', customer.getEmail());
            done();
        });
    });

    it('should load non-sendable customer', function(done) {
        var Customer = require('app/customer/customer');

        Customer.load(context, 'asd@asd.com', function(err, customer) {
            if (err) {
                throw err;
            }

            assert.equal('asd@asd.com', customer.getEmail());
            assert.isFalse(customer.getIsSendable());
            done();
        });
    });

    it('should load sendable customer', function(done) {
        var Customer = require('app/customer/customer');

        Customer.load(context, 'qwe@qwe.com', function(err, customer) {
            if (err) {
                throw err;
            }

            assert.equal('qwe@qwe.com', customer.getEmail());
            assert.isTrue(customer.getIsSendable());
            done();
        });
    });
});