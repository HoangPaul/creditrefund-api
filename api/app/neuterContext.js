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

    return oldContext;
};