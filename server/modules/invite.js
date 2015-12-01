var utilities = require("../utilities/utilities");
var ObjectId = require("mongoose").Types.ObjectId;
var playerModule = require('../modules/player');
var Q = require('q');

var createInvite = function(uid, gameInviteData) {
	var data = {
		gameName: gameInviteData.name,
		inviteType: gameInviteData.inviteType,
		inviter : uid,
		opponents : [],
		gameType : gameInviteData.type,
		ranked : gameInviteData.ranked,
		time: new Date().getTime()
	};
	data.accepted = {};
	var requestedData = {
		"_id" : true
	};
	return playerModule.findPlayers({usernames:gameInviteData.opponents}, null, requestedData).then(function(playerIds){
		if(playerIds.length == 0){
			throw new Error("no users");
		}
		data.opponents = [];
		for(var i in playerIds){
			data.opponents.push(String(playerIds[i]._id));
			data.accepted[playerIds[i]._id] = false;
		}
		return utilities.getCollection("gameInvites").insert(data).then(function(inviteData){
			for(var i in playerIds){
				utilities.socketEmit(playerIds[i]._id, 'invite', inviteData);
			}
			
			return inviteData;
		});
	});
	
};
exports.findInvitesByPlayerId = function(uid) {
	var query = {$or:[
		{
			inviter: uid
		},
		{
			opponents: uid
		}
	]};
	return utilities.getCollection("gameInvites").find(query).then(function(inviteData){
		return inviteData;
	});
};
exports.getInvite = function(uid, iid){
	var query = {'_id': new ObjectId(iid)};
	return utilities.getCollection("gameInvites").find(query).then(function(inviteData){
		return inviteData[0];
	});
};
exports.updateInvite = function(uid, iid, data){
	query = {"_id": new ObjectId(iid)};
	return utilities.getCollection('gameInvites').find(query).then(function(inviteDataObject){
		var allAccepted = true;
		var anOpponent = false;
		var opponents = [];
		var inviteData = inviteDataObject[0].toObject();
		for(var i in inviteData.opponents){
			if(inviteData.opponents[i] == uid){
				anOpponent = true;
				inviteData.accepted[inviteData.opponents[i]] = true;
			} else {
				opponents.push(inviteData.opponents[i]);
			}
			if(inviteData.accepted[inviteData.opponents[i]] == false){
				allAccepted = false;
			}
		}
		if(anOpponent == false){
			throw new Error("not invited to this game");
		}
		return utilities.getCollection('gameInvites').findOneAndModify(query, inviteData).then(function(inviteDataObjectUpdated){
			if(allAccepted == false){
				if(inviteData.inviter){
					utilities.socketEmit(inviteData.inviter, 'update invite', iid);
				}
				utilities.socketEmitMultiple(opponents, 'update invite', iid);
			}
			return inviteDataObjectUpdated;
		});
	});
};

exports.removeInvite = function(uid, iid) {
	query = {"_id": new ObjectId(iid)};
	return utilities.getCollection('gameInvites').find(query).then(function(inviteData){
		return utilities.getCollection("gameInvites").findOneAndRemove(query).then(function(){
			var opponents = [];
			if(inviteData[0].inviter){
				opponents.push(inviteData[0].inviter);
			} 
			for(var i in inviteData[0].opponents){
				if(inviteData[0].opponents[i] != uid){
					opponents.push(inviteData[0].opponents[i]);
				}
			}
			utilities.socketEmitMultiple(opponents, 'remove invite', iid);
			return inviteData;
		});
	});
};

exports.createInvite = createInvite;