var utilities = require("../utilities/utilities");
var config = require("../config/sammedalen.com");

var User = function(data){
	this.id = String(data._id);
	this.data = data;
	
	this.tokenData = {
		id : data._id,
		username: data.username,
	};
	var token = utilities.createToken(this.tokenData);
	this.data.token = token;
	return this;
};
User.prototype.login = function(id){
	var token = utilities.createToken(this.tokenData);
	this.data.token = token;
	return this;
};
User.prototype.updatePlayerData = function(data){
	for(var i in data){
			if(this.data[i]){
				this.data[i] = data[i];
			}
		}
};
User.prototype.getData = function(uid){
	if (uid == this.id){
		var sd = utilities.sanatize('players','player',this.data);
		return sd;
	} else {
		return utilities.sanatize('players','otherplayer',this.data);
	}
};
User.prototype.compareToken = function(token){
	if (token == this.data.token){
		return utilities.verifyToken(token);
	}
	return false;
};
exports.sanatizeData = function(data, uid, requestedData){
	var schema = "";
	if(data._id == uid){
		schema = "player";
	} else {
		schema = "otherplayer";
	}
	return utilities.sanatize('players',schema,data,requestedData);
};
exports.setupNewUserData = function(data){
	var userData = {
		username: data.username,
		password: data.password,
		gameStats : {}
	};
	for(var i in config.currentPlayableGames){
		userData.gameStats[config.currentPlayableGames[i]] = {
			wins : 0,
			rankedWins : 0,
			loss : 0,
			rankedLoss : 0,
			draw : 0,
			score : 0
		};
	}
	return userData;
};
var users = {};
var newUser = function(data){
	if(!users[data._id]){
		var user = new User(data);
		users[data._id] = user;
		return user;
	}
	return users[data._id].login();
};
exports.newUser = newUser;
exports.getUser = function(id, data){
	if(users[id]){
		return users[id];
	} else if(data){
		return newUser(data);
	}
	return null;
};
