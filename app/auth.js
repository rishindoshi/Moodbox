module.exports = function(app, passport) {

	SpotifyStrategy = require('passport-spotify').Strategy;

	passport.serializeUser(function(user, done) {
		done(null, user);
	});

	passport.deserializeUser(function(obj, done) {
		done(null, obj);
	});

	app.get('/auth/spotify',
		passport.authenticate('spotify'),
		function(req, res){
		    // The request will be redirected to spotify for authentication, so this
		    // function will not be called.
		});

	app.get('/auth/spotify/callback',
		passport.authenticate('spotify', { failureRedirect: '/login' }),
		function(req, res) {
		    // Successful authentication, redirect home.
		    res.redirect('/');
		});

	var appKey = '2f0e3328f63443ebb8f28044ac6859ad';
	var appSecret = '44449f5e8475482aa8cba09b74be1c8c';

	passport.use(new SpotifyStrategy({
		clientID: appKey,
		clientSecret: appSecret,
		callbackURL: "http://localhost:8888/auth/spotify/callback"
	}, function(accessToken, refreshToken, profile, done) {
	    // asynchronous verification, for effect...
	    process.nextTick(function () {
	      // To keep the example simple, the user's spotify profile is returned to
	      // represent the logged-in user. In a typical application, you would want
	      // to associate the spotify account with a user record in your database,
	      // and return that user instead.
	      return done(null, profile);
	  });
	}));
}