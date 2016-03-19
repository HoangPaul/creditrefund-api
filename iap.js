var defaults = require('./defaults');
var fs = require('fs');

var iap = require('in-app-purchase');
iap.config({
	googlePublicKeyPath : '/app/.key/'
});

module.exports = {
	processOrder : function(signedData, signature, callback) {
		iap.setup(function(err) {
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
	}
};
