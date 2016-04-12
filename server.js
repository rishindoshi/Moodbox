//Think of these require statements as #include statements. They're just pre-built libraries.
var express = require('express');
var request = require('request');
var handles = require('express-handlebars');
var passport = require('passport');
var session = require('express-session');
var config = require('./app/config');
var bodyParser = require('body-parser');
var sentiment = require('sentiment');
var qgen = require('./app/qgen');
var app = express();

// Static Files
app.use(express.static(__dirname + '/public'));

app.use(session({ secret: 'dick chaney made money off the Iraq War' }));
app.use(passport.initialize());
app.use(passport.session());
app.use(bodyParser.urlencoded({
  extended: true
}));

var spotifyAPI = require('./app/spotify')(config);
var generate = require("./app/generate");
var db = require('./app/db');
require('./app/auth')(app, passport, config, spotifyAPI);
require('./app/routes')(app, spotifyAPI, generate, qgen, db);

//This allows us to use handlebars as our template engine
app.set('views', __dirname + '/public/views');
app.engine('.hbs', handles({
	defaultLayout: 'base',
	layoutsDir: 'public/views/layouts',
        extname: '.hbs'
}));
app.set('view engine', '.hbs');

//Start the server
app.listen(8888);
console.log('Server magic happens at port 8888');
