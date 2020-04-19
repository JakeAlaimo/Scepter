//assigns server responses to specific routes
//does NOT specify the implementation of these responses

const controllers = require('./controllers');
const mid = require('./middleware');

//sets up http requests with the appropriate server response
const router = (app) => {
  app.post('/test', controllers.AddTestJob);
};

module.exports = router;