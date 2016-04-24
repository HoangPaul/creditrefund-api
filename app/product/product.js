var TABLE_NAME = 'products'

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
 * @param {function(?object, Product=) callback
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
            return callback(new Error('Failed to retrieve product, got a non-single result.'));
        }

        var product = new Product(dbData.Item.productId, dbData.Item.value);

        return callback(null, product);
    });
}

/**
 * @returns {number}
 */
Product.prototype.getValue = function() {
    return this.value;
};

module.exports = Product;