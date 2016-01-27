var express = require('express');
var bodyParser = require('body-parser');
var app = express();
app.disable('x-powered-by');

var api = require('./api');

app.get('/', function (req, res) {
  res.send('Hello World!');
});
app.use(bodyParser.json());
app.use('/api', api);

var server = app.listen(3000, function () {
  var host = server.address().address;
  var port = server.address().port;

  console.log('Example app listening at http://%s:%s', host, port);
});
