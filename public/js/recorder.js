window.AudioContext = window.AudioContext ||
	                      window.webkitAudioContext;
navigator.getUserMedia =
	  navigator.getUserMedia ||
	  navigator.webkitGetUserMedia ||
	  navigator.mozGetUserMedia ||
	  navigator.msGetUserMedia;

var context = new AudioContext();
var meydaAnalyzer = null;
var extractionInterval;
window.source = context.createBufferSource()
source.connect(context.destination);
mfcc = []

function startRecording(){
	navigator.getUserMedia({video: false, audio: true}, function(mediaStream) {
		window.source = context.createMediaStreamSource(mediaStream);
		var options = {
          "audioContext": context, // required
          "source": window.source, // required
          "bufferSize": 512, // required
          "featureExtractors": ["mfcc"],
        };
        meydaAnalyzer = Meyda.createMeydaAnalyzer(options);
		startExtraction();
	},
	function(err) {
		alert("There has been an error accessing the microphone.");
	});
};

function startExtraction(){
	console.log("start recording");
	window.source.connect(context.destination);
	window.extractionInterval = setInterval(function(){
		var featureArray = meydaAnalyzer.get(["mfcc"]);
		// console.log(featureArray);
		mfcc.push(featureArray);
	}, 40)
};

function doneRecording(){
	window.source.disconnect();
	clearInterval(extractionInterval);
	console.log("done recording");
	console.log(mfcc);
	$.ajax({
		type: 'GET',
		url: "/mood",
		dataType: "json",
		contentType: "application/json",
		data: {
			features: mfcc
		},
		success: function(){
			mfcc = [];
		}
	});
};




