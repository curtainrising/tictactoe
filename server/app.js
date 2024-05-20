var express = require('express'),
  { createServer } = require("http");
	bodyParser = require("body-parser"),
	player = require('./api/routes/player'),
	game = require("./api/routes/game"),
	invite = require("./api/routes/invite"),
	queue = require("./api/routes/queue"),
	queueModule = require("./modules/queue");
	socketInterface = require("./utilities/socketInterface"),
	utilities = require("./utilities/utilities");
  cors = require('cors');
//mongo.getInstance();

var app = express();
app.use(bodyParser.json());
app.all('*', function(req, res, next) {
	res.header('Access-Control-Allow-Origin', '*');
	res.header('Access-Control-Allow-Methods', 'PUT, GET, POST, DELETE, OPTIONS');
	res.header('Access-Control-Allow-Headers', 'Content-Type, access-token');
	res.header('Content-Type', "application/json; charset=utf-8");
	next();
});
app.use(cors()) // comment this out to provoke CORS error

//do not need player auth tokens
//supplies random key for hashing password
//ONLY SLIGHTLY MORE SECURE THAN PLAIN TEXT PASSWORD
app.get('/signlogauth', function(req, res){console.log('here');
	var salt = utilities.createRandomString(15);
	res.jsonp({salt: salt});
});
app.post('/authenticate', player.authenticate);
app.post('/player', player.create);
app.post('/player/login', player.login);

//verify auth token exists
app.use(function(req, res, next){
	if(req.method !== "OPTIONS"){
		var token = req.body.token || req.query.token || req.headers['access-token'];
		if(!token){
			return res.status(403).send({ 
				success: false, 
				message: 'No token provided.' 
			});
		}
	}
	next();
});
var checkPlayerAndToken = function(req, res, next){
	var token = req.body.token || req.query.token || req.headers['access-token'];
	utilities.getDataFromToken(token).then(function(decodedData){
		if (req.params.uid != decodedData.id){
			return res.status(403).send({ 
				success: false, 
				message: 'Not Authorized.' 
			});
		}
		next();
	});
};
app.post('/player/:uid*', checkPlayerAndToken);
app.put('/player/:uid*', checkPlayerAndToken);
app.delete('/player/:uid*', checkPlayerAndToken);

app.get('/player', player.findStuff);
app.get('/player/:uid', player.findPlayerByUid);
//app.get('/player/:uid/logout', player.logout);
app.post('/player/:uid/gameInvite', invite.invite);
app.put('/player/:uid/gameInvite/:iid', invite.updateInvite);
app.get('/player/:uid/gameInvite/:iid', invite.findInvite);
app.get('/player/:uid/gameInvite', invite.findInvitesByPlayerId);
app.delete('/player/:uid/gameInvite/:iid', invite.removeInvite);
app.get('/player/:uid/queue', queue.findPlayerGameQueueByPlayerId);
app.put('/player/:uid/queue/:gqid', queue.leavePlayerGameQueue);
app.delete('/player/:uid/queue/:gqid',queue.deletePlayerGameQueue);
app.post('/player/:uid/game', game.createGame);
app.get('/player/:uid/game', game.findGamesByPlayerId);
app.post('/player/:uid/game/queue', queue.addToGameQueue);
app.put('/player/:uid/game/:gid', game.act);
app.get('/player/:uid/game/:gid', game.findGameForUser);
app.put('/player/:uid/game/:gid/surrender', game.surrender);
app.put('/player/:uid/game/:gid/draw', game.draw);


var httpServer = createServer(app);
socketInterface.start(httpServer);
utilities.rabbitMQStart().then(function(){
  console.log('rabbitmq-connected')
	queueModule.setupRabbitConsumers();
});
httpServer.listen(8082);
console.log('listening on port 8082');
