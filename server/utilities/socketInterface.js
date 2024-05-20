var { Server } = require('socket.io');
var cors = require('cors');

start = function(server) {

  this.socket = new Server(server, {
    allowEIO3: true,
    cors: {
      origin: true,
      credentials: true,
    }
  });
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
