var utilities = require("../utilities/utilities"),
	ObjectId = require("mongoose").Types.ObjectId,
	playerModule = require('../modules/player'),
	inviteModule = require("../modules/invite"),
	gameModule = require("../modules/game"),
	userData = require("../data/user"),
	queueData = require("../data/queue"),
  gameQueuesSchema = require('../api/schemas/gameQueues');
	Q = require('q'),
	config = require("../config/sammedalen.com");

exports.emitToQueueForGame = function(uid, data){
	var gameType = "";
	var queueId = "";
	if(data.gameType == "tictactoe"){
		gameType = "TicTacToe";
	}
	if(data.ranked == "true" || data.ranked == true){
		queueId = "ranked" + gameType;
	} else {
		queueId = "unranked" + gameType;
	}
	queueId = config.queueNames[queueId];
	var newQueueData = {
		userId : uid,
		ranked : data.ranked
	};
	return utilities.rabbitMQEmitPromise(queueId, JSON.stringify(newQueueData));
};
exports.emitToDetermineScoreQueue = function(uid, gid){console.log('emitting');
	var queueId = "determineScoreAfterGame";
	var newQueueData = {
		userId : uid,
		gameId : gid
	};
	utilities.rabbitMQEmit(queueId, JSON.stringify(newQueueData));
};

var setupGameInviteFromPlayerGameQueue = function (userId, playerGameQueueData){
	var name = playerGameQueueData.ranked? "ranked": "unranked";
	var theOpponents = [];
	for(var i in playerGameQueueData.opponents){
		theOpponents.push(playerGameQueueData.opponents[i]);
	}
	theOpponents.push(userId);
	
	return playerModule.findPlayers({uids:theOpponents}, null, {'username':true}).then(function(usernameData){
		var usernames = [];
		for(var i in usernameData){
			usernames.push(usernameData[i].username);
		}
		
		inviteData = {
			name : name + " " + playerGameQueueData.type + " game",
			inviteType: "queue",
			opponents : usernames,
			type: playerGameQueueData.type,
			ranked: playerGameQueueData.ranked
		};
		return inviteModule.createInvite(null, inviteData);
	});
};
exports.leavePlayerGameQueue = function(uid, gqid){
	return getPlayerGameQueue(gqid).then(function(playerGameQueueData){
		return playerModule.find({"uid":uid}).then(function(playerData){
			var score = playerData.gameStats[playerGameQueueData.type].score;
			var newOpponents = [];
			for(var i in playerGameQueueData.opponents){
				if(playerGameQueueData.opponents[i] != uid){
					newOpponents.push(playerGameQueueData.opponents[i]);
				}
			}
			return removeUserFromGameQueue(uid, playerGameQueueData.type, playerGameQueueData.ranked, score).then(function(){
				return saveGameQueue().then(function(){
					playerGameQueueData.opponents = newOpponents;
					var query = {"_id":new ObjectId(gqid)};
					return utilities.getCollection("playerGameQueues").findOneAndModify(query, playerGameQueueData).then(function(){
            return utilities.getCollection('playerGameQueues').find(query).then(function(playerGameQueueObject){
						  return playerGameQueueObject[0];
            });
					});
				});
			});
		});
	});
};
var createPlayerGameQueue = function(userId, ranked, type){
	var playerGameQueueData = queueData.setupNewPlayerGameQueueData(userId, ranked, type);
	return utilities.getCollection("playerGameQueues").insert(playerGameQueueData).then(function(playerGameQueuObject){
		utilities.socketEmit(userId,"gameQueue", playerGameQueuObject);
		return playerGameQueuObject.id;
	});
};
var addOpponentToPlayerGameQueue = function(userId, gqid){
	return getPlayerGameQueue(gqid).then(function(playerGameQueuData){
		playerGameQueueData.opponents.push(userId);
		var query = {"_id":gqid};
		return utilities.getCollection("PlayerGameQueues").findOneAndModify(query, playerGameQueueData).then(function(playerGameQueueObject){
			return playerGameQueueObject.id;
		});
	});
};
var getPlayerGameQueue = function(gqid){
	var query = {"_id":gqid};
	return utilities.getCollection('playerGameQueues').find(query).then(function(playerGameQueueObject){
		return playerGameQueueObject[0].toObject();
	});
};
exports.findPlayerGameQueueByPlayerId = function(uid){
	var query = {opponents : uid};
	return utilities.getCollection('playerGameQueues').find(query).then(function(playerGameQueues){
		return playerGameQueues;
	});
};

