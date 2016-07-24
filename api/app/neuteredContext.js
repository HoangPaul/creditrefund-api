var context = require('app/context');
var deepcopy = require('deepcopy');

context.processor.pin.createTransfer = function(_, callback) {
    return callback(null, true);
};

context.processor.paypalMassPayments.send = function(_, callback) {
    return callback(null, true);
};

context.meta.isNeutered = 'true';

module.exports = context;