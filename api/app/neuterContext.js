module.exports = function(oldContext) {
    oldContext.processor.pin.createTransfer = function(_, callback) {
        return callback(null, true);
    };

    oldContext.processor.paypalMassPayments.send = function(_, callback) {
        return callback(null, {
            'ACK': 'Success'
        });
    };

    oldContext.iapProcessor.processGoogleOrder = function(signedData, signature, callback) {
        return callback(null, signedData);
    };

    // Config
    var Config = require('app/config');
    oldContext.config = new Config(oldContext.dbDriver, 'test');

    // Stats
    var Stats = require('app/stats');
    oldContext.stats = new Stats(oldContext.dbDriver, 'test');

    // Order Backlog
    var OrderBacklog = require('app/order/backlog');
    oldContext.orderBacklog = new OrderBacklog(oldContext.dbDriver, 'testOrderBacklog');

    return oldContext;
};