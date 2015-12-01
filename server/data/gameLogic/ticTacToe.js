var utilities = require("../../utilities/utilities");

var ticTacToeGame = function(data){
	this.row = 3;
	this.column = 3;
	this.data = data;
	this.hasWinner = false;
	this.numberOfMoves = data.moves.length;
	if(this.numberOfMoves == 0 && this.data.players[0] == "computer"){
		this.doComputerMove();
	}
	return this;
};

ticTacToeGame.prototype.getOpponents = function(uid){
	var opponents = [];
	for(var i in this.data.playersById){
		if(this.data.playersById[i] != uid){
			opponents.push(i);
		}
	}
	return opponents;
};
ticTacToeGame.prototype.getData = function(uid){
	return utilities.sanatize("ticTacToeGames", "ticTacToeGames", this.data);
};
ticTacToeGame.prototype.doComputerMove = function(){
	console.log('here');
};
ticTacToeGame.prototype.verifyMove = function(moveData, uid){
	var column = moveData.column;
	var row = moveData.row;

	if(this.data.currentPlayer != moveData.player){
		return false;
	}
	if(this.data.players[0] != uid && this.data.players[1] != uid) {
		return false;
	}
	if(column < this.column && row < this.row && this.data.currentSetup[column][row] == ""){
		return true;
	}
	return false;
};
ticTacToeGame.prototype.move = function(moveData, uid){
	if(this.verifyMove(moveData, uid)){
		
		if(moveData.player == 0){
			this.data.currentSetup[moveData.column][moveData.row] = "x";
		} else {
			this.data.currentSetup[moveData.column][moveData.row] = "o";
		}
		
		this.data.moves.push(moveData);
		this.data.currentPlayer = (Number(this.data.currentPlayer) + 1) % Number(this.data.numberOfPlayers);
		this.numberOfMoves++;
		if(this.testWin(moveData)){
			if(this.data.winner == ""){
				this.data.winner = moveData.player;
			}
			this.data.endSetup = this.data.currentSetup;
		}
		if (this.data.players[this.data.currentPlayer] == "computer"){
			this.doComputerMove();
		}
		console.log('here');
		return true;
	}
	return false;
};
ticTacToeGame.prototype.action = function(data, uid){
	if(data.move){
		return this.move(data.move, uid);
	}
};
ticTacToeGame.prototype.catchUp = function(data){
	return null;
};
ticTacToeGame.prototype.testWin = function(moveData){
	var b = this.data.currentSetup;
	var column = Number(moveData.column);
	var row = Number(moveData.row);
	var rowless = (row +2)%3;
	var rowplus = (row +1)%3;
	var columnless = (column +2)%3;
	var columnplus = (column +1)%3;
	//check row
	if (b[column][row] == b[columnless][row] && b[column][row] == b[columnplus][row]){
		this.data.winString = b[column][row] + " won in row";
		this.hasWinner = true;
	}
	//check column
	if (b[column][row] == b[column][rowless] && b[column][row] == b[column][rowplus]){
		this.data.winString = b[column][row] + " won in column";
		this.hasWinner = true;
	}
	
	//check diag
	if((column == 0 && row !=1) || (column != 1 && row == 2) || (column ==1 && row == 1)){
		//top left or bottom right or middle
		if((row == 0 && column == 0) || (row == 2 && column == 2) || (row == 1 && column == 1)) {
			//check left to right diagonal
			if(b[column][row] == b[columnless][rowless] && b[column][row] == b[columnplus][rowplus]){
				this.data.winString = b[column][row] + " won in diagonal";
				this.hasWinner = true;
			}
		}
		//not top left or bottom right
		if((column == 0 && row == 2) || (column == 2 && row == 0)) {
			// check right to left diagonal
			if(b[column][row] == b[columnless][rowplus] && b[column][row] == b[columnplus][rowless]){
				this.data.winString = b[column][row] + " won in diagonal";
				this.hasWinner = true;
			}
		}
	}
	if (this.hasWinner) {
		return true;
	}
	if(this.numberOfMoves >= this.column * this.row){
		this.data.draw = true;
		return true;
	}
	return false;
};
ticTacToeGame.prototype.draw = function(uid){
	if(this.data.requestedDraw == "") {
		this.data.requestedDraw = uid;
		this.data.acceptedDraw[uid] = true;
	} else if (this.data.requestedDraw == uid || this.data.acceptedDraw[uid]) {
		throw new Error("You allready requested Draw");
	} else if(!this.data.acceptedDraw[uid]){
		this.data.acceptedDraw[uid] = true;
		this.data.draw = true;
	}
	if(this.data.playersById[uid] == null){
		throw new Error("only players can request a draw");
	}
};
ticTacToeGame.prototype.surrender = function(uid){
	var opponentIds = [];
	var numberOfPlayersSurrendered = 0;
	var notAcceptedId = "";
	var hasWinner = false;

	if(this.data.playersById[uid] == null){
		throw new Error("only players can request a surrender");
	}
	if (this.data.surrendered[uid] == true) {
		throw new Error("You allready requested a surrender");
	}

	for(var i in this.data.players){
		if(this.data.surrendered[this.data.players[i]] == true){
			numberOfPlayersSurrendered++;
		} else {
			notAcceptedId = this.data.players[i];
		}
	}

	if(numberOfPlayersSurrendered < this.data.numberOfPlayers - 1) {
		this.data.surrendered[uid] = true;
	} else if(numberOfPlayersSurrendered == this.data.numberOfPlayers - 1){
		this.data.winner = notAcceptedId;
		this.data.winString = notAcceptedId + " won because opponents surrendered";
		this.hasWinner = true;
	}
			
};
exports.addPlayerScores = function(gameData, playerScores){
	
};
exports.sanatizeGameData = function(data, uid){
	return utilities.sanatize("ticTacToeGames", "ticTacToeGames", data);
};
exports.setupNewGameData = function(data, playerGameStats){
	var coinFlip = Math.floor(Math.random() * 2);
	var numberOfPlayers = 2;
	var playerX;
	var playerY;
	var player1;
	var player2;
	if(data.opponents.length >1){
		player1 = data.opponents[0];
		player2 = data.opponents[1];
	} else if(data.inviteType == "computer"){
		player1 = data.inviter;
		player2 = "computer";
	} else {
		player1 = data.inviter;
		player2 = data.opponents[0];
	}
	if(coinFlip == 0) {
		playerX = player1;
		playerY = player2;
	} else {
		playerY = player1;
		playerX = player2;
	}
	var board = {
		0 : {0:'',1:'',2:''},
		1 : {0:'',1:"",2:''},
		2 : {0:'',1:'',2:''}
	};
	var gameData = {
		name : data.gameName,
		type: "tictactoe",
		ranked: data.ranked,
		numberOfPlayers: 2,
		players: {
			0: playerX,
			1: playerY
		},
		playersById: {},
		playerScores: {},
		currentPlayer: 0,
		winner : "",
		winString: "",
		draw: "",
		requestedDraw: "",
		acceptedDraw: {},
		surrendered: {},
		startSetup: board,
		moves : [],
		currentSetup: board,
		endSetup: board
	};
	
	gameData.playersById[playerX] = 0;
	gameData.playersById[playerY] = 1;
	gameData.playerScores[playerX] = playerGameStats[playerX][gameData.type]['score'];
	gameData.playerScores[playerY] = playerGameStats[playerY][gameData.type]['score'];
	gameData.acceptedDraw[playerX] = false;
	gameData.acceptedDraw[playerY] = false;
	gameData.surrendered[playerX] = false;
	gameData.surrendered[playerY] = false;
	
	return gameData;
};
exports.newGame = function(data){
	return new ticTacToeGame(data);
};
