/**
 * @param {object} iap
 * @constructor
 */
function Iap(iap) {
	this.iap = iap;
}

/**
 * @param {string} signedData
 * @param {string} signature
 * @param callback
 */
Iap.prototype.processGoogleOrder = function(signedData, signature, callback) {
	var self = this;
	self.iap.setup(function(err) {
		if (err) {
			return callback(err);
		}

		var receipt = {
			"data" : signedData,
			"signature" : signature
		};

		self.iap.validate(self.iap.GOOGLE, receipt, function(err, iapRes) {
			if (err) {
				return callback(err);
			}

			if (self.iap.isValidated(iapRes)) {
				return callback(null, iapRes);
			}

			return callback(new Error('IAP has not been validated.'));
		});
	});
};

module.exports = Iap;
