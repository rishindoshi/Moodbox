// Here we get all the tracks from all the user's playlists
// we want to extract all the unique artists from each of these tracks
// we then want this list of artists and add to it related artists
// we then want to extract playlists that match input mood (happy/sad/etc) by doing playlist search on spotifyAPI
// we will again extract unique artists from these playlists and also add related artists
// now find intersection of artists between above two lists
var Q = require('q');

exports.getMoodBasedPlaylist = function(mood, api){
	var deferred = Q.defer();
	api.searchPlaylists(mood)
		.then(function(data){
			console.log(data.body.playlists.items[0]);
			// deferred.resolve(data.body);
		}, function(error){
			console.log(error);
		});
	return deferred.promise;
}

exports.getRelatedArtists = function(artistId, api){
	var deferred = Q.defer();
	api.getArtistRelatedArtists(artistId)
	    .then(function(data) {
	    	var artistIds = data.body.artists.map(function(artist){
	    		return artist.name;
	    	});
	    	deferred.resolve(artistIds);
	    }, function(err) {
	        console.log(err);
	    });
	return deferred.promise;
};

exports.getAllUserRelatedArtists = function(artistIds, api){
	var deferred = Q.defer();
	var promiseArray = [];
	var allArtists = [];
	for(var i=0; i < artistIds.length; ++i){
		promiseArray.push(this.getRelatedArtists(artistIds[i], api));
	}
	Q.all(promiseArray).done(function(values){
		for(var j=0; j < values.length; ++j){
			allArtists = allArtists.concat(values[j]);
		}
		deferred.resolve(allArtists);
	});
	return deferred.promise;
};

exports.getUserPlaylistIds = function(userid, api){
	var deferred = Q.defer();
	api.getUserPlaylists(userid)
		.then(function(data){
			var ids = data.body.items.filter(function(playlist){
				return playlist.public;
			}).map(function(playlist){
				return playlist.id;
			});
			deferred.resolve(ids);
		}, function(error){
			deferred.reject("ERROR: get user playlist ids");
		});
	return deferred.promise;
};

exports.getPlaylistArtists = function(userid, playlistid, api){
	var deferred = Q.defer();
	api.getPlaylist(userid, playlistid)
		.then(function(data){
			var artists = data.body.tracks.items.map(function(track){
				// return {
				// 	name: track.track.artists[0].name,
				// 	id: track.track.artists[0].id
				// };
				return track.track.artists[0].id;
			});
			deferred.resolve(artists);
		}, function(error){
			deferred.reject("ERROR: get playlist artists");
		});
	return deferred.promise;
};

// Might not want to call this every time a user requests results, just once when they login maybe
exports.getUserArtists = function(userid, api){
	var deferred = Q.defer();
	var promiseArray = []
	var userArtists = [];
	var self = this;
	this.getUserPlaylistIds(userid, api)
		.then(function(ids){
			for(var i=0; i < ids.length; ++i){
				promiseArray.push(self.getPlaylistArtists(userid, ids[i], api));
			}
			Q.all(promiseArray).done(function(values){
				for(var j=0; j<values.length; ++j){
					userArtists = userArtists.concat(values[j]);
				}
				deferred.resolve(Array.from(new Set(userArtists)));
			}, function(error){
				console.log(error);
			});
		}, function(error){	
			console.log(error);
		});
	return deferred.promise;
}