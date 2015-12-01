var inviteModule = require('../../modules/invite');

exports.invite = function(req, res) {
	inviteModule.createInvite(req.params.uid, req.body).then(function(inviteData){
		res.jsonp(inviteData);
	});
};
//returns list of games and their players
exports.findInvitesByPlayerId = function(req, res) {
	inviteModule.findInvitesByPlayerId(req.params.uid).then(function(inviteData){
		res.jsonp(inviteData);
	});
};
exports.updateInvite = function(req, res) {
	inviteModule.updateInvite(req.params.uid, req.params.iid, req.body).then(function(inviteResponse){
		res.jsonp(inviteResponse);
	});
};
exports.removeInvite = function(req, res) {
	inviteModule.removeInvite(req.params.uid, req.params.iid).then(function(inviteResponse){
		res.jsonp({"OK":"OK"});
	});
};
exports.findInvite = function(req, res) {
	inviteModule.getInvite(req.params.uid, req.params.iid).then(function(inviteData){
		res.jsonp(inviteData);
	});
};