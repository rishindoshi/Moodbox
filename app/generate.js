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

exports.getMoodArtists = function(mood, api){
	var deferred = Q.defer();
	promiseArray = [];
	moodArtists = [];
	var self = this;
	api.searchPlaylists(mood)
		.then(function(data){
			var playlists = data.body.playlists.items;
			var num = (playlists.length < 4) ? playlists.length : 4;
			for(var i=0; i < num; ++i){
				promiseArray.push(self.playlistArtists(playlists[i].id,
													   playlists[i].owner.id,
													   api));
			}
			return Q.all(promiseArray);
		})
		.then(function(values){
			for(var i=0; i<values.length; ++i){
				moodArtists = moodArtists.concat(values[i]);
			}
			deferred.resolve(Array.from(new Set(moodArtists)));
		})	
		.catch(function(error){
			deferred.reject(error);
		});
	return deferred.promise;
}

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

exports.getUserPlaylistIds = function(userid, api){
	var deferred = Q.defer();
	api.getUserPlaylists(userid)
		.then(function(data){
			var ids = data.body.items.filter(function(playlist){
				return playlist.public;
			}).map(function(playlist){
				return playlist.id;
			});
			ids = ids.slice(0, 4);
			deferred.resolve(ids);
		}, function(error){
			deferred.reject(error);
		});
	return deferred.promise;
};

exports.playlistArtists = function(pid, userid, api){
	var deferred = Q.defer();
	api.getPlaylistTracks(userid, pid)
		.then(function(data){
			var tracks = data.body.items;
			var artists = tracks.filter(function(track){
				return track.track;
			}).map(function(track){
				return track.track.artists[0].id;	
			});
			deferred.resolve(artists);
		})
		.catch(function(error){
			console.log("ERROR in playlistArtists:");
			deferred.reject(error);
		})
	return deferred.promise;
};

exports.allPlaylistArtists = function(pids, userid, api){
	var deferred = Q.defer();
	var promiseArray = [];
	var allArtists = [];
	for(var i=0; i<pids.length; ++i){
		promiseArray.push(this.playlistArtists(pids[i], userid, api));
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
		promiseArray.push(self.relatedArtists(aids[i], api));
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
			userAndRelArtists = userAndRelArtists.concat(aids);
			var numToExtract = (aids.length < 20) ? aids.length : 20; 
			return self.allRelatedArtists(aids.slice(0, numToExtract), api);
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

exports.getArtistPopTracks = function(aid, api){
	var deferred = Q.defer();
	api.getArtistTopTracks(aid, 'US')
		.then(function(data){
			var allTracks = data.body.tracks;
			var userTracks = allTracks.slice(0, 5).map(function(track){
				return track.id;
			});
			deferred.resolve(userTracks);
		})
		.catch(function(error){
			deferred.reject(error);
		});
	return deferred.promise;
};

exports.generateTracks =function(aids, api){
	var deferred = Q.defer();
	var promiseArray = [];
	var trackids = [];
	for(var i=0; i<aids.length; ++i){
		promiseArray.push(this.getArtistPopTracks(aids[i], api));
	}
	Q.all(promiseArray).done(function(values){
		for(var j=0; j<values.length; ++j){
			trackids = trackids.concat(values[j]);
		}
		deferred.resolve(trackids);
	});
	return deferred.promise;
};

exports.makePlaylist = function(tracks, userid, api) {
	var deferred = Q.defer();
	tracks.forEach(function(track, index, tracks) {
		tracks[index] = "spotify:track:" + track;
	});
	api.createPlaylist(userid, "Moodbox", {public: false})
		.then(function(data) {
			var playlistid = data.body.id;
			return api.addTracksToPlaylist(userid, playlistid, tracks);
		})
		.then(function(data){
			//returns playlist obj with tracks in it
			//extract tracks before resolving
			deferred.resolve(data);
		})
		.catch(function(error){
			deferred.reject(error);
		});
	return deferred.promise;
};





