var player = require('../../modules/player');
var getRequstingPlayerId = function(req){
	var token = req.body.token || req.query.token || req.headers['access-token'];
	return utilities.getDataFromToken(token).then(function(decodedData){
		return decodedData.id;
	});
};
exports.findStuff = function(req, res){
	getRequstingPlayerId(req).then(function(uid){
		var options = {
			limit : req.query.limit,
			forUserId : uid
		};
		player.findPlayers(req.query.queryData, options, req.query.returnData).then(function(data){
			res.jsonp(data);
		});
	});
};
exports.create = function(req,res) {
	player.create(req.body).then(function(data){
		res.jsonp(data);
	}).fail(function(errorData){
		res.status(409).send({
			success:false,
			message:errorData.message
		});
	});
};
exports.login = function(req, res) {
	player.login(req.body).then(function(userData){
		res.jsonp(userData);
	}).fail(function(errorData){
		res.status(409).send({
			success:false,
			message:errorData.message
		});
	});
};
exports.authenticate = function(req, res){
	player.authenticate(req.headers['access-token']).then(function(userData){
		res.jsonp(userData);
	}).fail(function(errorData){
		res.status(409).send({
			success:false,
			message:errorData.message
		});
	});
};
exports.findPlayerByUid = function(req,res) {
	player.findPlayer({uid:req.params.uid}, {forUserId: req.params.uid}).then(function(data){
		res.send(data);
	});
};
