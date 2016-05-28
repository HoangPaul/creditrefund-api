var BigNumber = require('bignumber.js');
var ProductError = require('app/product/error');

var TABLE_NAME = 'products';

/**
 * @param {string} productId
 * @param {number} value
 * @constructor
 */
function Product(productId, value) {
    this.productId = productId;
    this.value = value;
}

/**
 * @param {{dbDriver: object}} context
 * @param {string} productId
 * @param {function(?object, Product=)} callback
 */
Product.load = function(context, productId, callback) {
    var params = {
        TableName: TABLE_NAME,
        Key: {
            'productId': productId
        }
    };

    context.dbDriver.get(params, function(err, dbData) {
        if (err) {
            return callback(err);
        }

        if (typeof dbData.Item === 'undefined') {
            return callback(new ProductError('We cannot convert this value.'));
        }

        var product = new Product(dbData.Item.productId, dbData.Item.value);

        return callback(null, product);
    });
}

/**
 * @returns {BigNumber}
 */
Product.prototype.getValue = function() {
    return new BigNumber(this.value);
};

module.exports = Product;