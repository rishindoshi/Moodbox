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
		// console.log(req.query.features);
		// pass features into classifier
		res.send("todo later");
	});

	// When a user submits an artist
	app.get('/results', loggedIn, function(req, res){
		res.send("results");
	});

	// now generate playlist of random tracks from all artists in above intersection artist list

	app.get('/', loggedIn, function(req, res) {
		res.render('home', {user: req.user});
	});

	// app.get('*', loggedIn, function(req, res) {
	// 	res.redirect('/', {user: req.user});
	// });

}
