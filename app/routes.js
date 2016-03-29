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

	app.get('/mood', function(req, res){
		console.log("received mood request");
		// console.log(req.query.features);
		// pass features into classifier
	});

	// When a user submits an artist
	app.get('/results', loggedIn, function(req, res){
		// Here we get all the tracks from all the user's playlists
		// we want to extract all the unique artists from each of these tracks
		// we then want this list of artists and add to it related artists
		// we then want to extract playlists that match input mood (happy/sad/etc) by doing playlist search on spotifyAPI
		// we will again extract unique artists from these playlists and also add related artists
		// now find intersection of artists between above two lists
		// now generate playlist of random tracks from all artists in above intersection artist list
		api.getUserPlaylists(req.user.id)
			.then(function(data) {
				playlistId = data.body.items[0].id;
				api.getPlaylist(req.user.id, playlistId)
					.then(function(data) {
						// console.log(data.body.tracks.items);
						api.createPlaylist(req.user.id, 'test playlist', { 'public' : false })
						  .then(function(data) {
							var playlist = data.body;
							// sample data
							var tracklist = ["spotify:track:0eGsygTp906u18L0Oimnem"];
							// add tracks to the playlist and render the widget
							api.addTracksToPlaylist(req.user.id, playlist.id, tracklist)
								.then(function(data) {
								    res.render('results', playlist);
								});

						  }, function(err) {
						    console.log('Something went wrong!', err);
						  });
					})
			});
	});

	// now generate playlist of random tracks from all artists in above intersection artist list

	app.get('/', loggedIn, function(req, res) {
		res.render('home', {user: req.user});
	});

	app.get('*', loggedIn, function(req, res) {
		res.redirect('/', {user: req.user});
	})

}
