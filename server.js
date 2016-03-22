//Think of these require statements as #include statements. They're just pre-built libraries.
var express = require('express');
var request = require('request');
var handles = require('express-handlebars');
var passport = require('passport');
var session = require('express-session');
var app = express();

app.use(session({ secret: 'keyboard cat' }));
// Initialize Passport!  Also use passport.session() middleware, to support
// persistent login sessions (recommended).
app.use(passport.initialize());
app.use(passport.session());

function loggedIn(req, res, next) {
    if (req.user) {
        next();
    } else {
        res.redirect('/login');
    }
}

require('./app/auth')(app, passport);

// Static Files
app.use(express.static(__dirname + '/public'));

//This allows us to use handlebars as our template engine
app.set('views', __dirname + '/public/views');
app.engine('.hbs', handles({
	defaultLayout: 'base',
	layoutsDir: 'public/views/layouts',
        extname: '.hbs'
}));
app.set('view engine', '.hbs');

//Rendering our index page
app.get('/login', function(req, res){
	res.render('login');
});

songData = {
	'song' : [
		{
			title: 'Junk of the heart',
			imgUrl: 'https://facebook.com'
		},
		{
			title: 'Hello',
			imgUrl: 'Okay'
		}
	]
}

//When a user submits an artist
app.get('/results', loggedIn, function(req, res){

	res.render('results', songData);

});

app.get('/', function(req, res) {
	console.log(req.user)
	res.render('home', {user: req.user});
});


//Start the server
app.listen(8888);
console.log('Server magic happens at port 8888');
