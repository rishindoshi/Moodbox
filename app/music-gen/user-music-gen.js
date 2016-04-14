var Q = require('q');
var request = require('request-promise');
var aGen = require('./artist-gen');
var pGen = require('./playlist-gen')
var shuffle = require('./shuffle');

exports.getSpotifyBasedTopArtists = function(userid, api){
	var deferred = Q.defer();
	var req_url = "https://api.spotify.com/v1/me/top/artists";
	var rel_req_options = {
		url: req_url,
		limit: 50,
		headers: {
			'Authorization': 'Bearer ' + api.getAccessToken()
		}
	};
	var userAndRelArtists = [];
	request(rel_req_options)
		.then(function(res){
			var data = JSON.parse(res);
			var artists = data.items.map(function(artist){
				return artist.id;
			});
			console.log(artists.length + " user top artists");
			userAndRelArtists = userAndRelArtists.concat(artists);
			return aGen.allRelatedArtists(shuffle(artists).slice(0,10), api);
		})
		.then(function(relids){
			userAndRelArtists = userAndRelArtists.concat(relids);
			deferred.resolve(Array.from(new Set(userAndRelArtists)));
		})
		.catch(function(error){
			deferred.reject(error);
		});
	return deferred.promise;
};

exports.getUserPlaylistIds = function(userid, api){
	var deferred = Q.defer();
	var self = this;
	api.getUserPlaylists(userid)
		.then(function(data){
			var ids = data.body.items.filter(function(playlist){
				return playlist.public;
			}).map(function(playlist){
				// console.log(playlist.name);
				return playlist.id;
			});
			ids = shuffle(ids).slice(0, 5);
			deferred.resolve(ids);
		}, function(error){
			deferred.reject(error);
		});
	return deferred.promise;
};

// First get playlist ids from all users public playlists
// Then get list of unique artists from all those playlists
// Then get list of related artists to those playlist artists
// Concat the two lists and return it
exports.getArtistsFromUserPlaylists = function(userid, api){
	var deferred = Q.defer();
	var userAndRelArtists = [];
	var self = this;
	this.getUserPlaylistIds(userid, api)
		.then(function(pids){
			console.log("Got " + pids.length + " of the users playlists");
			return pGen.getArtistsFromPlaylist(pids, userid, api);
		})
		.then(function(aids){
			userAndRelArtists = userAndRelArtists.concat(aids);
			aids = shuffle(aids).slice(0, 20);
			return aGen.allRelatedArtists(aids, api);
		})
		.then(function(relids){
			userAndRelArtists = userAndRelArtists.concat(relids);
			deferred.resolve(Array.from(new Set(userAndRelArtists)));
		})
		.catch(function(error){
			if(error.message == "timeout"){
				console.log("API TIMEOUT");
				process.exit();
			}
			deferred.reject(error);
		});
	return deferred.promise;
};






