var gameModule = require('../../modules/game');

exports.createGame = function(req, res) {
	gameModule.createGame(req.body).then(function(data){
		res.jsonp(data);
	});
};
exports.findGamesByPlayerId = function(req, res) {
	gameModule.findGamesByPlayerId(req.params.uid).then(function(data){
		res.jsonp(data);
	});
};
exports.findGameForUser = function(req, res) {
	gameModule.findGameForUser(req.params.gid, req.params.uid).then(function(data){
		res.jsonp(data);
	});
};
exports.surrender = function(req, res){
	gameModule.surrender(req.params.uid, req.params.gid).then(function(data){
		res.json(data);
	}).fail(function(error){
		res.status(409).send({
			success:false,
			message:errorData.message
		});
	});
};
exports.draw = function(req, res){
	gameModule.draw(req.params.uid, req.params.gid).then(function(data){
		res.json(data);
	}).fail(function(error){
		res.status(409).send({
			success:false,
			message:errorData.message
		});
	});
};
exports.act = function(req, res) {
	gameModule.act(req.params.uid, req.params.gid, req.body).then(function(data){
		res.jsonp(data);
	}).fail(function(errorData){
		res.status(409).send({
			success:false,
			message:errorData.message
		});
	});
};

