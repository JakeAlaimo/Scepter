// assigns server responses to specific routes
// does NOT specify the implementation of these responses
const uuidv4 = require('uuid').v4; // function for creation of guids

const controllers = require('./controllers');
// const mid = require('./middleware');

// sets up http requests with the appropriate server response
// also 'routes' websocket connections, disconnections, and messages
const router = (app, wss) => {
  app.get('/job/:id', controllers.web.PollJob);
  app.get('/game/:id', controllers.web.LoadGame);
  app.get('/isLocal', controllers.web.IsTestBuild);
  app.get('/leaderboard', controllers.web.GetLeaderboard);

  app.post('/requestGame', controllers.web.RequestGame);
  app.post('/test', controllers.web.AddTestJob);

  app.post('/login', controllers.web.Login);
  app.get('/logout', controllers.web.Logout);
  app.post('/signup', controllers.web.Signup);
  app.post('/changePassword', controllers.web.ChangePassword);

  // very special -and important- case
  // pairs session data with ws connection
  app.post('/joinGame', controllers.websocket.AddToRoom);

  // finally, a 404 page for everything else
  app.get('*', controllers.web.FileNotFound);

  // websocket handling config
  wss.on('connection', (socket) => {
    const ws = socket;

    ws.joinID = uuidv4(); // for pairing sessions with ws
    ws.send(JSON.stringify({ type: 'claimSession', data: { joinID: ws.joinID } }));

    // configure the message 'routes' of the websocket
    ws.input = controllers.websocket.TestText;
    ws.pong = controllers.websocket.Pong;

    controllers.websocket.TrackConnection(ws);

    // handles messages as they come
    ws.on('message', (data) => {
      const msg = JSON.parse(data);
      ws[msg.type](msg.data, ws);
    });
  });
};

module.exports = router;
