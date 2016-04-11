var Q = require('q');
module.exports = function(app, api, generate, qgen) {

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
		console.log(req.query.transcript);
		// generate.getMoodBasedPlaylist("happy", api);

		// console.log(req.query.features);
		// pass features into classifier
		res.send("todo later");
	});

	app.get('/test', function(req, res){
		var mood = "happy";
		var userid = req.query.id;
		var userArtists = [];
		generate.getArtists(userid, api)
			.then(function(aids){
				userArtists = aids;
				return generate.getMoodArtists(mood, api);
			})
			.then(function(moodArtists){
				var allArtists = moodArtists.filter(function(n){
				    return userArtists.indexOf(n) != -1;
				});
				return generate.generateTracks(allArtists, api);
			})
			.then(function(trackids){
				console.log(trackids);
				return generate.makePlaylist(trackids, userid, api);
			})
			.then(function(playlist){
				console.log("SUCCESS CREATING PLAYLIST");
			})
			.catch(function(error){
				console.log(error);
			});
	});

	app.get('/', loggedIn, function(req, res) {

		var question = qgen();
		res.render('home', {
			user: req.user,
			question: question
		});
	});

	// app.get('*', loggedIn, function(req, res) {
	// 	res.redirect('/', {user: req.user});
	// });

}
