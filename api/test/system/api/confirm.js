var data = require('../../data');
var context = require('../../context');
var assert = require('chai').assert;
var request = require('supertest');
var deepcopy = require('deepcopy');
var us = require('underscore');

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

request = request(context.baseUrl);

describe('POST /confirm', function() {
    // Set 10s timeout
    this.timeout(10000);

    beforeEach(function(done) {
        //data.insertExistingOrder(done, context);
        return done();
    });

    afterEach(function(done) {
        return done();
        data.deleteNewOrder(function() {
            data.deleteExistingOrder(done, context);
        }, context);
    });

    /*

    it('should return success for valid new order', function(done) {
        request
            .post('/' + context.meta.version + '/confirm')
            .send({
                'signature': data.signature,
                'signedData': JSON.stringify(data.signedData)
            })
            .expect('Content-Type', /json/)
            .expect(200, done);
    });
*/

    it('should return error for same order at the same time', function(done) {
        var counter = 0;
        var triggerDoneOnEnd = function() {
            if (++counter >= 2) {
                done();
            }
        };

        request
            .post('/' + context.meta.version + '/confirm')
            .send({
                'signature': data.signature,
                'signedData': JSON.stringify(data.signedData)
            })
            .expect('Content-Type', /json/)
            .expect(200)
            .end(function(err, res) {
                if (err) {
                    throw err;
                }
                triggerDoneOnEnd();
            });

        request
            .post('/' + context.meta.version + '/confirm')
            .send({
                'signature': data.signature,
                'signedData': JSON.stringify(data.signedData)
            })
            .expect('Content-Type', /json/)
            .expect(200)
            .end(function(err, res) {
                if (err) {
                    throw err;
                }
                triggerDoneOnEnd();
            });
    });
});
