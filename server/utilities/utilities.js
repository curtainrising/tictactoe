var mongoInterface = require('./mongooseInterface');
var socketInterface = require("./socketInterface");
var rabbitMQInterface = require('./rabbitMQ');
var config = require("../config/sammedalen.com");
var Q = require('q');
var jwt = require('jsonwebtoken');
var sjcl = require('sjcl');

exports.getCollection = function(collection) {
	var db = mongoInterface.getInstance();
	db.getModel(collection);
	return db;
};
exports.mongoDB = function(schemaName, type, query, changedData, options){
	var db = mongoInterface.getInstance();
	return db.use(schemaName, type, query, changedData, options);
};
exports.getSocket = function(id) {
	var socket = socketInterface.getSocket(id);
	return socket;
};
var socketEmit = function(id, type, data){
	var socket = socketInterface.getSocket(id);
	if(socket){
		socket.emit(type, data);
	}
};
exports.socketEmit = socketEmit;
exports.socketEmitMultiple = function(ids, type, data){
	for(var i in ids){
		socketEmit(ids[i], type, data);
	}
};
exports.rabbitMQStart = function() {
	return rabbitMQInterface.start();
};
exports.rabbitMQEmit = function(channelId, message){
	rabbitMQInterface.emitToChannel(channelId, message);
};
exports.rabbitMQEmitPromise = function(channelId, message){
	var deferred = Q.defer();
	rabbitMQInterface.emitToChannel(channelId, message);
	deferred.resolve(true);
	return deferred.promise;
};
exports.rabbitMQAddTask = function(channelId, task){
	rabbitMQInterface.addTaskToChannel(channelId, task);
};
exports.createToken = function(data, key){
	if (!key) {
		key = config.appSecret;
	}
	var token = jwt.sign(data, key);
    return token;
};
exports.verifyToken = function(token, key){
	if(!key) {
		key = config.appSecret;
	}
	return jwt.verify(token, key, function(err, decoded) {
		if (err) {
			return false;
		}
		return true;
	});
};
exports.getDataFromToken = function(token, key){
	if(!key) {
		key = config.appSecret;
	}
	var deferred = Q.defer();
	jwt.verify(token, key, function(err, decoded) {
		if (err) {
			deferred.reject(err);
		}
		deferred.resolve(decoded);
	});
	return deferred.promise;
};
exports.sanatize = function(schemaBase, sanatizeType, data, requestedData){
	var schema = require("../api/schemas/" + schemaBase)['sanatized' + sanatizeType];
	if (!schema){
		return "no such schema";
	}
	var sanatizedData = {};
	for(var i in data){
		if ((schema[i] && (!requestedData || requestedData[i])) || i == "_id"){
			sanatizedData[i] = data[i];
		}
	}
	return sanatizedData;
};
exports.sanatizer = function(schemaBase, sanatizeType, data, options){
	var schema = require("../api/schemas/" + schemaBase);
	
	var sanatizedData = {};
	sanatizedData = sanatizeRecursive(schema, sanatizeType, data, options);
	return sanatizedData;
};
var sanatizeRecursive = function(schema, sanatizeType, data, options){
	var sanatizeName = 'sanatized' + sanatizeType;
	if (!schema[sanatizeName]){
		return data;
	}
	var tempSchema = schema[sanatizeName];
	var tempSanatizedData = {};
	for(var i in data){
		if (tempSchema[i] && (!options || options[i])){
			if (tempSchema[i] == {}){
				tempSanatizedData = sanatizeRecursive(schema, i, data[i], options[i]? options[i]:null);
			} else {
				tempSanatizedData[i] = data[i];
			}
		}
	}
	return tempSanatizedData;
};
exports.createRandomString = function(length){
	var carrier = "1234567890abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUWXYZ";
	var randomString = "";
	for(var i = 0; i <length; i ++){
		var randomNumber = Math.floor(Math.random() * (carrier.length - 1));
		randomString += carrier[randomNumber];
	}
	return randomString;
};
exports.decryptPasswordHash = function(salt, password){
	var decryptedHashAll = sjcl.decrypt(salt, password);
	var originalSalt = decryptedHashAll.slice(decryptedHashAll.length - 30, decryptedHashAll.length - 15);
	var originalHash = decryptedHashAll.slice(0, decryptedHashAll.length - 30);
	var password = sjcl.decrypt(originalSalt, originalHash);
	return password;
};
