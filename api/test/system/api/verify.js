var context = require('../../context');
var data = require('../../data');
var assert = require('chai').assert;
var request = require('supertest');
var deepcopy = require('deepcopy');
var us = require('underscore');

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

request = request(context.baseUrl);

describe('POST /verify', function() {
    // Set 10s timeout
    this.timeout(10000);

    it('should return success for valid (int) productId', function(done) {
        request
            .post('/' + context.meta.version + '/verify')
            .send({
                'productId': 100,
                'email': data.uniqueEmail,
                'payoutOption': 'paypal',
                'deviceId': data.uniqueDeviceId,
            })
            .expect('Content-Type', /json/)
            .expect(200, done);
    });

    it('should return success for valid string productId', function(done) {
        request
            .post('/' + context.meta.version + '/verify')
            .send({
                'productId': '100',
                'email': data.uniqueEmail,
                'payoutOption': 'paypal',
                'deviceId': data.uniqueDeviceId,
            })
            .expect('Content-Type', /json/)
            .expect(200, done);
    });

    it('should return error for invalid productId', function(done) {
        request
            .post('/' + context.meta.version + '/verify')
            .send({
                'productId': 'some_invalid_product_id',
                'email': data.uniqueEmail,
                'payoutOption': 'paypal',
                'deviceId': data.uniqueDeviceId
            })
            .expect('Content-Type', /json/)
            .expect(/We cannot convert this value/)
            .expect(function(res) {
                assert.equal(res.body.status, 4004);
                assert.property(res.body, 'message');
            })
            .expect(400, done);
    });

    it('should return error for invalid email', function(done) {
        request
            .post('/' + context.meta.version + '/verify')
            .send({
                'productId': '100',
                'email': 'non-valid-email',
                'payoutOption': 'paypal',
                'deviceId': data.uniqueDeviceId
            })
            .expect('Content-Type', /json/)
            .expect(/Malformed email/)
            .expect(function(res) {
                assert.equal(res.body.status, 4002);
                assert.property(res.body, 'message');
            })
            .expect(400, done);
    });

    it('should return error for missing productId, email, payoutOption or deviceId', function(done) {
        var requiredParams = [
            'productId',
            'email',
            'payoutOption',
            'deviceId'
        ];

        var origParams = {
            'productId': 100,
            'email': data.uniqueEmail,
            'payoutOption': 'paypal',
            'deviceId': data.uniqueDeviceId
        };

        var counter = 0;
        us.each(requiredParams, function(param) {
            var params = deepcopy(origParams);
            delete params[param];

            request
                .post('/' + context.meta.version + '/verify')
                .send(params)
                .expect('Content-Type', /json/)
                .expect(new RegExp("Missing required field '" + param + "'"))
                .expect(400, function() {
                    if (++counter >= requiredParams.length) {
                        done();
                    }
                });
        });
    });
});
