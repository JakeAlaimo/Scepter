// assigns server responses to specific routes
// does NOT specify the implementation of these responses

const controllers = require('./controllers');
// const mid = require('./middleware');

// sets up http requests with the appropriate server response
// also 'routes' websocket connections, disconnections, and messages
const router = (app, wss) => {
  app.get('/job/:id', controllers.web.PollJob);
  app.post('/test', controllers.web.AddTestJob);
  app.get('/isLocal', controllers.web.IsTestBuild);

  // websocket handling config
  wss.on('connection', (ws, req) => {
    // strip out the ip for ID purposes
    const xForwardedFor = req.headers['x-forwarded-for'];
    const ip = (xForwardedFor) ? xForwardedFor.split(/\s*,\s*/)[0] : req.socket.remoteAddress;

    //configure the message 'routes' of the websocket
    ws["input"] = controllers.websocket.TestText;

    //handles messages as they come
    ws.on("message", (data) => {
      const msg = JSON.parse(data);
      ws[msg.type](msg.data, ip);
    });

    //track the configured connection
    controllers.websocket.AddClient(ws, ip);
    ws.on('close', () => controllers.websocket.RemoveClient(ip));
  });
};

module.exports = router;
