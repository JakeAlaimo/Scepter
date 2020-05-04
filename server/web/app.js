// initiates, configures, and launches the express instance
// this is where any express addons should be hooked up

const path = require('path');
const http = require('http');
const express = require('express');
const bodyParser = require('body-parser');
const expressHandlebars = require('express-handlebars');
const Websocket = require('ws');

const cookieParser = require('cookie-parser');
const session = require('express-session');
const RedisStore = require('connect-redis')(session);
const favicon = require('serve-favicon');
// const csrf = require('csurf');
const redis = require('redis');

const SetRoutes = require('./router.js');

const PORT = process.env.PORT || process.env.NODE_PORT || 3000;

const REDIS_URL = process.env.REDISCLOUD_URL || 'redis://127.0.0.1:6379';
const redisClient = redis.createClient(REDIS_URL);

const app = express();
app.use('/', express.static(path.resolve(`${__dirname}/../../_hosted/`)));
app.use(favicon(`${__dirname}/../../_hosted/img/favicon.png`));
app.disable('x-powered-by');
app.use(bodyParser.json());
app.use(cookieParser('asd6gkjfh5+6agdr546adg'));

const sessionParser = session({
  key: 'sessionid',
  store: new RedisStore({
    client: redisClient,
  }),
  secret: 'asd6gkjfh5+6agdr546adg',
  resave: true,
  saveUninitialized: true,
  cookie: {
    httpOnly: true,
  },
});
app.use((sessionParser));

/*
app.use(csrf());
app.use((err, req, res, next) => {
  if (err.code !== 'EBADCSRFTOKEN') return next(err);

  console.log('Missing CSRF token');
  return false;
}); */

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
