/* Score function to classify mood between
	0 - Very Sad
	1 - Sad
	2 - Neutral
	3 - Happy
	4 - Very Happy */

module.exports = function(classification, sentiment, comparative) {

	// Calculate score
	var score = sentiment.score;

	console.log("SCORE:", score);

	var mood = "";
	if (score <-3)
		mood = "very sad"
	else if (score <= -1) {
		mood = "sad"
	} else if (score >= 3) {
		mood = "very happy"
	} else if (score >= 1) {
		mood = "happy"
	} else {
		mood = "neutral"
	}

	return mood;
		
};