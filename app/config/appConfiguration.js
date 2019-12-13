const dotenv = require('dotenv').config()

let appConfig = {};
appConfig.port = process.env.PORT;
appConfig.env = process.env.NODE_ENV;
appConfig.allowedCorsOrigin = [
  "http://localhost:4200", "http://nishant-kumar.com", "http://n-cart.nishant-kumar.com"
];
appConfig.db = {
  uri: process.env.DB_URI
}
appConfig.apiVersion = '/api/v2';
appConfig.appHost = "N-CART"


module.exports = {
  port: appConfig.port,
  allowedCorsOrigin: appConfig.allowedCorsOrigin,
  environment: appConfig.env,
  db: appConfig.db,
  apiVersion: appConfig.apiVersion,
  appHost: appConfig.appHost
};