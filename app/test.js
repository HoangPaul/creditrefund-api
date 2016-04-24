var Pin = require('pinjs');
var pin = Pin.setup({
    key : 'AFhAptuFLfbKtU8V20qgWw',
    production: false
});

var context = {
    dbDriver: require('app/db-driver/aws-db'),
    config: {
        PAYOUT: 60,
        ADMIN: 10,
        GOOGLE: 30,
        IS_SENDABLE: true
    },
    payoutMessages: {}, // pinjs
    processor: {
        pin: pin,
        paypal: {}
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