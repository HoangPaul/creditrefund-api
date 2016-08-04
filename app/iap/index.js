var iap = require('in-app-purchase');

/**
 * @param {object} context
 * @constructor
 */
function Iap(context) {
	this.context = context;
}

/**
 * @param {string} signedData
 * @param {string} signature
 * @param callback
 */
Iap.prototype.processGoogleOrder = function(signedData, signature, callback) {
	this.context.iap.setup(function(err) {
		if (err) {
			return callback(err);
		}

		var receipt = {
			"data" : signedData,
			"signature" : signature
		};

		iap.validate(iap.GOOGLE, receipt, function(err, iapRes) {
			if (err) {
				return callback(err);
			}

			if (iap.isValidated(iapRes)) {
				return callback(null, iapRes);
			}

			return callback(new Error('IAP has not been validated.'));
		});
	});

};

module.exports = Iap;
