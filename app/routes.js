var Q = require('q');
module.exports = function(app, api, generate, qgen, sent, db) {
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
		var userid = "rdoshi023";
		var trans = req.query.transcript;
		console.log("TRANSCRIPT: " + trans);
		var userScore = sent(trans);
		var mood = ""; 
		if(userScore.score > 0){
			mood = "happy";
		}
		console.log("User " + userid + " is " + mood);
		var userArtists = [];
		var userTracks = [];
		generate.getArtists(userid, api)
			.then(function(aids){
				console.log(aids.length + " user artists");
				userArtists = aids;
				return generate.getMoodArtists(mood, api);
			})
			.then(function(moodArtists){
				console.log(moodArtists.length + " mood artists");
				var allArtists = moodArtists.filter(function(n){
				    return userArtists.indexOf(n) != -1;
				});
				console.log(allArtists.length + " intersection artists");
				return generate.generateTracks(allArtists, api);
			})
			.then(function(trackObjs){
				console.log(trackObjs.length + " tracks");
				numTracks = (trackObjs.length < 50) ? trackObjs.length : 50;
				trackObjs = generate.shuffle(trackObjs).slice(0, numTracks);
				userTracks = trackObjs;
				return generate.makePlaylist(trackObjs, userid, api);
			})
			.then(function(playlist){
				console.log("SUCCESS CREATING PLAYLIST");
				res.render('results', {
					pid: playlist.snapshot_id,
					tracks: userTracks
				});
			})
			.catch(function(error){
				console.log(error);
			});
	});

	app.get('/test', function(req, res){
		var mood = "sunny happy";
		var userid = req.query.id;
		var userArtists = [];
		var userTracks = [];
		generate.getArtists(userid, api)
			.then(function(aids){
				console.log(aids.length + " user artists");
				userArtists = aids;
				return generate.getMoodArtists(mood, api);
			})
			.then(function(moodArtists){
				console.log(moodArtists.length + " mood artists");
				var allArtists = moodArtists.filter(function(n){
				    return userArtists.indexOf(n) != -1;
				});
				console.log(allArtists.length + " intersection artists");
				return generate.generateTracks(allArtists, api);
			})
			.then(function(trackObjs){
				console.log(trackObjs.length + " tracks");
				numTracks = (trackObjs.length < 50) ? trackObjs.length : 50;
				trackObjs = generate.shuffle(trackObjs).slice(0, numTracks);
				userTracks = trackObjs;
				return generate.makePlaylist(trackObjs, userid, api);
			})
			.then(function(playlist){
				console.log("SUCCESS CREATING PLAYLIST");
				res.render('results', {
					pid: playlist.snapshot_id,
					tracks: userTracks
				});
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

	// Rating Route
	app.post('/rating', function(req, res) {
		console.log(req.body.rating);
		var rating = req.body.rating;
		var emotion = req.body.emotion || "NULL";
		var playlistID = req.body.playlistID || "0";
		var query = 'INSERT INTO feedback (rating, emotion, playlistID) VALUES (' + rating + ',"' + emotion +'",' + playlistID + ');';
		console.log(query);
		// Save rating in DB
		db.query(query, function(err, rows, fields) {
			if (!err)
				console.log('result: ', rows);
			else
				console.log('err: ', err);
		});

		res.send(200);
	});

	// app.get('*', loggedIn, function(req, res) {
	// 	res.redirect('/', {user: req.user});
	// });

}
