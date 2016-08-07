var deepcopy = require('deepcopy');
var crypto = require('crypto');

var testData = {
    "developerPayload": {
        "email": "asdasd@example.com",
        "payoutOption": "paypal"
    },
    "email": "paulkhoahoang@gmail.com",
    "hasError": false,
    "isProcessed": false,
    "orderId": "7e969dd401f331f85d2ac781",
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
    "signedData": {
        "developerPayload": "{\"payoutOption\":\"paypal\",\"email\":\"asdasd@example.com\"}",
        "orderId": "GPA.1381-2217-5598-52491",
        "packageName": "marionettelabs.creditrefund",
        "productId": "100",
        "purchaseState": 0,
        "purchaseTime": 1465792163783,
        "purchaseToken": "imlccbhdjkghjcekdkicdacp.AO-J1OzjA2lnw9IFCeppAaGaBTA6WuW0eYa_kvkLuNp_isCOjityv3841evQneLvqnF9hX4xHEDD3qK_2UDGNfqK5kb37zHWkMTBpRic83mTiXsEo2A3CZF9tdv7KbywXGs1JhBIxRdK"
    },
    "timestamp": 1465792169186
};

var newOrderId = crypto.randomBytes(32).toString('hex');
var newOrderData = deepcopy(testData);
newOrderData['orderId'] = newOrderId;
var existingOrderId = crypto.randomBytes(32).toString('hex');
var existingOrderData = deepcopy(testData);
existingOrderData['orderId'] = existingOrderId;

module.exports = {
    // Order
    'newOrderId': newOrderId,
    'newOrderData': newOrderData,
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
    'configName': crypto.randomBytes(32).toString('hex'),
    'configValue': crypto.randomBytes(32).toString('hex'),
    'newConfigName': crypto.randomBytes(32).toString('hex'),
    'addConfig': function(done, context) {
        context.dbDriver.batchWrite({
            'RequestItems': {
                'config': [
                    {
                        'PutRequest': {
                            'Item': {
                                'name': module.exports.configName,
                                'value': module.exports.configValue
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
                                'name': module.exports.configName
                            }
                        }
                    },
                    {
                        'DeleteRequest': {
                            'Key': {
                                'name': module.exports.newConfigName
                            }
                        }
                    }
                ]
            }
        }, done);
    },

    // Stats
    'statName': crypto.randomBytes(32).toString('hex'),
    'statValue': Math.floor(Math.random() * 100),
    'newStatName': crypto.randomBytes(32).toString('hex'),
    'addStat': function(done, context) {
        context.dbDriver.batchWrite({
            'RequestItems': {
                'stats': [
                    {
                        'PutRequest': {
                            'Item': {
                                'name': module.exports.statName,
                                'value': module.exports.statValue
                            }
                        }
                    }
                ]
            }
        }, done);
    },
    'deleteStat': function(done, context) {
        context.dbDriver.batchWrite({
            'RequestItems': {
                'stats': [
                    {
                        'DeleteRequest': {
                            'Key': {
                                'name': module.exports.statName
                            }
                        }
                    },
                    {
                        'DeleteRequest': {
                            'Key': {
                                'name': module.exports.newStatName
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