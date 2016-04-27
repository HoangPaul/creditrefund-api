var PayoutGenericHelper = require('app/payout/helper');

var context = {
    dbDriver: require('app/db-driver/aws-db'),
    config: {
        PAYOUT: 60,
        ADMIN: 10,
        GOOGLE: 30,
        IS_SENDABLE: true
    },
    payoutMessages: {
        REFERENCE_NUMBER_TEMPLATE: function() {/* todo */}
    },
    processor: {
        pin: {
            adapter: pin,
            isEnabled: PayoutGenericHelper.isEnabled, // todo: fix this
            isValidData: PayoutGenericHelper.isValidData // todo: fix this
        },
        paypal: {
            adapter: paypal,
            isEnabled: PayoutGenericHelper.isEnabled, // todo: fix this
            isValidData: PayoutGenericHelper.isValidData // todo: fix this
        }
    }
};

var Customer = require('app/customer/customer');

Customer.load(context, 'asd@asd.com', function(err, customer) {
    if (err) {
        throw err;
    }

    console.log('customer email is ');
    console.log(customer);
});