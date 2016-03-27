module.exports = function(app, api) {

	// Logged in check
	function loggedIn(req, res, next) {
	    if (req.user) {
	        next();
	    } else {
	        res.redirect('/login');
	    }
	}

	//Rendering our index page
	app.get('/login', function(req, res){
		res.render('login');
	});

	app.get('/logout', function(req, res){
		req.logout();
		res.redirect('/');
	});


	//When a user submits an artist
	app.get('/results', loggedIn, function(req, res){

		api.getUserPlaylists(req.user.id)
			.then(function(data) {
				console.log(data.body.items)
				res.render('results', data.body);
			});
	});

	app.get('/create', loggedIn, function(req, res){
		api.createPlaylist(req.user.id, 'My Cool Playlist', { 'public' : false })
		  .then(function(data) {
		    console.log('Created playlist!');
		    res.render('results');
		  }, function(err) {
		    console.log('Something went wrong!', err);
		  });
	})

	app.get('/', loggedIn, function(req, res) {
		res.render('home', {user: req.user});
	});

}
