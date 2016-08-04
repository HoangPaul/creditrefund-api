var express = require('express');
var bodyParser = require('body-parser');
var app = express();
var api = require('app/api');
var context = require('app/context');

app.disable('x-powered-by');

app.use(bodyParser.json());

app.get('/', function (req, res) {
    res.send(JSON.stringify({
        'latest': context.meta.version
    }));
});

// API
app.use('/' + context.meta.version, function(req, res, next) {
    req.context = context;
    next();
});
app.use('/' + context.meta.version, api);

var server = app.listen(3000, function () {
    var host = server.address().address;
    var port = server.address().port;

    console.log(JSON.stringify(context.meta, null, 2));
    console.log('Credit Refund API started on http://%s:%s', host, port);
});

