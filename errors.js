var merge = require('merge');

var baseError = function(msg, data) {
	var err = null;
	if (typeof msg === 'Error') {
		err = msg;
	} else {
		err = new Error(msg);
	}
	return merge({error : err}, data);
};

module.exports = {
	shownError : function(msg, data) {
		var err = baseError(msg, data);
		err['showable'] = 1;
		err['code'] = err['code'] || 400;
		return err;
	},
	hiddenError : function(msg, data) {
		var err = baseError(msg, data);
		err['showable'] = 0;
		err['code'] = err['code'] || 500;
		return err;
	}
};
