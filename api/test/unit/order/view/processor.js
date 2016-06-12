var assert = require('chai').assert;
var us = require('underscore');

var testContext = require('../../../testContext');
var testExistingOrderId = 'GPA.1388-5239-3663-97011'; //'GPA.1361-0852-2559-97342';

var Order = require('app/order/order');
var OrderViewProcessor = require('app/order/view/processor');

describe('Order View Processor', function() {
    it('should output email subject', function(done) {
        Order.load(testContext, testExistingOrderId, function(err, order) {
            if (err) {
                throw err;
            }

            var subject = OrderViewProcessor.getSubject(order);

            assert.isString(subject);
            assert.include(subject, testExistingOrderId);
            done();
        });
    });
    it('should output text email', function(done) {
        Order.load(testContext, testExistingOrderId, function(err, order) {
            if (err) {
                throw err;
            }

            var output = OrderViewProcessor.processTextNewOrderEmail(order);

            console.log(output);

            assert.isString(output);
            assert.isAtLeast(output.length, 100);
            done();
        });
    });
});