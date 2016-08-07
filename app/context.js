var isProduction = process.env.CR_IS_PRODUCTION === 'true';

// Load DB
var AWS = require("aws-sdk");
var dynamoDb = new AWS.DynamoDB.DocumentClient({
    'accessKeyId': process.env.DYNAMODB_ACCESS_KEY_ID,
    'secretAccessKey': process.env.DYNAMODB_SECRET_ACCESS_KEY,
    'region': process.env.DYNAMODB_REGION,
    'endpoint': process.env.DYNAMODB_ENDPOINT
});

// Load in-app-purchase processor
var iap = require('in-app-purchase');
iap.config({
    googlePublicKeyStrSandbox: process.env.IAP_GOOGLE_PUBLIC_KEY,
    googlePublicKeyStrLive: process.env.IAP_GOOGLE_PUBLIC_KEY
});
var IapProcessor = require('app/iap');
var iapProcessor = new IapProcessor(iap);

// Load mailer
var nodemailer = require('nodemailer');
var mailTransporter = nodemailer.createTransport({
    transport: process.env.CR_MAIL_TRANSPORT,
    accessKeyId: process.env.SES_ACCESS_KEY_ID,
    secretAccessKey: process.env.SES_SECRET_ACCESS_KEY,
    region: process.env.SES_REGION
});

// Load processor - Pin Payments
var Pin = require('pinjs');
var pin = Pin.setup({
    key : process.env.PAYOUT_VENDOR_PIN_KEY,
    production: isProduction
});

// Load processor - PayPal Mass Payments
var PaypalMassPayments = require('lib/paypal-mass-payments');
var paypalMassPayments = new PaypalMassPayments({
    "user": process.env.PAYOUT_VENDOR_PAYPAL_MASS_PAYMENTS_USER,
    "pwd": process.env.PAYOUT_VENDOR_PAYPAL_MASS_PAYMENTS_PWD,
    "signature": process.env.PAYOUT_VENDOR_PAYPAL_MASS_PAYMENTS_SIGNATURE,
    "isProduction": isProduction
});

// Config
var Config = require('app/config');
var config = new Config(dynamoDb, 'latest');

// Stats
var Stats = require('app/stats');
var stats = new Stats(dynamoDb, 'latest');

var context = {
    'baseUrl': process.env.CR_BASE_URL,
    'dbDriver': dynamoDb,
    'iapProcessor': iapProcessor,
    'mailer': mailTransporter,
    'processor': {
        'pin': pin,
        'paypalMassPayments': paypalMassPayments
    },
    'config': config,
    'stats': stats
};

require('app/neuterContext')(context);

context['meta'] = {
    'version': 'v1',
    'isProduction': isProduction ? 'true' : 'false',
    'isNeutered': process.env.CR_TEST_MODE === 'true',
    'configCollectionName': context.config.name,
    'statCollectionName': context.stats.name
};

module.exports = context;
