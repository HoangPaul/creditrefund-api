var context = {
    dbDriver: require('app/db-driver/aws-db'),
    config: {
        PAYOUT: 60,
        ADMIN: 10,
        GOOGLE: 30,
        IS_SENDABLE: true
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