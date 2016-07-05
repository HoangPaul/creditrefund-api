var assert = require('chai').assert;

var context = require('../../../context');
var data = require('../../../data');
var existingOrderId = data.existingOrderId;

var Order = require('app/order/order');
var OrderViewProcessor = require('app/order/view/processor');

describe('Order View Processor', function() {
    // Set up all existing orders in database
    beforeEach(function(done) {
        data.insertExistingOrder(done, context);
    });

    it('should output email subject', function(done) {
        Order.load(context, existingOrderId, function(err, order) {
            if (err) {
                throw err;
            }

            var subject = OrderViewProcessor.getSubject(order);

            assert.isString(subject);
            assert.include(subject, existingOrderId);
            done();
        });
    });
    it('should output text email', function(done) {
        Order.load(context, existingOrderId, function(err, order) {
            if (err) {
                throw err;
            }

            var output = OrderViewProcessor.processTextNewOrderEmail(order);

            assert.isString(output);
            assert.isAtLeast(output.length, 100);
            done();
        });
    });
});