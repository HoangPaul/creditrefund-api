var Product = require('app/product/product');

/**
 * @const {string}
 */
var TABLE_NAME = 'products';

/**
 * @param {{dbDriver: object}} context
 * @property {object} dbDriver
 * @constructor
 */
function ProductsLoader(context) {
    this.dbDriver = context.dbDriver;
}

/**
 * @param {string} productId
 * @param {function(?object, Product=)}callback
 */
ProductsLoader.prototype.loadProduct = function(productId, callback) {
}

module.exports = ProductsLoader;
