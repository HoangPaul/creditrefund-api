var express = require('express');
var bodyParser = require('body-parser');
var app = express();
var api = require('app/api');
var context = require('app/neuteredContext');

app.disable('x-powered-by');

app.use(bodyParser.json());

app.get('/', function (req, res) {
    res.send(JSON.stringify({
        'latest': 'v1'
    }));
});

// API
app.use('/v1', function(req, res, next) {
    req.context = context;
    next();
});
app.use('/v1', api);

var server = app.listen(3000, function () {
    var host = server.address().address;
    var port = server.address().port;

    console.log('Credit Refund API started on http://%s:%s', host, port);
});

