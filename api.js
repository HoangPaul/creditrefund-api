var express = require('express');
var router = express.Router();

var defaults = require('./defaults');
var errors = require('./errors');
var payouts = require('./payouts');
var products = require('./products');
var orders = require('./orders');
var paypal = require('./paypal');
var iap = require('./iap');

//var crypto = require('crypto');
var validator = require('validator');
//var sleep = require('./sleep');

var connection = require('./mysql');

var genericErrorResponse = {
	status : -1,
	message : 'Something went wrong.',
	showable : 0
};

router.post('/verify', function(req, res, next) {
	var productId = req.query.product_id;
	var email = req.query.email;
	
	if ((typeof productId === 'undefined' && !productId) ||(typeof email === 'undefined' && !email)) {
		return next(
			errors.shownError('Product ID and/or email was not supplied', {
				productId : productId,
				email : email
			})
		);
	}

	if (!validator.isEmail(email)) {
		return next(
			errors.shownError('The supplied email is malformed.', {
				email : email
			})
		);
	}

	products.getProduct(productId, function(err, productData) {
		if (err) {
			return next(err);
		}

		payouts.payout(email, productData.value, function(err, data) {
			if (err) {
				return next(err);
			}
			delete data.is_sendable;
			data['status'] 	= 0;
			data['message'] = '';
			res.status(200).send(JSON.stringify(data));
		});
	});
});

router.post('/confirm', function(req, res, next) {
	var signature = req.query.signature;
	var signedData = req.query.signed_data;

	if (typeof signature === 'undefined' || typeof signedData === 'undefined') {
		return next(errors.shownError('signature or signedData is not supplied'));
	}

	iap.processOrder(signedData, signature, function(err, iapRes) {
		if (err) {
			return next(
				errors.hiddenError(err, {
					signedData : signedData,
					signature : signature
				}
			));
		}

		var payloadObject = JSON.parse(iapRes.developerPayload);
		var productId = iapRes.productId;
		var email = payloadObject.email;

		products.getProduct(productId, function(err, productData){
			if (err) {
				return next(err);
			}

			payouts.payout(email, productData.value, function(err, payoutData) {
				if (err) {
					return next(err);
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

				console.log(orderData);

				// Save the order and send a response immediately without waiting for Paypal.
				orders.saveOrder(orderData, function(err, result) {
					if (err) {
						return next(err);
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
								orders.flagOrderFail(orderData);
								return console.error(err);
							}
							console.log(payoutObject);
							return orders.flagOrderSuccess(orderData);
						});
					}
				});
			});
		});
	});
});

router.use(function(err, req, res, next) {
	console.error(err);
	next(err);
});

router.use(function(err, req, res, next) {
	if (typeof err.showable !== 'undefined' && err.showable > 0) {
		var returnCode = err.code || 500;
		res.status(returnCode).send(JSON.stringify({
			'status' 	: -1,
			'message'	: err.error.message,
			'showable'	: 1
		}));
	} else {
		next(err);
	}
});

router.use(function(err, req, res, next) {
	res.status(500).send(JSON.stringify(genericErrorResponse));
});

router.use(function(req, res) {
	res.status(404).send(JSON.stringify(genericErrorResponse));
});


module.exports = router;

