var Q = require('q');
var request = require('request-promise');
var promiseRetry = require('promise-retry');

exports.shuffle = function(array) {
  var currentIndex = array.length, temporaryValue, randomIndex;
  // While there remain elements to shuffle...
  while (0 !== currentIndex) {
    // Pick a remaining element...
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex -= 1;
    // And swap it with the current element.
    temporaryValue = array[currentIndex];
    array[currentIndex] = array[randomIndex];
    array[randomIndex] = temporaryValue;
  }
  return array;
}

exports.infoTracks = function(tids, api){
	var deferred = Q.defer();
	api.getTracks(tids)
		.then(function(data){
			var trackObjs = data.body.tracks.map(function(track){
				return {
					id: track.id,
					title: track.name,
					url: track.preview_url,
					img: track.album.images[0].url	
				};
			});
			deferred.resolve(trackObjs);
		})
		.catch(function(error){
			deferred.reject(error);
		});
	return deferred.promise;
};

exports.playlistTracks = function(pid, owner, aids, api){
	var deferred = Q.defer();
	var self = this;
	api.getPlaylistTracks(owner, pid)
		.then(function(data){
			var tracks = data.body.items;
			var artists = tracks.filter(function(track){
				return track.track;
			}).map(function(track){
				return track.track.artists[0].id;
			});
			tracks = tracks.filter(function(track){
				return (track.track) && 
					   (aids.indexOf(track.track.artists[0].id) != -1);
			}).map(function(track){
				return track.track.id;
			});
			// tracks = self.shuffle(tracks).slice(0, 4);
			deferred.resolve({artists: artists, tracks: tracks});
		})
		.catch(function(error){
			deferred.reject(error);
		});
	return deferred.promise;
};

exports.getMoodArtists = function(mood, aids, api){
	var deferred = Q.defer();
	promiseArray = [];
	moodArtists = [];
	moodTracks = [];
	var self = this;
	api.searchPlaylists(mood)
		.then(function(data){
			var playlists = data.body.playlists.items;
			var num = (playlists.length < 5) ? playlists.length : 5;
			playlists = self.shuffle(playlists);
			for(var i=0; i < num; ++i){
				promiseArray.push(self.playlistTracks(playlists[i].id,
													  playlists[i].owner.id,
													  aids,
													  api));
			}
			return Q.all(promiseArray);
		})
		.then(function(values){
			for(var i=0; i<values.length; ++i){
				moodArtists = moodArtists.concat(values[i].artists);
				moodTracks = moodTracks.concat(values[i].tracks);
			}
			var obj = {
				artists: Array.from(new Set(moodArtists)),
				tracks: self.shuffle(Array.from(new Set(moodTracks))).slice(0, 15)
			}
			deferred.resolve(obj);
		})	
		.catch(function(error){
			deferred.reject(error);
		});
	return deferred.promise;
}

exports.printArtistNames = function(ids, api){
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
	var self = this;
	api.getUserPlaylists(userid)
		.then(function(data){
			var ids = data.body.items.filter(function(playlist){
				return playlist.public;
			}).map(function(playlist){
				// console.log(playlist.name);
				return playlist.id;
			});
			ids = self.shuffle(ids).slice(0, 5);
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
		});
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
			console.log("Got " + pids.length + " of the users playlists");
			return self.allPlaylistArtists(pids, userid, api);
		})
		.then(function(aids){
			userAndRelArtists = userAndRelArtists.concat(aids);
			var numToExtract = (aids.length < 20) ? aids.length : 20; 
			return self.allRelatedArtists(self.shuffle(aids).slice(0, numToExtract), api);
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
	var self = this;
	api.getArtistTopTracks(aid, 'US')
		.then(function(data){
			var allTracks = data.body.tracks;
			var userTracks = allTracks.map(function(track){
				return {
					id: track.id,
					title: track.name,
					url: track.preview_url,
					img: track.album.images[0].url
				};
			});
			userTracks = self.shuffle(userTracks).slice(0, 5);
			deferred.resolve(userTracks);
		})
		.catch(function(error){
			deferred.reject(error);
		});
	return deferred.promise;
};

exports.generateTracks = function(aids, api){
	var deferred = Q.defer();
	var promiseArray = [];
	var trackObjs = [];
	for(var i=0; i<aids.length; ++i){
		promiseArray.push(this.getArtistPopTracks(aids[i], api));
	}
	Q.all(promiseArray).done(function(values){
		for(var j=0; j<values.length; ++j){
			trackObjs = trackObjs.concat(values[j]);
		}
		deferred.resolve(trackObjs);
	});
	return deferred.promise;
};

exports.makePlaylist = function(trackObjs, userid, api) {
	var deferred = Q.defer();
	var trackIds = [];
	trackObjs.forEach(function(trackObj, index) {
		trackIds.push("spotify:track:" + trackObj.id);
	});
	api.createPlaylist(userid, "Moodbox", {public: false})
		.then(function(data) {
			var playlistid = data.body.id;
			return api.addTracksToPlaylist(userid, playlistid, trackIds);
		})
		.then(function(data){
			//returns playlist obj with tracks in it
			//extract tracks before resolving
			deferred.resolve(data.body);
		})
		.catch(function(error){
			deferred.reject(error);
		});
	return deferred.promise;
};





