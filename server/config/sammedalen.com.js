module.exports = {
	port : 8081,
	appSecret : "392a2e999862e2e793fc",
	passwordSecret : "6bdd45ea236d398984b3",
	passwordHashLength: 15,
	randomNumberString: "1234567890abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUWXYZ",
	rabbitMQHost: "amqp://localhost",
	queueNames: {
		unrankedTicTacToe : "unrankedTicTacToe",
		rankedTicTacToe : "rankedTicTacToe",
		determineScoreAfterGame : "determineScoreAfterGame "
	},
	currentPlayableGames : [
		"tictactoe"
	]
};
