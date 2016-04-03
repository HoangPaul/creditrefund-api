var defaults = require('./defaults');
var sprintf = require("sprintf-js").sprintf;

// Payment messages
var referenceNumberTemplate = 'Reference Number: "%s"';

// Error messages
var defaultErrorMessage = sprintf('Oops! Something went wrong. Help us improve your experience by sending an error report to %s', defaults.SUPPORT_EMAIL);
var confirmErrorMessage = 'Oops! Something went wrong. Our technical staff have been notified of the issue and will be looking into this with the utmost urgency.';

module.exports = {
    api : {
    	DEFAULT_ERROR : defaultErrorMessage,
    	CONFIRM_ERROR : confirmErrorMessage
    },
    payout : {
        REFERENCE_NUMBER_TEMPLATE : function(data) {
            return sprintf(referenceNumberTemplate, data);
        }
    }
};
