// initiates, configures, and launches the express instance
// this is where any express addons should be hooked up

const path = require('path');
const http = require('http');
const express = require('express');
const bodyParser = require('body-parser');
const expressHandlebars = require('express-handlebars');
const Websocket = require('ws');

const SetRoutes = require('./router.js');

const PORT = process.env.PORT || process.env.NODE_PORT || 3000;

const app = express();
app.use('/', express.static(path.resolve(`${__dirname}/../../_hosted/`)));
app.use(bodyParser.json());

app.engine('handlebars', expressHandlebars({ defaultLayout: 'main' }));
app.set('view engine', 'handlebars');
app.set('views', `${__dirname}/../../views`);

// add more config here


const server = http.createServer(app);
const wss = new Websocket.Server({ server });

// configure the callbacks associated with specific routes
SetRoutes(app, wss);

// start the now fully-configured web server
server.listen(PORT, (err) => {
  if (err) {
    throw err;
  }
  console.log(`Listening on port ${PORT}`);
});
