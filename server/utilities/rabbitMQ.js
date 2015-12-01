var amqp = require('amqplib/callback_api');
var Q = require('q');
var config = require("../config/sammedalen.com");

var start = function() {
	var deferred = Q.defer();
	amqp.connect(config.rabbitMQHost, function(err, conn){
		connection = conn;
		for(var i in config.queueNames){
			consumingChannelTasks[config.queueNames[i]] = [];
			publishingChannelQueues[config.queueNames[i]] = [];
			
			createPublishingChannel(connection, config.queueNames[i]);
			deferred.resolve(true);
		}
	});
	return deferred.promise;
};
var createConsumerChannel = function(conn, channelId){
	var currentConn = connection || conn;
	currentConn.createChannel(function(err, ch){
		consumingChannels[channelId] = ch;
		ch.assertQueue(channelId);
		ch.consume(channelId, function(message){
			var promises = [];
			for(var i in consumingChannelTasks[channelId]){
				promises.push(consumingChannelTasks[channelId][i](message.content.toString()));
			}
			Q.all(promises).then(function(){
				ch.ack(message);
			});
		});
	});
};
var createPublishingChannel = function(conn, channelId){
	var currentConn = connection || conn;
	currentConn.createChannel(function(err, ch){
		ch.assertQueue(channelId);
		publishingChannels[channelId] = ch;
		
		if (publishingChannelQueues[channelId].length > 0){
			sendOnChannel(channelId);
		}
	});
};
var sendOnChannel = function(channelId, message){
	if(!publishingChannels[channelId] || !connection){
		addToPublishingChannelQueue(channelId, message);
	} else if (publishingChannels[channelId] && connection && publishingChannelQueues[channelId].length > 0){
		var msg = publishingChannelQueues[channelId].pop();
		sendOnChannel(channelId, msg);
	} else {
		publishingChannels[channelId].sendToQueue(channelId, new Buffer(message));
	}
};
var addToPublishingChannelQueue = function(channelId, message){
	if (!publishingChannelQueues[channelId]) {
		publishingChannelQueues[channelId] = [];
	}
	publishingChannelQueues[channelId].push(message);
};

var addTaskToConsumingChannel = function(channelId, task){
	if (!consumingChannelTasks[channelId]){
		consumingChannelTasks[channelId] = [];
	}
	consumingChannelTasks[channelId].push(task);
};


var publishingChannelQueues = {};
var publishingChannels = {};
var consumingChannelTasks = {};
var consumingChannels = {};
var connection = null;

exports.emitToChannel = function(Id, message){
	channelId = config.queueNames[Id];
	if(!publishingChannels[channelId] && !connection){
		start();
	} else if (channelId && !publishingChannels[channelId]) {
		createPublishingChannel(connection, channelId);
	}
	sendOnChannel(channelId, message);
};
exports.addTaskToChannel = function(id, task){
	channelId = config.queueNames[id];
	addTaskToConsumingChannel(channelId, task);
	
	if(!consumingChannels[channelId] && !connection){
		start();
	} else if (!consumingChannels[channelId]) {
		createConsumerChannel(connection, channelId);
	}
	
};
exports.start = start;
