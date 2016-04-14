var Q = require('q');
var shuffle = require('./shuffle');

exports.getUserReleventPlaylistTracks = function(pid, owner, aids, api){
	var deferred = Q.defer();
	var self = this;
	api.getPlaylistTracks(owner, pid)
		.then(function(data){
			var tracks = data.body.items;
			tracks = tracks.filter(function(track){
				return (track.track) && 
					   (aids.indexOf(track.track.artists[0].id) != -1);
			}).map(function(track){
				return track.track.id;
			})
			deferred.resolve(tracks);
		})
		.catch(function(error){
			deferred.reject(error);
		});
	return deferred.promise;
};

exports.getArtistsFromPlaylist = function(pid, userid, api){
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

exports.getArtistsFromPlaylists = function(pids, userid, api){
	var deferred = Q.defer();
	var promiseArray = [];
	var allArtists = [];
	for(var i=0; i<pids.length; ++i){
		promiseArray.push(this.getArtistsFromPlaylist(pids[i], userid, api));
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