var Q = require('q');
var request = require('request-promise');
var shuffle = require('./shuffle');

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

exports.getArtistPopTracks = function(aid, api){
	var deferred = Q.defer();
	var self = this;
	api.getArtistTopTracks(aid, 'US')
		.then(function(data){
			var allTracks = data.body.tracks;
			var userTracks = allTracks.map(function(track){
				return track.id;
			});
			userTracks = shuffle(userTracks).slice(0, 5);
			deferred.resolve(userTracks);
		})
		.catch(function(error){
			deferred.reject(error);
		});
	return deferred.promise;
};

exports.generateTracksFromUserArtists = function(aids, api){
	var deferred = Q.defer();
	var promiseArray = [];
	var tracks = [];
	for(var i=0; i<aids.length; ++i){
		promiseArray.push(this.getArtistPopTracks(aids[i], api));
	}
	Q.all(promiseArray).done(function(values){
		for(var j=0; j<values.length; ++j){
			tracks = tracks.concat(values[j]);
		}
		deferred.resolve(tracks);
	});
	return deferred.promise;
};

exports.printArtistNames = function(ids, api){
	var deferred = Q.defer();
	api.getArtists(ids)
		.then(function(data){
			data.body.artists.forEach(function(artist){
				console.log(artist.name);
			});
			deferred.resolve("SUCCESS PRINT ARTISTS");
		}, function(error){
			deferred.reject(error);
		});
	return deferred.promise;
}

exports.printArtistNamesFromTracks = function(tids, api){
	api.getTracks(tids)
		.then(function(data){
			console.log("Mood and User intersection artists:");
			var tracks = data.body.tracks;
			var artists = tracks.map(function(track){
				return track.artists[0].name;
			});
			artists = Array.from(new Set(artists));
			artists.forEach(function(artist){
				console.log(artist);
			});
		})
		.catch(function(error){
			console.log(error);
		});
}






