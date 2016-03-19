var BigNumber = require('bignumber.js');
var pool = require('./mysql');
var defaults = require('./defaults');

module.exports = {
    payout: function(email, amount, callback) {
        pool.query('SELECT * FROM `emails` WHERE email = ?', email, function(err, row) {
            if (err) {
                return callback(err);
            }

            if (row.length > 1) {
                return callback(
                    new Error('Multiple email results retrieved')
                );
            }

            var data = {
                payout: defaults.PAYOUT,
                admin: defaults.ADMIN,
                google: defaults.GOOGLE,
            };

            if (row.length === 1) {
                data['payout'] = row[0].payout;
                data['admin'] = row[0].admin;
                data['google'] = row[0].google;
            }

            var total = new BigNumber(amount);
            data['amount_value'] = total.toFixed(2);
            data['payout_value'] = total.times(data.payout).dividedBy(100).toFixed(2, BigNumber.ROUND_UP);
            data['google_value'] = total.times(data.google).dividedBy(100).toFixed(2);
            data['admin_value'] = total.minus(data.payout_value).minus(data.google_value).toFixed(2);

            // Sanity check
            var total = new BigNumber(data.payout_value).plus(data.google_value).plus(data.admin_value);
            var percentTotal = new BigNumber(data.payout).plus(data.admin).plus(data.google);
            if (!total.equals(amount) || !percentTotal.equals(100)) {
                return callback({
                    error: new Error('Payout total does not sum up'),
                    data: data,
                    total: total,
                    percentTotal: percentTotal
                });
            }

            return callback(null, data);
        });
    }
};
