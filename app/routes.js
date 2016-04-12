var Q = require('q');
var score = require('./sentiscore');

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

	app.get('/mood', loggedIn, function(req, res){
		var userid = req.user.id;
		var trans = req.query.transcript;
		console.log("TRANSCRIPT: " + trans);
		var userSent = sent(trans);

		var mood = score("", userSent, "" )
		
		console.log("User " + userid + " is " + mood);
		var userArtists = [];
		var userTracks = [];
		var moodTracks = [];
		generate.getArtists(userid, api)
			.then(function(aids){
				console.log(aids.length + " user artists");
				userArtists = aids;
				return generate.getMoodArtists(mood, aids, api);
			})
			.then(function(moodObj){
				console.log(moodObj.artists.length + " mood artists");
				console.log(moodObj.tracks.length + " mood tracks");
				moodTracks = moodObj.tracks;
				var allArtists = moodObj.artists.filter(function(n){
				    return userArtists.indexOf(n) != -1;
				});
				console.log(allArtists.length + " intersection artists");
				generate.printArtistNames(allArtists, api);
				return generate.generateTracks(allArtists, api);
			})
			.then(function(trackObjs){
				numTracks = (trackObjs.length < 50) ? trackObjs.length : 50;
				trackObjs = generate.shuffle(trackObjs).slice(0, numTracks);
				userTracks = trackObjs;
				return generate.infoTracks(moodTracks, api);
			})
			.then(function(trackObjs){
				var pTracks = userTracks.concat(moodTracks);
				console.log(pTracks.length + " playlist tracks");
				return generate.makePlaylist(trackObjs, userid, api);
			})
			.then(function(playlist){
				console.log("SUCCESS CREATING PLAYLIST");
				res.render('results', {
					pid: playlist.snapshot_id,
					tracks: userTracks,
					mood: mood
				});
			})
			.catch(function(error){
				// send em back an error page that allows them to go back to home
				console.log(error);
				res.redirect('/error');
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
		var emotion = req.body.emotion;
		var playlistID = req.body.playlistID;
		var query = 'INSERT INTO feedback (rating, emotion, playlistID) VALUES (' + rating + ',"' + emotion +'","' + playlistID + '");';
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

	// Rating Route
	app.post('/class-rating', function(req, res) {
		console.log(req.body.rating);
		var rating = req.body.rating;
		var emotion = req.body.emotion || "NULL";
		var playlistID = req.body.playlistID || "0";
		var query = 'INSERT INTO classification (rating, emotion) VALUES (' + rating + ',"' + emotion +'");';
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

	app.get('/error', function(req, res) {
		res.render('error');
	});

	app.get('/stats', function(req, res) {
		var query = 'SELECT * from classification';
		db.query(query, function(err, rows, fields) {
			if (!err) {
				console.log('result: ', rows);		
				var total = 0.0
				var good = 0.0
				rows.forEach(function(row) {
					total++;
					if (row.rating == 1) {
						good++;
					}
				});
				var classVal = good / total;
				good = 0.0;
				total = 0.0;
				query = 'SELECT * from feedback';
				db.query(query, function(err, rows, fields) {
					if (!err) {
						rows.forEach(function(row) {
							total++;
							good += row.rating;
						});
						var playVal = good / (total * 5.0);
						res.render('stats', {
							classVal : (classVal * 100),
							playVal : (playVal * 100)
						});
						console.log('result: ', rows);
					}
					else {
						console.log('err: ', err);
					}
				});
				
			}
			else {

				console.log('err: ', err);
			}
		});
	})

	app.get('*', loggedIn, function(req, res) {
		res.redirect('/error');
	});

}
