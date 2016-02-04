var utilities = require("../utilities/utilities"),
	ObjectId = require("mongoose").Types.ObjectId,
	playerModule = require('../modules/player'),
	inviteModule = require("../modules/invite"),
	queueModule = require("../modules/queue"),
	gameData = require("../data/game"),
	Q = require('q');


var findGames = function(data, uid){
	var query = {};
	var expectMultiple = false;
	var type = "";
	var options = {};
	
	if(data.gid){
		type = "findOne";
		query = {"_id": new ObjectId(data.gid)};
	} else if (data.gids){
		expectMultiple = true;
		type = "find";
		var queries = [];
		for(var i in data.gids){
			queries.push({"_id":new ObjectId(data.gids[i])});
		}
		query = {"$or":queries};
	}
	return utilities.mongoDB('games', type, query).then(function(gameObjects){
		var gameDataObject = null;
		if(expectMultiple){
			gameDataObject = [];
			for(var i in gameObjects){
				gameDataObject.push(gameObjects[i].toObject());
			}
		} else {
			gameDataObject = gameObjects.toObject();
		}
		return gameDataObject;
	});
	
};
var updateGames = function(gid, updatedData){
	query = {"_id":new ObjectId(gid)};
	return utilities.mongoDB('games', 'findOneAndModify', query, updatedData).then(function(updatedGameObject){
			return updatedGameObject.toObject();
	});
};
var newGame = function(gameData){
	return utilities.mongoDB('games', 'insert', gameData).then(function(gameObject){
		return gameObject.toObject();
	});
};
var findPlayerGames = function(uid){
	var query = {"_id": new ObjectId(uid)};
	return utilities.mongoDB("playerGames", "findOne", query).then(function(playerGamesObject){
		return playerGamesObject.toObject();
	});
};
exports.findGameForUser = function(gid, uid) {
	return findGames({"gid":gid}, uid).then(function(gameDataObject){
		return gameData.sanatizeGameData(gameDataObject, uid);
	});
};
exports.createGame = function(data) {
	var players = data.opponents;
	if(data.inviter != null) {
		players.push(data.inviter);
	}
	return playerModule.findPlayers({uids:players}, null, {"gameStats":true}).then(function(playerGameData){
		var playerGameStats = {};
		for(var i in playerGameData){
			playerGameStats[playerGameData[i]._id] = playerGameData[i].gameStats[data.gameType];
		}
		var newGameData = gameData.setupNewGameData(data, playerGameStats);
		return newGame(newGameData).then(function(gameObject){
			return playerModule.addAllPlayersGame(newGameData.players, gameObject._id).then(function(playerGamesData){
				gameData.getGame(gameObject._id, gameObject);
				if(data.inviter){
					utilities.socketEmit(data.inviter, 'create game', gameObject);
				}
				utilities.socketEmitMultiple(data.opponents, 'create game', gameObject);
				return gameObject;
			});
		});
	});
};
exports.findGamesByPlayerId = function(uid) {
	return findPlayerGames(uid).then(function(playerGames){
		return findGames({"gids" : playerGames.games}, uid).then(function(gameObjects){
			var gameDataObjects = [];
			for(var i in gameObjects){
				gameDataObjects.push(gameData.sanatizeGameData(gameObjects[i]));
			}
			return gameDataObjects;
		});
	});
};
exports.draw = function(uid, gid){
	var query = {"_id": new ObjectId(gid)};
	return findGames({"gid":gid}, uid).then(function(gameDataObject){
		if(gameObject){
			var gameDataObject = gameObject.toObject();
			var game = gameData.getGame(gid, gameDataObject);
			game.draw(uid);
			var currentGameData = game.getData();
			return updateGames(gameDataObject["_id"], currentGameData).then(function(gameObject){
				var accepted = false;
				var opponents = game.getOpponents(uid);
				
				if(currentGameData.draw != ""){
					accepted = true;
				}
				dealWithDrawEmits(opponents, accepted, gid);
				return gameObject;
			});
		}
	});
};
exports.surrender = function(uid, gid){
	var query = {"_id": new ObjectId(gid)};
	return findGames({"gid":gid}, uid).then(function(gameDataObject){
		if(gameDataObject){
			var game = gameData.getGame(gid, gameDataObject);
			game.surrender(uid);
			var currentGameData = game.getData();

			return updateGames(gameDataObject["_id"], currentGameData).then(function(gameObject){
				var accepted = false;
				var opponents = game.getOpponents(uid);
				if(currentGameData.winner != ""){
					accepted = true;
				}
				
				dealWithSurrenderEmits(opponents, accepted, gid);
				return gameObject;
			});
		}
	});
};
exports.act = function(uid, gid, data){console.log('here');
	return findGames({"gid":gid}, uid).then(function(gameDataObject){
		var nextMove = data;
		var game = gameData.getGame(gid, gameDataObject);
		if (game.action(nextMove, uid)){console.log('here');
			var currentGameData = game.getData();
			var opponents = game.getOpponents(uid);
			currentGameData["_id"] = gameDataObject["_id"];
			return updateGames(gameDataObject["_id"], currentGameData).then(function(gameObject){
				if(game.hasWinner) {
					dealWithWinEmits(currentGameData.players, true, gid);
				}
				if(currentGameData.draw == true || currentGameData.draw == "true"){
					dealWithDrawEmits(opponents, true, gid);
				}
				utilities.socketEmitMultiple(opponents, 'action-' + gid, nextMove);
				return gameObject;
			});
		} else {
			throw new Error("illegal move");
		}
	});
};

var dealWithDrawEmits = function(emitTo, done, gid){
	var socketData = {
		gameId : gid,
		accepted: done
	};
	utilities.socketEmitMultiple(emitTo, 'draw', socketData);
	if(done){
		emitToGameOverQueue(emitTo, gid);
	}
};
var dealWithSurrenderEmits = function(emitTo, done, gid){
	var socketData = {
		gameId : gid,
		accepted: done
	};
	utilities.socketEmitMultiple(emitTo, 'surrender', socketData);
	if(done){
		emitToGameOverQueue(emitTo, gid);
	}
};
var dealWithWinEmits = function(emitTo, done, gid){
	utilities.socketEmitMultiple(emitTo, 'game over', gid);
	emitToGameOverQueue(emitTo, gid);
};
var emitToGameOverQueue = function(emitTo, gid){
	var queuId = "determineScoreAfterGame";
	for(var i in emitTo){
		queueModule.emitToDetermineScoreQueue(emitTo[i], gid);
	}
};

exports.findGames = findGames;