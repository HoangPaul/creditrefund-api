var AWS = require("aws-sdk");

AWS.config.loadFromPath('app/db-driver/aws-config.json');

AWS.config.update({
  region: "ap-southeast-2",
  endpoint: "dynamodb.ap-southeast-2.amazonaws.com"
});


var docClient = new AWS.DynamoDB.DocumentClient();

module.exports = docClient;
