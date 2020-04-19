//initiates, configures, and launches the express instance
//this is where any express addons should be hooked up

const express = require('express');
//const expressHandlebars = require('express-handlebars');
const SetRoutes = require('./router.js')

const PORT = process.env.PORT || process.env.NODE_PORT || 3000;

const app = express();
  
//configure the callbacks associated with specific routes
SetRoutes(app);

//start the now fully-configured web server
app.listen(PORT, (err) => {
    if (err) {
      throw err;
    }
    console.log(`Listening on port ${PORT}`);
});