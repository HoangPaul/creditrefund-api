var express = require('express');
var router = express.Router();

var defaults = require('./defaults');
var errors = require('./errors');
var payouts = require('./payouts');
var products = require('./products');
var orders = require('./orders');
var paypal = require('./paypal');
var iap = require('./iap');

var crypto = require('crypto');
var validator = require('validator');
var bunyan = require('bunyan');
var log = bunyan.createLogger({name : 'api'});
//var sleep = require('./sleep');

var connection = require('./mysql');

router.use(function(req, res, next) {
	crypto.randomBytes(4, function(ex, buf) {
		var token = buf.toString('hex');
		req.log = log.child({reqId : token});
		next();
	});
});

router.post('/verify', function(req, res, next) {
	var productId = req.body.product_id;
	var email = req.body.email;
	
	if ((typeof productId === 'undefined' && !productId) || (typeof email === 'undefined' && !email)) {
		req.log.warn({
			error : 'Missing email or product ID',
			productId : productId,
			email : email
		});
		return next('Missing email or amount of convert');
	}

	if (!validator.isEmail(email)) {
		req.log.warn({
			error : 'Malformed email address',
			email : email
		});
		return next('Please enter a valid email address.');
	}

	products.getProduct(productId, function(err, productData) {
		if (err) {
			req.log.error({
				error : err,
				productId: productId
			});
			return next('We cannot convert this amount. Please try a different amount.');
		}

		payouts.payout(email, productData.value, function(err, data) {
			if (err) {
				req.log.error({
					error : err,
					email : email,
					productDataValue : productData.value
				});
				return next(errors.defaultErrorMessage);
			}
			delete data.is_sendable;
			data['status'] 	= 0;
			data['message'] = '';
			req.log.info(data);
			res.status(200).send(JSON.stringify(data));
		});
	});
});

router.post('/confirm', function(req, res, next) {
	var signature = req.body.signature;
	var signedData = req.body.signed_data;

	if (typeof signature === 'undefined' || typeof signedData === 'undefined') {
		req.log.error({
			error : 'Missing signature or signed data',
			signature : signature,
			signedData : signedData
		});
		return next('Signature or signed data is not supplied');
	}

	iap.processOrder(signedData, signature, function(err, iapRes) {
		if (err) {
			req.log.error({
				error : err,
				signature : signature,
				signedData : signedData
			});
			return next(errors.confirmErrorMessage);
		}

		var payloadObject = JSON.parse(iapRes.developerPayload);
		var productId = iapRes.productId;
		var email = payloadObject.email;

		products.getProduct(productId, function(err, productData){
			if (err) {
				req.log.error({
					error : err,
					productId : productId,
				});
				return next(errors.confirmErrorMessage);
			}

			payouts.payout(email, productData.value, function(err, payoutData) {
				if (err) {
					req.log.error({
						error : err,
						email : email,
						productDataValue : productData.value
					});
					return next(errors.confirmErrorMessage);
				}
		
				var orderData = {
					order_id : iapRes.orderId,
					token : iapRes.purchaseToken,
					product_id : productId,
					timestamp : Date.now(),
					is_processed : 0,
					email : email,
					total_value : productData.value,
					payout_value : payoutData.payout_value,
					admin_value : payoutData.admin_value,
					google_value : payoutData.google_value,
				};

				req.log.info({
					state : 'Preparing to send',
					email : email,
					orderData : orderData
				});

				// Save the order and send a response immediately without waiting for Paypal.
				orders.saveOrder(orderData, function(err, result) {
					if (err) {
						req.log.error({
							error : err,
							email : orderData,
						});
						return next(errors.confirmErrorMessage);
					}

					// We've successfully saved the data in the DB. We can notify the customer that
					// the order is processing.
					res.send(JSON.stringify({
						'status' 	: 0,
						'message'	: ''
					}));

					// Make the Paypal immediately.
					// Only make the Paypal request when there's no errors in saving the order. This
					// protects the payment from being sent twice. If there's an error, a human
					// should deal with it manually.
					if (typeof payoutData.is_sendable !== 'undefined' && payoutData.is_sendable) {
						paypal.sendPayment(orderData, function(err, payoutObject) {
							if (err) {
								req.log.error({
									error : err,
									email : orderData,
								});
								orders.flagOrderFail(orderData);
								return console.error(err);
							}
							req.log.info({
								state : 'Payout successful',
								payoutObject : payoutObject
							});
							return orders.flagOrderSuccess(orderData);
						});
					}
				});
			});
		});
	});
});

router.use(function(req, res, next) {
	res.status(404).send();
});

router.use(function(err, req, res, next) {
	req.log.warn(err);
	next(err);
});

router.use(function(err, req, res, next) {
	res.status(400).send(JSON.stringify({error : err}))
});


module.exports = router;

