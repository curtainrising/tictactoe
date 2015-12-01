exports.searchUnrankedTicTacToeQueue = function(uid){
	for(var i in queues["unrankedTicTacToe"]){
		if(uid != i) {
			var playerGameQueueId = queues["unrankedTicTacToe"][i];
			return playerGameQueueId;
		} else {
			return true;
		}
	}
	return false;
};
exports.searchRankedTicTacToeQueue = function(uid, score){
	var limit = 10;
	var searched = false;
	var searchScore = 0;
	while(!searched){
		if(queues["rankedTicTacToe"][score + searchScore]) {
			for(var i in queues["rankedTicTacToe"][score + searchScore]){
				if(uid != i) {
					var playerGameQueueId = queues["rankedTicTacToe"][score + searchScore][i];
					return playerGameQueueId;
				} else {
					return true;
				}
			}
		}
		if (searchScore == limit){
			searched = true;
		}
		var nextSearchScore = searchScore;
		if(nextSearchScore >= 0){
			nextSearchScore = nextSearchScore + 1;
		}
		nextSearchScore *= -1;
		if(score + nextSearchScore < 0) {
			nextSearchScore *= -1;
		}
		searchScore = nextSearchScore;
	}
	return false;
};

exports.addUserToGameQueue = function(uid, gqid, ranked, type, score){
	queueName = ranked?"ranked":"unranked";
	if(type == "tictactoe"){
		queueName += "TicTacToe";
	}
	if(score != null){
		if(!queues[queueName][score]){
			queues[queueName][score] = {};
		}
		queues[queueName][score][uid] = gqid;
	} else {
		queues[queueName][uid] = gqid;
	}
};
exports.removeUserFromGameQueue = function(uid, type, ranked, score){
	var queueName = "";
	if(ranked == "true" || ranked == true){
		queueName = "ranked";
	} else {
		queueName = "unranked";
	}
	if(type == "tictactoe"){
		queueName += "TicTacToe";
	}
	if(!queues[queueName]){
		return null;
	}
	if((ranked == true || ranked == "true") && score != null && queues[queueName][score]){
		delete queues[queueName][score][uid];
	} else {
		delete queues[queueName][uid];
	}
};
exports.updateRankedGameQueue = function(uid, type, oldScore, newScore){
	if(type == "tictactoe"){
		queueName = "rankedTicTacToe";
	}
	if (queues[queueName][oldScore] && queues[queueName][oldScore][uid]) {
		if(!queues[queueName][newScore]){
			queues[queueName][newScore] = {};
		}
		queues[queueName][newScore][uid] = queues[queueName][oldScore][uid];
		delete queues[queueName][oldScore][uid];
	}
};
exports.determineScore = function(userId, ranked, gameData, gameStats){
	var opponentsScores = [];
	var scoreChange = 0;
	var gameOverType = "";
	var gameType = "";
	if (gameData.winner == "" && gameData.draw != ""){
		gameOverType = "draw";
	} else if (gameData.players[gameData.winner] == userId){
		gameOverType = "win";
	} else {
		gameOverType = "loss";
	}
	for(var i in gameData.playersById){
		if(i != userId){
			opponentsScores.push(gameData.playerScores[i]);
		}
	}
	if(gameData.type == "tictactoe"){
		scoreChange = determineScoreChangeTicTacToe(gameData.playerScores[userId], opponentsScores, gameOverType);
	}
	gameStats = changeGameStats(gameData.type, ranked, scoreChange, gameOverType, gameStats);
	return gameStats;
};
var changeGameStats = function(gameType, ranked, scoreChange, gameOverType, gameStats){
	gameStats[gameType].score += scoreChange;
	if(gameOverType == "win"){
		gameStats[gameType].wins += 1;
		if(ranked == true || ranked == "true"){
			gameStats[gameType].rankedWins += 1;
		}
	} else if (gameOverType == "loss"){
		gameStats[gameType].loss += 1;
		if(ranked == true || ranked == "true"){
			gameStats[gameType].rankedLoss += 1;
		}
	} else if (gameOverType == "draw"){
		gameStats[gameType].draw += 1;
	}
	return gameStats;
};
var determineScoreChangeTicTacToe = function(playerScore, opponentsScores, gameFinishType){
	var playerScoreChange = 0;
	if(gameFinishType == "win"){
		for(var i in opponentsScores){
			if(playerScore >= opponentsScores[i]){
				playerScoreChange += 1;
			} else if (playerScore < opponentsScores[i]){
				playerScoreChange += 2;
			}
		}
	} else if (gameFinishType == "draw"){
		
	} else if (gameFinishType == "loss"){
		for(var i in opponentsScores){
			if(playerScore >= opponentsScores[i]){
				playerScoreChange -= 2;
			} else if (playerScore < opponentsScores[i]){
				playerScoreChange -= 1;
			}
		}
	}
	if (playerScore + playerScoreChange <=0){
		playerScoreChange = -1 * playerScore;
	}
	return playerScoreChange;
};

queues = {};
exports.setupGameQueues = function(gameQueueData){
	for(var i in gameQueueData){
		if(i != "_id" && gameQueueData[i]){
			queues[i] = gameQueueData[i];
		}
	}
};
exports.saveGameQueues = function(gameQueueData){
	for(var i in queues){
		if(gameQueueData[i]){
			gameQueueData[i] = queues[i];
		}
	}
	return gameQueueData;
};

exports.setupNewPlayerGameQueueData = function(userId, ranked, type){
	var name = ranked? "ranked": "unranked";
	var playerGameQueueData = {
		type: type,
		opponents : [userId],
		ranked: ranked,
		time : new Date().getTime()
	};
	return playerGameQueueData;
};
