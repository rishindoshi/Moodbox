module.exports = function(app, passport, config, api) {

	SpotifyStrategy = require('passport-spotify').Strategy;

	passport.serializeUser(function(user, done) {
		done(null, user);
	});

	passport.deserializeUser(function(obj, done) {
		done(null, obj);
	});

	app.get('/auth/spotify',
		passport.authenticate('spotify', { scope: ['playlist-modify-private', 'user-read-email', 'user-read-private', 'user-top-read'] }),
		function(req, res){
		    // The request will be redirected to spotify for authentication, so this
		    // function will not be called.
		});

	app.get('/auth/spotify/callback',
		passport.authenticate('spotify', { failureRedirect: '/login' }),
		function(req, res) {
		    // Successful authentication, redirect home.
		    console.log(req.query)
		    res.redirect('/');
		});

	passport.use(new SpotifyStrategy({
		clientID: config.appKey,
		clientSecret: config.appSecret,
		callbackURL: config.callbackURL
	}, function(accessToken, refreshToken, profile, done) {
	    // asynchronous verification, for effect...
	    process.nextTick(function () {
	      // To keep the example simple, the user's spotify profile is returned to
	      // represent the logged-in user. In a typical application, you would want
	      // to associate the spotify account with a user record in your database,
	      // and return that user instead.
	      api.setAccessToken(accessToken);
	      api.setRefreshToken(refreshToken);
	      return done(null, profile);
	  });
	}));
}