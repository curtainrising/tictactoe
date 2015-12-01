var queue = require('../../modules/queue');

exports.addToGameQueue = function(req, res){
	queue.emitToQueueForGame(req.params.uid, req.body).then(function(data){
		res.jsonp({"OK":"OK"});
	});
};
exports.getPlayerGameQueue = function(req, res){
	queue.getPlayerGameQueue(req.params.gqid).then(function(data){
		res.jsonp(data);
	});
};
exports.findPlayerGameQueueByPlayerId = function(req, res){
	queue.findPlayerGameQueueByPlayerId(req.params.uid).then(function(data){
		res.jsonp(data);
	});
};
exports.leavePlayerGameQueue = function(req, res){
	queue.leavePlayerGameQueue(req.params.uid, req.params.gqid).then(function(data){
		res.jsonp(data);
	});
};
exports.deletePlayerGameQueue = function(req, res){
	queue.deletePlayerGameQueue(req.params.gqid, req.params.uid).then(function(data){
		res.jsonp({"OK":"OK"});
	});
};
