// Here we get all the tracks from all the user's playlists
// we want to extract all the unique artists from each of these tracks
// we then want this list of artists and add to it related artists
// we then want to extract playlists that match input mood (happy/sad/etc) by doing playlist search on spotifyAPI
// we will again extract unique artists from these playlists and also add related artists
// now find intersection of artists between above two lists
var Q = require('q');

exports.getUserPlaylistIds = function(userid, api){
	var deferred = Q.defer();
	console.log("getting user playlists");
	api.getUserPlaylists(userid)
		.then(function(data){
			var ids = data.body.items.map(function(playlist){
				return playlist.id;
			});
			deferred.resolve(ids);
		}, function(error){
			deferred.reject("ERROR: get user playlist ids");
		});
	return deferred.promise;
};

exports.getPlaylistArtists = function(userid, playlistid){
	var deferred = Q.defer();
	api.getPlaylist(userid, playlistid)
		.then(function(data){
			var tracks = data.body.tracks.items.map(function(track){
				return track.track.artists[0].name;
			});
			deferred.resolve(tracks);
		}, function(error){
			deferred.reject("ERROR: get playlist tracks");
		});
	return deferred.promise;
};