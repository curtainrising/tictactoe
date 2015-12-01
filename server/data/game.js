var ticTacToeGame = require("./gameLogic/ticTacToe");

var games = {};
var createGame = function(data){
	var id = data.id || data._id;
	if(data.type && data.type == "tictactoe"){
		games[id] = ticTacToeGame.newGame(data);
	}
	return games[id];
};
exports.getGame = function(id,data){
	if(games[id]){
		return games[id];
	} else if(data){
		return createGame(data);
	}
	return null;
};
exports.setupNewGameData = function(data, playerGameStats){
	if(data.gameType && data.gameType == "tictactoe"){
		return ticTacToeGame.setupNewGameData(data, playerGameStats);
	}
	return null;
};
exports.sanatizeGameData = function(gameData, uid){
	if(gameData.type == "tictactoe"){
		return ticTacToeGame.sanatizeGameData(gameData, uid);
	}
};
