var assert = require('chai').assert;
var context = require('../../context');
var data = require('../../data');
var Stats = require('app/stats');

describe('Stats', function() {
    this.timeout(10000);
    beforeEach(function(done) {
        data.addStat(context.dbDriver, done);
    });

    afterEach(function(done) {
        data.deleteStat(context.dbDriver, done);
    });

    it('should retrieve existing stat', function(done) {
        var stats = new Stats(context.dbDriver, data.statCollectionName);
        stats.get(data.statName, function(err, stat) {
            if (err) {
                throw err;
            }
            assert.equal(stat, data.statValue);
            done();
        });
    });

    it('should add value existing stat', function(done) {
        var randomValue = Math.floor(Math.random() * 100);
        var stats = new Stats(context.dbDriver, data.statCollectionName);
        stats.add(data.statName, randomValue, function(err, _) {
            if (err) {
                throw err;
            }

            stats.get(data.statName, function(err, stat) {
                if (err) {
                    throw err;
                }

                assert.equal(stat, data.statValue + randomValue, "Stat value: " + data.statValue + ", random value: " + randomValue + ".");
                done();
            });
        });
    });

    it('should insert non-existent stat', function(done) {
        var randomValue = Math.floor(Math.random() * 100);
        var stats = new Stats(context.dbDriver, data.statCollectionName);
        stats.add(data.newStatName, randomValue, function(err, stat) {
            if (err) {
                throw err;
            }
            assert.equal(stat, randomValue);
            done();
        });
    })
});