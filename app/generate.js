var Q = require('q');
var artistGen = require('./music-gen/artist-gen');
var pListGen = require('./music-gen/playlist-gen');
var userGen = require('./music-gen/user-music-gen');
var moodGen = require('./music-gen/mood-music-gen');
var shuffle = require('./music-gen/shuffle');

exports.infoTracks = function(tids, api){
	var deferred = Q.defer();
	api.getTracks(tids)
		.then(function(data){
			var trackObjs = data.body.tracks.map(function(track){
				return {
					id: track.id,
					title: track.name,
					url: track.preview_url,
					img: track.album.images[0].url,
					artist: track.artists[0].name
				};
			});
			deferred.resolve(trackObjs);
		})
		.catch(function(error){
			deferred.reject(error);
		});
	return deferred.promise;
};

exports.generatePlaylist = function(userid, mood, api){
	var self = this;
	var deferred = Q.defer();
	var userTopAndRelArtists = [];
	var moodTracks = [];
	userGen.getSpotifyBasedTopArtists(userid, api)
		.then(function(aids){
			userTopAndRelArtists = aids;
			console.log(aids.length + " user top and related artists");
			return moodGen.getMoodTracks(mood, aids, api);
		})
		.then(function(tids){
			moodTracks = tids;
			console.log(tids.length + " user relevent mood tracks");
			artistGen.printArtistNamesFromTracks(tids, api);
			var trackArtists = shuffle(userTopAndRelArtists).slice(0, 30);
			return artistGen.generateTracksFromUserArtists(trackArtists, api);
		})
		.then(function(tids){
			var numTracksToAdd = (50 - moodTracks.length);
			if(numTracksToAdd > 0){
				tids = shuffle(tids).slice(0, numTracksToAdd);
				moodTracks = moodTracks.concat(tids);
				console.log("Adding " + numTracksToAdd + " tracks to playlist based on user");
			}	
			return self.infoTracks(moodTracks, api);
		})
		.then(function(trackObjs){
			moodTracks = trackObjs;
			console.log(moodTracks.length + " total playlist tracks");
			return pListGen.makePlaylist(trackObjs, userid, api);
		})
		.then(function(playlist){
			deferred.resolve({
				pid: playlist.snapshot_id,
				tracks: moodTracks,
				mood: mood
			});
		})
		.catch(function(error){
			deferred.reject(error);
		});
	return deferred.promise;
};





