var PayoutValue = require('customer/payout-value');

var PAYOUT_OPTION = 'paypal';

/**
 * @param {{dbDriver: object, processor: object}} context
 * @param {object} helper
 * @constructor
 */
function Paypal(context, helper) {
    this.context = context;
    this.helper = helper;
}

/**
 * @param function(?object, boolean=) callback
 */
Paypal.prototype.isEnabled = function(callback) {
    return this.helper.isEnabled(PAYOUT_OPTION, callback);
};

/**
 * @param {{email: string}} data
 * @return {ValidationResult}
 */
Paypal.prototype.isValidData = function(data) {
    return this.helper.isValidData(PAYOUT_OPTION, data, ['email']);
};

/**
 * @param {Order} order
 * @param {PayoutValue} payoutValue
 * @param {function(?Error, object=) callback
 */
Paypal.prototype.sendPayment = function(order, payoutValue, callback) {
    var syncMode = 'true';
    var payoutObject = {
        'sender_batch_header': {
            'sender_batch_id': order.getOrderId(),
            'email_subject': that.context.payoutMessages.REFERENCE_NUMBER_TEMPLATE(order.getOrderId()),
        },
        'items': [{
            'recipient_type': 'EMAIL',
            'amount': {
                'value': payoutValue.getValue(PayoutValue.DOLLARS),
                'currency': 'AUD'
            },
            'receiver': order.getEmail(),
            'note': that.context.payoutMessages.REFERENCE_NUMBER_TEMPLATE(order.getOrderId()),
            'sender_item_id': order.getSignedData.productId,
        }]
    };

    paypal.payout.create(payoutObject, syncMode, callback);
}

module.exports = Paypal;
