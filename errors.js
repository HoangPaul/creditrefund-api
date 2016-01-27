var defaults = require('./defaults');
var sprintf = require("sprintf-js").sprintf;

var defaultErrorMessage = sprintf('Oops! Something went wrong. Help us improve your experience by sending an error report to %s', defaults.SUPPORT_EMAIL);
var confirmErrorMessage = sprintf('Oops! Something went wrong. Our technical staff have been notified of the issue and will be looking into this with the utmost urgency.');

module.exports = {
	DEFAULT_ERROR_MESSAGE : defaultErrorMessage,
	CONFIRM_ERROR_MESSAGE : confirmErrorMessage
};
