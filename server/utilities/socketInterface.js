var io = require('socket.io');

start = function(server) {
	this.socket = io.listen(server || 8080);
	var self = this;
	this.socket.sockets.on('connection', function (socket) {
		console.log('A new user connected!');
		sockets[socket.handshake.query.id] = socket;
	});
	return this;
};
var sockets = {};
var instance;
exports.start = start;
exports.getSocket = function (userId) {
	if(sockets[userId]) {
		return sockets[userId];
	}
	return null;
};
