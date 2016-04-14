var Q = require('q');
var request = require('request-promise');
var shuffle = require('./shuffle');
var pGen = require('./playlist-gen');

// LOOK AT NOTES.TXT FOR CHANGES TO THIS FUNCTION

// Get list of playlist ids that match search mood such as "happy"
// Extract three random ids from the above list
// Get list of tracks from those playlists whose artist match any one of the user artists
// Return 25 random tracks from above track list
exports.getMoodTracks = function(mood, aids, api){
	var deferred = Q.defer();
	var promiseArray = [];
	var moodTracks = [];
	api.searchPlaylists(mood)
		.then(function(data){
			var playlists = data.body.playlists.items;
			var num = (playlists.length < 4) ? playlists.length : 4;
			playlists = shuffle(playlists);
			for(var i=0; i < num; ++i){
				var promise = pGen.getUserReleventPlaylistTracks(playlists[i].id,
													  		     playlists[i].owner.id,
													  		     aids,
													  		     api);
				promiseArray.push(promise);
			}
			return Q.all(promiseArray);
		})
		.then(function(values){
			for(var i=0; i<values.length; ++i){
				moodTracks = moodTracks.concat(values[i]);
			}
			moodTracks = shuffle(Array.from(new Set(moodTracks)));
			deferred.resolve(moodTracks);
		})	
		.catch(function(error){
			deferred.reject(error);
		});
	return deferred.promise;
}