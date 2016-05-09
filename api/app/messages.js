var sprintf = require("sprintf-js").sprintf;

// Payment messages
var referenceNumberTemplate = 'Reference Number: "%s"';

// Error messages
var defaultErrorMessage = 'Oops! Something went wrong. Help us improve your experience by sending an error report to %s.';
var confirmErrorMessage = 'Oops! Something went wrong. Our technical staff have been notified of the issue and will be looking into this with the utmost urgency.';

module.exports = {
    api : {
        DEFAULT_ERROR_TEMPLATE: function() {
            return sprintf(defaultErrorMessage, 'asd@asd.com');
        }
    },
    payout : {
        REFERENCE_NUMBER_TEMPLATE : function(data) {
            return sprintf(referenceNumberTemplate, data);
        }
    }
};
