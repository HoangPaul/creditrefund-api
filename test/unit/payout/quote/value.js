var assert = require('chai').assert;
var deepcopy = require('deepcopy');
var Quote = require('app/payout/quote/quote');
var QuoteValue = require('app/payout/quote/value');
var BigNumber = require('bignumber.js');
var us = require('underscore');

describe('QuoteValue', function() {
    it('should succeed if passed bignumber and format', function() {
        assert.doesNotThrow(function() {new QuoteValue(new BigNumber(1), QuoteValue.CENTS)});
        assert.doesNotThrow(function() {new QuoteValue(new BigNumber(100), QuoteValue.DOLLARS)});
    });
    it('should throw error if number is not of type bignumber', function() {
        assert.throws(function() {new QuoteValue(1, QuoteValue.CENTS)}, TypeError);
        assert.throws(function() {new QuoteValue('qweqwe', QuoteValue.CENTS)}, TypeError);
        assert.throws(function() {new QuoteValue({'a': 'Not big number'}, QuoteValue.CENTS)}, TypeError);
        assert.throws(function() {new QuoteValue(null, QuoteValue.CENTS)}, TypeError);
    });
    it('should throw error if format is not valid', function() {
        assert.throws(function() {new QuoteValue(new BigNumber(1), 'a')}, TypeError);
        assert.throws(function() {new QuoteValue(new BigNumber(1), null)}, TypeError);
        assert.throws(function() {new QuoteValue(new BigNumber(1), {})}, TypeError);
        assert.throws(function() {new QuoteValue(new BigNumber(1))}, TypeError);
    });
});