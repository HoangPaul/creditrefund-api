var express = require('express');
var bodyParser = require('body-parser');
var app = express();
var api = require('app/api');

app.disable('x-powered-by');

app.use(bodyParser.json());

app.get('/', function (req, res) {
    res.send('Hello World!');
});

app.use('/api', function(req, res, next) {
    req.context = {
        dbDriver: require('app/db-driver/aws-db')
    };

    next();
});

app.use('/api', api);

var server = app.listen(3000, function () {
    var host = server.address().address;
    var port = server.address().port;

    console.log('Example app listening at http://%s:%s', host, port);
});

