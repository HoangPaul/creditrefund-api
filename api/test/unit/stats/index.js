var assert = require('chai').assert;
var context = require('../../context');
var data = require('../../data');
var Stats = require('app/stats');

describe('Stats', function() {
    beforeEach(function(done) {
        data.addStat(done, context);
    });

    afterEach(function(done) {
        data.deleteStat(done, context);
    });

    it('should retrieve existing stat', function(done) {
        Stats.get(context, data.statName, function(err, stat) {
            if (err) {
                throw err;
            }
            assert.equal(stat.name, data.statName);
            assert.equal(stat.value, data.statValue);
            done();
        });
    });

    it('should add value existing stat', function(done) {
        var randomValue = Math.floor(Math.random() * 100);
        Stats.add(context, data.statName, randomValue, function(err, _) {
            if (err) {
                throw err;
            }

            Stats.get(context, data.statName, function(err, stat) {
                if (err) {
                    throw err;
                }
                assert.equal(stat.name, data.statName);
                assert.equal(stat.value, data.statValue + randomValue, "Stat value: " + data.statValue + ", random value: " + randomValue + ".");
                done();
            });
        });
    });

    it('should insert non-existent stat', function(done) {
        var randomValue = Math.floor(Math.random() * 100);
        Stats.add(context, data.newStatName, randomValue, function(err, stat) {
            if (err) {
                throw err;
            }
            assert.equal(stat.name, data.newStatName);
            assert.equal(stat.value, randomValue);
            done();
        });
    })
});