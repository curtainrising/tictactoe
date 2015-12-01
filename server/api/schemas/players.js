exports.players = {
	username : String,
	password : String,
	gameStats: {},
	token: String
};
exports.gameStats = {
	wins : Number,
	rankedWins: Number,
	loss : Number,
	rankedLoss: Number,
	draw: Number,
	score: Number
};
exports.sanatizedplayer = {
	_id : String,
	username : String,
	gameStats : {},
	token : String
};
exports.sanatizedotherplayer = {
	username : String,
	gameStats : {}
};
