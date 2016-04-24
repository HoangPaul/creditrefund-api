var assert = require('chai').assert;

var testOrderId = 'GPA.1361-0852-2559-97342';
var testContext = {
    'dbDriver': require('app/db-driver/aws-db')
};

describe('hooks', function() {
    beforeEach('reset order database', function() {
        var params = {
            TableName: 'orders',
            Key: {
                email: 'GPA.1361-0852-2559-97342'
            },
            Item: {
                "developerPayload": {
                    "email": "marionette-labs-customer@gmail.com",
                    "payoutOption": "paypal"
                },
                "email": "marionette-labs-customer@gmail.com",
                "hasError": false,
                "isProcessed": false,
                "orderId": "GPA.1361-0852-2559-97342",
                "signedData": {
                    "developerPayload": "{\"payoutOption\":\"paypal\",\"email\":\"marionette-labs-customer@gmail.com\"}",
                    "orderId": "GPA.1361-0852-2559-97342",
                    "packageName": "hoangpaul.nihil",
                    "productId": "3.00",
                    "purchaseState": 0,
                    "purchaseTime": 1460373887080,
                    "purchaseToken": "onphmgpfdboobggggehnahph.AO-J1OxbaAQtKJbufm6lL4doAc4X27lEg8GKRkISzgRUwmfAeMiHUM8tq4Gql2586jlwMxMJ9CErm-GtqS5evNiJkj1JMfmiqw_Bd3pvQvzOnKkTmSx0-E8",
                    "service": "google",
                    "status": 0
                },
                "timestamp": 1460373890238,
                "payoutData": {
                    "email": "asd@asd.com",
                    "isSendable": true,
                    "percentages": {
                        "admin": 70,
                        "google": 30,
                        "payout": 0
                    }
                }
            }
        };
        testContext.dbDriver.put(params, function(err, a) {
            if (err) {
                console.log(err);
            }
        });
    });

    describe('Order', function () {
        it('should load order if exists in database', function (done) {
            var Order = require('app/order/order');

            Order.load(testContext, testOrderId, function (err, order) {
                if (err) {
                    throw err;
                }

                assert.equal(testOrderId, order.getOrderId());
                done();
            });
        });

        it('should flag an existing order as is_processed', function (done) {
            var Order = require('app/order/order');

            Order.load(testContext, testOrderId, function (err, order) {
                if (err) {
                    throw err;
                }

                assert.equal(false, order.getIsProcessed());

                order.setIsProcessed(true);

                assert.equal(true, order.getIsProcessed());

                order.save(function (saveErr, saveResult) {
                    if (saveErr) {
                        throw saveErr;
                    }

                    done();
                });
            });
        });
    });
});