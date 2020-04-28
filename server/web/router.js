// assigns server responses to specific routes
// does NOT specify the implementation of these responses

const controllers = require('./controllers');
// const mid = require('./middleware');

// sets up http requests with the appropriate server response
// also 'routes' websocket connections, disconnections, and messages
const router = (app, wss) => {
  app.get('/job/:id', controllers.web.PollJob);
  app.get('/game/:id', controllers.web.LoadGame);
  app.get('/isLocal', controllers.web.IsTestBuild);

  app.post('/requestGame', controllers.web.RequestGame);
  app.post('/test', controllers.web.AddTestJob);

  // websocket handling config
  wss.on('connection', (socket) => {
    const ws = socket;

    // configure the message 'routes' of the websocket
    ws.input = controllers.websocket.TestText;
    ws.join = controllers.websocket.AddToRoom;
    ws.pong = controllers.websocket.Pong;


    // handles messages as they come
    ws.on('message', (data) => {
      const msg = JSON.parse(data);
      ws[msg.type](msg.data, ws);
    });
  });
};

module.exports = router;
