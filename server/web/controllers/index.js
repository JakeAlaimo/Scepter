// aggregates the exports for this folder so only one require is needed

const websocket = require('./websocket.js');
const web = require('./web.js');

module.exports.websocket = websocket;
module.exports.web = web;
