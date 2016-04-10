// Here we get all the tracks from all the user's playlists
// we want to extract all the unique artists from each of these tracks
// we then want this list of artists and add to it related artists
// we then want to extract playlists that match input mood (happy/sad/etc) by doing play
// list search on spotifyAPI
// we will again extract unique artists from these playlists and also add related artists
// now find intersection of artists between above two lists
var Q = require('q');
var request = require('request-promise');
var promiseRetry = require('promise-retry');

exports.getMoodBasedPlaylist = function(mood, api){
	var deferred = Q.defer();
	promiseArray = [];
	moodArtists = [];
	var self = this;
	api.searchPlaylists(mood)
		.then(function(data){
			var playlists = data.body.playlists.items;
			for(var i=0; i < playlists.length; ++i){
				promiseArray.push(self.getPlaylistArtists(playlists[i].owner.id,
														  playlists[i].id, api));
			}
			Q.all(promiseArray).done(function(values){
				for(var j=0; j < values.length; ++j){
					moodArtists = moodArtists.concat(values[j]);
				}
				deferred.resolve(Array.from(new Set(moodArtists)));
			}, function(error){
				deferred.reject(error);
			});
		}, function(error){
			deferred.reject(error);
		});
	return deferred.promise;
}

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
			deferred.reject(error);
		});
	return deferred.promise;
};

exports.printArtistNames = function(ids, api){
	console.log(ids);
	api.getArtists(ids)
		.then(function(data){
			data.body.artists.forEach(function(artist){
				console.log(artist.name);
			});
		}, function(error){
			console.log("ERROR printArtistNames");
		});
}

exports.playlistTracks = function(pid, userid, api){
	var deferred = Q.defer();
	api.getPlaylistTracks(userid, pid)
		.then(function(data){
			var tracks = data.body.items;
			var artists = tracks.map(function(track){
				return track.track.artists[0].id;
			});
			deferred.resolve(artists);
		})
		.catch(function(error){
			console.log("ERROR in playlistTracks:");
			deferred.reject(error);
		})
	return deferred.promise;
};

exports.allPlaylistArtists = function(pids, userid, api){
	var deferred = Q.defer();
	var promiseArray = [];
	var allArtists = [];
	for(var i=0; i<pids.length; ++i){
		promiseArray.push(this.playlistTracks(pids[i], userid, api));
	}
	Q.all(promiseArray).done(function(values){
		for(var j=0; j<values.length; ++j){
			allArtists = allArtists.concat(values[j]);
		}
		deferred.resolve(allArtists);
	}, function(error){
		deferred.reject(error);
	});
	return deferred.promise;
};

exports.relatedArtists = function(aid, api){
	var deferred = Q.defer();
	var req_url = "https://api.spotify.com/v1/artists/" + aid + "/related-artists"
	var rel_req_options = {
		url: req_url,
		qs: {country: 'US'},
		method: 'GET'
	};
	request(rel_req_options)
		.then(function(res){
			var data = JSON.parse(res);
			var ids = data.artists.map(function(artist){
				return artist.id;
			});
			deferred.resolve(ids);
		})
		.catch(function(error){
			if(error.statusCode == 429){
				var waitTime = error.response.headers["retry-after"] * 1000;
				deferred.reject("timeout");
			}
		});
	return deferred.promise;
}

exports.allRelatedArtists = function(aids, api){
	var deferred = Q.defer();
	var promiseArray = [];
	var allRelated = [];
	var self = this;
	for(var i=0; i<aids.length; ++i){
		promiseArray.push(self.relatedArtists(aids[i], api).delay(200));
	}
	Q.all(promiseArray).done(function(values){
		for(var j=0; j<values.length; ++j){
			allRelated = allRelated.concat(values[j]);
		}
		deferred.resolve(allRelated);
	}, function(error){
		deferred.reject(error);
	});
	return deferred.promise;
};

exports.getArtists = function(userid, api){
	var deferred = Q.defer();
	var userAndRelArtists = [];
	var self = this;
	this.getUserPlaylistIds(userid, api)
		.then(function(pids){
			return self.allPlaylistArtists(pids, userid, api);
		})
		.then(function(aids){
			console.log(aids.length);
			userAndRelArtists = userAndRelArtists.concat(aids);
			return self.allRelatedArtists(aids, api);
		})
		.then(function(relids){
			console.log(relids.length);
			userAndRelArtists = userAndRelArtists.concat(relids);
			deferred.resolve(Array.from(new Set(userAndRelArtists)));
		})
		.catch(function(error){
			if(error.message == "timeout"){
				console.log("API TIMEOUT");
			}
			deferred.reject(error);
		});
	return deferred.promise;
};







