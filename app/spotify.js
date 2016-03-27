module.exports = function(config) {

	var SpotifyWebApi = require('spotify-web-api-node');

	// credentials are optional
	var spotifyAPI = new SpotifyWebApi({
	  clientId : config.appKey,
	  clientSecret : config.appSecret,
	  redirectUri : config.callbackURL
	});

	return spotifyAPI;
}