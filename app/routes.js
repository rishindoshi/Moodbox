var Q = require('q');
module.exports = function(app, api, generate) {

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
		var userid = req.query.id;
		generate.getArtists(userid, api)
			.then(function(allArtists){
				console.log(allArtists);
			}, function(error){
				// console.log(error);
			});
	});

	// When a user submits an artist
	app.get('/results', loggedIn, function(req, res){
		var userArtists = [];
		var moodArtists = [];
		var promiseArray = [];
		promiseArray.push(generate.genUserArtists(req.query.id, api));
		// promiseArray.push(generate.getMoodBasedPlaylist("happy", api));s

		Q.all(promiseArray).done(function(values){
			console.log("succcess promises");
			userArtists = values[0];
			console.log(userArtists);
			// moodArtists = values[1];
			// console.log(userArtists);
			// generate.printArtistNames(userArtists.splice(0, userArtists.length-1), api);
			// var returnArtists = userArtists.filter(function(value){ 
   //          	return moodArtists.indexOf(value) > -1;
   //         	});
   //         	console.log(returnArtists.length);
		}, function(error){
			console.log("NOOOOOOO");
			console.log(error);
		});
	});

	app.get('/', loggedIn, function(req, res) {
		res.render('home', {user: req.user});
	});

	// app.get('*', loggedIn, function(req, res) {
	// 	res.redirect('/', {user: req.user});
	// });

}
