var utilities = require("../utilities/utilities"),
	ObjectId = require("mongoose").Types.ObjectId,
	userData = require('../data/user'),
	Q = require("q"),
	config = require("../config/sammedalen.com");

var setupPlayerData = function(data){
	var password = utilities.decryptPasswordHash(data.salt, JSON.parse(data.password));
	data.password = utilities.createToken(password,config.passwordSecret);
	currentUserData = userData.setupNewUserData(data);
	return utilities.getCollection('players').insert(currentUserData).then(function(playerObject){
		var playerData = userData.newUser(playerObject).getData(playerObject.id);
		var playerId = playerObject.id;
		var playerGamesData = {
			"_id": new ObjectId(playerId),
			"games": []
		};
		return utilities.getCollection('playerGames').insert(playerGamesData).then(function(playerGamesResponse){
			return playerData;
		});
	});
};
exports.create = function(data){
	var query = {'username':data.username};
	return utilities.getCollection('players').find(query).then(function(playerObject){
		if(!playerObject[0]){
			return setupPlayerData(data);
		} else {
			throw new Error('username allready exists');
		}
	});
};

exports.login = function(data){
	var password = utilities.decryptPasswordHash(data.salt, data.password);
	var query = {username: data.username};
	return utilities.getCollection('players').find(query).then(function(playerObject){
		if (!playerObject[0]) {
			throw new Error('password and username do not match');
		}
		var playerData = playerObject[0].toObject();
		if (utilities.createToken(password,config.passwordSecret) == playerData.password){
			var pt = userData.newUser(playerData).getData(playerData._id);
			return pt;
		} else {
			throw new Error('password and username do not match');
		}
	});
};
exports.authenticate = function(authToken){
	return utilities.getDataFromToken(authToken).then(function(data){
		if (!data){
			throw new Error("Auth Token has expired");
		}
		var query = {username: data.username};
		return utilities.getCollection('players').find(query).then(function(playerObject){
			if (!playerObject[0]) {
				throw new Error('no such user');
			}
			var playerData = playerObject[0].toObject();
			var pt = userData.newUser(playerData).getData(playerData._id);
			return pt;
		});
	});
};
var find = function(data, inOpt){
	var query = {};
	var queries = [];
	var expectMultiple = false;
	var type = "";
	var options = {};
	
	if(inOpt && inOpt.limit){
		options["limit"] = inOpt.limit;
	}
	if(inOpt && inOpt.random){
		options['random'] = true;
	}
	
	if(data.partialUsername){
		expectMultiple = true;
		type = "find";
		var search = {"username": new RegExp("^" + data.partialUsername, "i")};
		queries.push(search);
		options['limit'] = inOpt.limit || 10;
	}
	if(data.username){
		type = "findOne";
		query['username'] = data.username;
	}
	if(data.usernames){
		type = "find";
		expectMultiple = true;
		for(var i in data.usernames){
			queries.push({"username":data.usernames[i]});
		}
	}
	if(data.uid || data.id){
		type = "findOne";
		var id = data.uid || data.id;
		query["_id"] = new ObjectId(id);
	} else if (data.uids || data.ids){
		type = "find";
		expectMultiple = true;
		var ids = data.uids || data.ids;
		for(var i in ids){
			queries.push({"_id":new ObjectId(ids[i])});
		}
	}
	if(expectMultiple == true){
		query = {"$or":queries};
	}
	return utilities.mongoDB('players', type, query, null, options).then(function(playerObjects){
		var playerDataObject = null;
		if(expectMultiple){
			playerDataObject = [];
			for(var i in playerObjects){
				playerDataObject.push(playerObjects[i].toObject());
			}
		} else {
			playerDataObject = playerObjects.toObject();
		}
		return playerDataObject;
	});
};
exports.findPlayer = function(data, options, requestedData){
	return find(data, options).then(function(playerDataObject){
		var forUserId = null;
		if(options && options.forUserId){
			forUserId = options.forUserId;
		}
		return userData.sanatizeData(playerDataObject, forUserId, requestedData);
	});
};
exports.findPlayers = function(data, options, requestedData){
	return find(data, options).then(function(playerDataObjects){
		var playerData = [];
		var forUserId = null;
		if(options && options.forUserId){
			forUserId = options.forUserId;
		}
		for(var i in playerDataObjects){
			playerData.push(userData.sanatizeData(playerDataObjects[i], forUserId, requestedData));
		}
		return playerData;
	});
};

//only to be use internally
exports.updatePlayerData = function(uid, data){
	var query = {"_id":new ObjectId(uid)};
	return find({uid:uid}).then(function(){
		var user = userData.getUser(uid);
		user.updatePlayerData(data);
		//return utilities.getCollection('players').findOneAndModify(query, user.data).then(function(currentPlayerObject){
		return utilities.mongoDB('players', 'findOneAndModify', query, user.data).then(function(currentPlayerObject){
			return currentPlayerObject[0];
		}).fail(function(err){
			console.log(err);
		});
	});
};
exports.addAllPlayersGame = function(listOfPlayers, gid){
	var promises = [];
	for(var i in listOfPlayers){
		if(listOfPlayers[i] != "computer"){
			var promise = addPlayerGame(listOfPlayers[i], gid);
			promises.push(promise);
		}
	}
	
	return Q.all(promises);
};
var addPlayerGame = function(uid, gid){
	var playerQuery = {"_id": new ObjectId(uid)};
	return utilities.getCollection('playerGames').find(playerQuery).then(function(playerObject){
		var playerData = playerObject[0].toObject();
		playerData.games.push(gid);
		return utilities.getCollection('playerGames').findOneAndModify(playerQuery,playerData).then(function(worked){
			return worked;
		});
	});
};
exports.find = find;
exports.addPlayerGame = addPlayerGame;