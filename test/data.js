var deepcopy = require('deepcopy');
var crypto = require('crypto');

    var newOrderId = crypto.randomBytes(8).toString('hex');

var testSignedData = {
    "developerPayload": "{\"payoutOption\":\"paypal\",\"email\":\"asdasd@example.com\"}",
    "orderId": newOrderId,
    "packageName": "marionettelabs.creditrefund",
    "productId": "100",
    "purchaseState": 0,
    "purchaseTime": 1465792163783,
    "purchaseToken": "imlccbhdjkghjcekdkicdacp.AO-J1OzjA2lnw9IFCeppAaGaBTA6WuW0eYa_kvkLuNp_isCOjityv3841evQneLvqnF9hX4xHEDD3qK_2UDGNfqK5kb37zHWkMTBpRic83mTiXsEo2A3CZF9tdv7KbywXGs1JhBIxRdK"
};

var testOrderData = {
    "developerPayload": {
        "email": "asdasd@example.com",
        "payoutOption": "paypal"
    },
    "email": "paulkhoahoang@gmail.com",
    "hasError": false,
    "isProcessed": false,
    "orderId": newOrderId,
    "quote": {
        "Google Play Store fee": {
            "value": "30"
        },
        "Payout": {
            "value": "56.6"
        },
        "Paypal fee": {
            "value": "1.4"
        },
        "Processing fee": {
            "value": "12"
        },
        "Total": {
            "value": "100"
        }
    },
    "signedData": testSignedData,
    "timestamp": 1465792169186
};

var existingOrderId = crypto.randomBytes(8).toString('hex');
var existingOrderData = deepcopy(testOrderData);
existingOrderData.orderId = existingOrderId;
existingOrderData.signedData.orderId = existingOrderId;

module.exports = {
    // Confirm API
    'signature': crypto.randomBytes(8).toString('hex'),
    'signedData': testSignedData,

    // Order
    'newOrderId': newOrderId,
    'newOrderData': deepcopy(testOrderData),
    'existingOrderId': existingOrderId,
    'existingOrderData': existingOrderData,
    'insertExistingOrder': function(done, context) {
        context.dbDriver.put({
            'TableName': 'orders',
            'Key': {
                'orderId': existingOrderId
            },
            'Item': existingOrderData
        }, done);
    },
    'deleteExistingOrder': function(done, context) {
        context.dbDriver.delete({
            'TableName': 'orders',
            'Key': {
                'orderId': existingOrderId
            }
        }, done);
    },
    'deleteNewOrder': function(done, context) {
        context.dbDriver.delete({
            'TableName': 'orders',
            'Key': {
                'orderId': newOrderId
            }
        }, done);
    },

    // Payout
    'enabledPayoutOptionId': crypto.randomBytes(32).toString('hex'),
    'disabledPayoutOptionId': crypto.randomBytes(32).toString('hex'),
    'addPayoutOptions': function(done, context) {
        context.dbDriver.batchWrite({
            'RequestItems': {
                'payoutOptions': [
                    {
                        'PutRequest': {
                            'Item': {
                                'payoutOption': module.exports.enabledPayoutOptionId,
                                'isEnabled': true
                            }
                        }
                    },
                    {
                        'PutRequest': {
                            'Item': {
                                'payoutOption': module.exports.disabledPayoutOptionId,
                                'isEnabled': false
                            }
                        }
                    }
                ]
            }
        }, done);
    },
    'removePayoutOptions': function(done, context) {
        context.dbDriver.batchWrite({
            'RequestItems': {
                'payoutOptions': [
                    {
                        'DeleteRequest': {
                            'Key': {
                                'payoutOption': module.exports.enabledPayoutOptionId
                            }
                        }
                    },
                    {
                        'DeleteRequest': {
                            'Key': {
                                'payoutOption': module.exports.disabledPayoutOptionId
                            }
                        }
                    }
                ]
            }
        }, done);
    },
    // Config
    'configCollectionName': crypto.randomBytes(32).toString('hex'),
    'configName': crypto.randomBytes(32).toString('hex'),
    'configValue': crypto.randomBytes(32).toString('hex'),
    'newConfigName': crypto.randomBytes(32).toString('hex'),
    'addConfig': function(done, context) {
        var testConfig = {};
        testConfig[module.exports.configName] = module.exports.configValue;
        context.dbDriver.batchWrite({
            'RequestItems': {
                'config': [
                    {
                        'PutRequest': {
                            'Item': {
                                'name': module.exports.configCollectionName,
                                'config': testConfig
                            }
                        }
                    }
                ]
            }
        }, done);
    },
    'editConfig': function(context, value, done) {
        var testConfig = {};
        testConfig[module.exports.configName] = value;
        context.dbDriver.batchWrite({
            'RequestItems': {
                'config': [
                    {
                        'PutRequest': {
                            'Item': {
                                'name': module.exports.configCollectionName,
                                'config': testConfig
                            }
                        }
                    }
                ]
            }
        }, done);
    },
    'deleteConfig': function(done, context) {
        context.dbDriver.batchWrite({
            'RequestItems': {
                'config': [
                    {
                        'DeleteRequest': {
                            'Key': {
                                'name': module.exports.configCollectionName
                            }
                        }
                    }
                ]
            }
        }, done);
    },

    // Stats
    'statCollectionName': crypto.randomBytes(32).toString('hex'),
    'statName': crypto.randomBytes(32).toString('hex'),
    'statValue': Math.floor(Math.random() * 100),
    'newStatName': crypto.randomBytes(32).toString('hex'),
    'addStat': function(dbDriver, done) {
        var testStat = {};
        testStat[module.exports.statName] = module.exports.statValue;
        dbDriver.batchWrite({
            'RequestItems': {
                'stats': [
                    {
                        'PutRequest': {
                            'Item': {
                                'name': module.exports.statCollectionName,
                                'stats': testStat
                            }
                        }
                    }
                ]
            }
        }, done);
    },
    'editStat': function(dbDriver, name, value, done) {
        dbDriver.batchWrite({
            'RequestItems': {
                'stats': [
                    {
                        'PutRequest': {
                            'Item': {
                                'name': name,
                                'stats': value
                            }
                        }
                    }
                ]
            }
        }, done);
    },
    'deleteStat': function(dbDriver, done) {
        dbDriver.batchWrite({
            'RequestItems': {
                'stats': [
                    {
                        'DeleteRequest': {
                            'Key': {
                                'name': module.exports.statCollectionName
                            }
                        }
                    }
                ]
            }
        }, done);
    },

    // System test data
    'uniqueEmail': crypto.randomBytes(12).toString('hex') + '@example.com',
    'uniqueDeviceId': crypto.randomBytes(16).toString('hex') + '--' + crypto.randomBytes(16).toString('hex')
};