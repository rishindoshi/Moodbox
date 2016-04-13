module.exports = function() {
	questions = [
		"How was your day today",
		"How are you feeling",
		"What did you do today",
	]
	var num = Math.floor((Math.random() * 1000) % questions.length)
	return questions[num] + "?";
}