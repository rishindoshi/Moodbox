module.exports = function() {
	questions = [
		"How was your day today",
		"How are you feeling",
		"What is the weather like",
		"What did you do today",
		"What was your favorite part about the day",
		"Why does the sun rise"

	]
	var num = Math.floor((Math.random() * 1000) % questions.length)
	return questions[num] + "?";
}