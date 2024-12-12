'use strict';
require('dotenv').config();
const express     = require('express');
const helmet = require('helmet'); // Import helmet
const bodyParser  = require('body-parser');
const cors        = require('cors');

const apiRoutes         = require('./routes/api.js');
const fccTestingRoutes  = require('./routes/fcctesting.js');
const runner            = require('./test-runner');
const connection = require('./db-connection');
const app = express();

app.use('/public', express.static(process.cwd() + '/public'));

app.use(cors({origin: '*'})); //For FCC testing purposes only

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(helmet());
app.use(helmet.contentSecurityPolicy({
  directives: {
    defaultSrc: ["'self'"], // Allow content to be loaded only from the same origin
    scriptSrc: ["'self'"], // Only allow scripts from the same origin
    styleSrc: ["'self'"], // Only allow stylesheets from the same origin
    imgSrc: ["'self'"], // Allow images only from the same origin
    connectSrc: ["'self'"], // Allow AJAX requests only from the same origin
    fontSrc: ["'self'"], // Allow fonts only from the same origin
    objectSrc: ["'none'"], // Block plugin content (e.g., Flash, Java)
    upgradeInsecureRequests: true, // Automatically upgrade insecure requests to HTTPS
  },
}));




//Index page (static HTML)
app.route('/')
  .get(function (req, res) {
    res.sendFile(process.cwd() + '/views/index.html');
  });

//For FCC testing purposes
fccTestingRoutes(app);

//Routing for API 
apiRoutes(app);  
    
//404 Not Found Middleware
app.use(function(req, res, next) {
  res.status(404)
    .type('text')
    .send('Not Found');
});

//Start our server and tests!
const listener = app.listen(process.env.PORT || 3000, function () {
  console.log('Your app is listening on port ' + listener.address().port);
  if(process.env.NODE_ENV==='test') {
    console.log('Running Tests...');
    setTimeout(function () {
      try {
        runner.run();
      } catch(e) {
        console.log('Tests are not valid:');
        console.error(e);
      }
    }, 3500);
  }
});

module.exports = app; //for testing