var deletePlayerGameQueue = function(gqid, uid){
	var query = {"_id":gqid};
	return getPlayerGameQueue(gqid).then(function(playerGameQueueData){
		return utilities.getCollection("playerGameQueues").findOneAndRemove(query).then(function(){
			var promises = [];
			for(var i in playerGameQueueData.opponents){
				if(playerGameQueueData.opponents[i] != uid){
					utilities.socketEmit(playerGameQueueData.opponents[i], "remove gameQueue", playerGameQueueData["_id"]);
					promises.push(removeUserFromGameQueue(playerGameQueueData.opponents[i], playerGameQueueData.type, playerGameQueueData.ranked));
				}
			}
			Q.all(promises).then(function(){
				saveGameQueue();
			});
			return true;
		});
	});
	
};
exports.getPlayerGameQueue = getPlayerGameQueue;
exports.deletePlayerGameQueue = deletePlayerGameQueue;


var unrankedTicTacToeRabbitMQConsumer = function(message){
	var tempMessage = JSON.parse(message);
	return searchUnrankedTicTacToeQueue(tempMessage.userId);
};
var rankedTicTacToeRabbitMQConsumer = function(message){
	var tempMessage = JSON.parse(message);
	return searchRankedTicTacToeQueue(tempMessage.userId);
};
var searchUnrankedTicTacToeQueue = function(uid){
	var result = queueData.searchUnrankedTicTacToeQueue(uid);
	return dealWithTicTacToeSearchResult(uid, false, 'tictactoe','UnrankedTicTacToe',result);
};
var searchRankedTicTacToeQueue = function(uid){
	//determine player rank
	return playerModule.find({"uid":uid}).then(function(playerObject){
		var score = playerObject.gameStats.tictactoe.score || 0;
		var result = queueData.searchRankedTicTacToeQueue(uid, score);
		return dealWithTicTacToeSearchResult(uid, true, 'tictactoe','RankedTicTacToe',result, score);
	});
};
var dealWithTicTacToeSearchResult = function(uid, ranked, type, queueName, result, score){
	if (result == false){
		return createPlayerGameQueue(uid, ranked, type).then(function(gqid){
			queueData['addUserToGameQueue'](uid, gqid, ranked, type, score);
			saveGameQueue();
		});
	} else if (result != true){
		saveGameQueue().then(function(){
			return getPlayerGameQueue(result).then(function(playerGameQueueData){
				return setupGameInviteFromPlayerGameQueue(uid, playerGameQueueData).then(function(){
					return deletePlayerGameQueue(result);
				});
			});
		});
	}
};
var determineScore = function(message){
	var messageObj = JSON.parse(message);
	var userId = messageObj.userId;
	var gameId = messageObj.gameId;
	//return gameModule.findGameByGid(gameId).then(function(gameObject){
		//var gameDataObject = gameObject.toObject();
	return gameModule.findGames({"gid":gameId}).then(function(gameDataObject){
		var ranked = gameDataObject.ranked;
		return playerModule.find({"uid":userId}).then(function(playerData){
			var gameStats = playerData.gameStats;
			var oldScore = gameStats[gameDataObject.type].score;
			gameStats = queueData.determineScore(userId, ranked, gameDataObject, gameStats);
			var newScore = gameStats[gameDataObject.type].score;
			if (newScore != oldScore){
				queueData.updateRankedGameQueue(userId, gameDataObject.type, oldScore, newScore);
			}
			var changedData = {
				"gameStats": gameStats
			};
			return saveGameQueue().then(function(){
				return playerModule.updatePlayerData(userId, changedData);
			});
			
		});
	});
};
var setupGameQueue = function(){
	return utilities.getCollection('gameQueues').findAll().then(function(queueObject){
    if (!queueObject || !queueObject[0]) {
      utilities.getCollection("gameQueues").insert(gameQueuesSchema.gameQueues).then(function(insertedQueueObject){
        var queueDataObject = insertedQueueObject.toObject();
        queueData.setupGameQueues(queueDataObject);
      });
    } else {
      var queueDataObject = queueObject[0].toObject();
      queueData.setupGameQueues(queueDataObject);
    }
	});
};
var saveGameQueue = function(){
	return utilities.getCollection('gameQueues').findAll().then(function(queueObject){
		var queueDataObject = queueObject[0].toObject();
		var newQueueData = queueData.saveGameQueues(queueDataObject);
		var query = {"_id":queueObject[0]._id};
		return utilities.getCollection('gameQueues').findOneAndModify(query, newQueueData);
	});
};
var removeUserFromGameQueue = function(uid, type, ranked){
	return playerModule.find({"uid":uid}).then(function(playerDataObject){
		queueData.removeUserFromGameQueue(uid, type, ranked, playerDataObject.gameStats[type].score);
	});
};
exports.setupRabbitConsumers = function(){
	setupGameQueue().then(function(){
		utilities.rabbitMQAddTask('determineScoreAfterGame', determineScore);
		utilities.rabbitMQAddTask('unrankedTicTacToe', unrankedTicTacToeRabbitMQConsumer);
		utilities.rabbitMQAddTask('rankedTicTacToe', rankedTicTacToeRabbitMQConsumer);
	});
	
};