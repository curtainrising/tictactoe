window.GameView = Backbone.View.extend({
	gameListItemTemplate : _.template(
		'<li ' +
		'id="<%=type%>-invite-<%=id%>" ' +
		'class="list-group-item game-type-<%=type%>-display game-type-display">' +
		'<%=gameType%> : <%=name%>' +
		'</li>'
	),
	invitedOpponentsListMemberTemplate : _.template(
		'<li class="invited-opponent"> <%=opponentId%> : accepted invite : <%=accepted%></li>'
	),
	newGameUserListTemplate : _.template(
		'<li class="new-game-user-choice" id="new-game-user-<%=name%>">' +
			'<span><%=name%></span>' +
			'<button type="button" class="btn btn-default add-new-game-chosen-user" aria-label="Right Align">' +
				'<span class="glyphicon glyphicon-plus" ></span>' +
			'</button>' +
		'</li>'
	),
	newGameChosenUserListTemplate : _.template(
		'<li id="new-game-chosen-user-<%=name%>">' +
			'<span><%=name%></span>' +
			'<button type="button" class="btn btn-default remove-new-game-chosen-user" aria-label="Right Align">' +
				'<span class="glyphicon glyphicon-minus" ></span>' +
			'</button>' +
		'</li>'
	),
	receivedInvite : {},
	sentInvite : {},
	gameQueue : {},
	currentGame : {},
	finishedGame: {},
	recentDisplayedGameViews : {},
	currentGameView : null,
	currentDisplayId : null,
	numberOfAvailableUserSlots : 0,
	numberOfChosenUsers : 0,
	newGameUserSearchCurrentText : "",
	newGameUserSearching : false,
	newGameUserSearchedList : {},
	newGameChosenUserList : {},
	initialize : function(data) {
		return this;
	},
	render: function() {
		this.$el.append(this.template());
		var self = this;
		myGameInvites.fetch({
			success: function(inviteModels, allInvitesData){
				for(var i in allInvitesData){
					if(allInvitesData[i].inviter == app.user.id){
						self.addSentInvite(allInvitesData[i]);
					} else {
						self.addReceivedInvite(allInvitesData[i]);
					}
				}
			}
		});
				
		myGames.fetch({
			success: function(gameModels, allGamesData){
				for(var i in allGamesData){
					if(allGamesData[i].winner == "" && Boolean(allGamesData[i].draw) == false){
						self.addCurrentGame(allGamesData[i]);
					} else {
						self.addFinishedGame(allGamesData[i]);
					}
				}
			}
		});
		myGameQueues.fetch({
			success: function(queueModels, allQueueData){
				for(var i in allQueueData){
					self.addGameQueue(allQueueData[i]);
				}
			}
		});

		//create queue
		app.socket.on('gameQueue', function(gameQueueData){
			myGameQueues.fetch({
				success: function(gameQueueModels, allGameQueueData){
					self.addGameQueue(gameQueueData);
				}
			});
		});
		app.socket.on('update gameQueue', function(id){
			myGameQueues.findWhere({"_id":id}).fetch({
				success: function(gameQueueModel, gameQueueData){
					self.updateGameQueue(gameQueueData);
				}
			});
		});
		app.socket.on("remove gameQueue", function(id){
			myGameQueues.fetch({
				success:function(){
					self.removeGameQueue(id);
				}
			});
		});
		//create invite
		app.socket.on('invite', function(inviteData){
			myGameInvites.fetch({
				success: function(inviteModels, allInviteData){
					self.addReceivedInvite(inviteData);
				}
			});
		});
		
		//updates an invite then updates the stored data
		app.socket.on("update invite", function(inviteId){
			myGameInvites.findWhere({"_id": inviteId}).fetch({
				success:function(inviteModel, inviteData){
					if(inviteData.inviter == app.user.id){
						self.updateSentInvite(inviteData);
					} else {
						self.updateReceivedInvite(inviteData);
					}
				}
			});
		});
		app.socket.on("remove invite", function(inviteId){
			myGameInvites.fetch({
				success: function(inviteModels, allInviteData){
					if(self.receivedInvite[inviteId]){
						self.removeReceivedInvite(inviteId);
					} else if(self.sentInvite[inviteId]){
						self.removeSentInvite(inviteId);
					}
				}
			});
		});
		app.socket.on('create game', function(gameData){
			myGames.fetch({
				success: function(gameModels, allGamesData){
					self.addCurrentGame(gameData);
				}
			});
		});
		var finishGame = function(id, gameOver){
			myGames.findWhere({"_id":id}).fetch({
				success: function(gameModel, gameData){
					if(self.recentDisplayedGameViews[id]){
						self.recentDisplayedGameViews[id].updateAfterFetch(gameData);
					}
					if(gameOver){
						self.finishGame(id, gameData);
					}
				}
			});
		};
		app.socket.on('game over', function(gameId){
			finishGame(gameId, true);
		});
		
		app.socket.on("draw", function(data){
			finishGame(data.gameId, data.accepted);
		});
		app.socket.on("surrender", function(data){
			finishGame(data.gameId, data.accepted);
		});
		return this;
	},
	events: {
		"click #new-game-button": "setupCreateInvite",
		"change #create-game-opponent-type": "changeInviteForm",
		"keyup #create-game-opponent": "debounceGetUsersFromPartialString",
		"paste #create-game-opponent": "debounceGetUsersFromPartialString",
		"cut #create-game-opponent": "debounceGetUsersFromPartialString",
		"click .add-new-game-chosen-user" : "addNewGameUser",
		"click .remove-new-game-chosen-user" : "removeNewGameChosenUser",
		"click #save-new-game-button": "sendChallenge",
		"click .game-type-queue-display": "displayGameQueueEvent",
		"click .game-type-inviter-display": "displaySentInviteEvent",
		"click .game-type-invited-display": "displayReceivedInviteEvent",
		"click .game-type-current-display": "displayGame",
		"click .game-type-finished-display": "displayFinishedGame",
		"click #leave-queue-button": "leaveQueue",
		"click #cancel-game-invite-button": "cancelInvite",
		"click #accept-game-invite-button": "acceptInvite",
		"click #deny-game-invite-button": "denyInvite",
		"click .surrender-button": "surrender",
		"click .draw-button": "draw"
	},
	changeInviteForm: function(event) {
		if (event.currentTarget.value == "player"){
			$(".create-game-opponent-holder", this.$el).css("display","block");
			$(".create-game-ranked-choice-holder", this.$el).css("display","block");
			$("#save-new-game-button", this.$el).html("Send Challenge");
			$(".create-game-name-holder", this.$el).css("display","block");
			this.numberOfAvailableUserSlots = 1;
		} else if (event.currentTarget.value == "computer"){
			$(".create-game-opponent-holder", this.$el).css("display","none");
			$(".create-game-ranked-choice-holder", this.$el).css("display","none");
			$("#save-new-game-button", this.$el).html("Create Game");
			$(".create-game-name-holder", this.$el).css("display","block");
			this.numberOfAvailableUserSlots = 0;
		} else if (event.currentTarget.value == "queue"){
			$(".create-game-opponent-holder", this.$el).css("display","none");
			$(".create-game-ranked-choice-holder", this.$el).css("display","block");
			$("#save-new-game-button", this.$el).html("Join Queue");
			$(".create-game-name-holder", this.$el).css("display","none");
			this.numberOfAvailableUserSlots = 0;
		}
	},
	hideHolders: function(){
		$("#new-game-holder", this.$el).css("display","none");
		$("#queue-holder", this.$el).css("display", "none");
		$("#invite-holder", this.$el).css("display", "none");
		$("#invited-holder", this.$el).css("display", "none");
		$("#game-playspace-holder", this.$el).css("display","none");
	},
	debounceGetUsersFromPartialString: _.debounce(function(event){
		if(event.currentTarget.value == "" || event.currentTarget.value == ''){
			return;
		}
		if(this.newGameUserSearching){
			this.newGameUserSearchCurrentText = event.currentTarget.value;
			return;
		}
		if(this.numberOfChosenUsers >= this.numberOfAvailableUserSlots){
			return;
		}
		this.getUsersFromPartialString(event.currentTarget.value);
	}, 300),
	getUsersFromPartialString: function(partialString){
		this.newGameUserSearchCurrentText = partialString;
		this.newGameUserSearching = true;
		var self = this;
		var data = {
			queryData: {
				partialUsername : partialString
			},
			limit : 10,
			returnData: {"username":true}
		};
		$.ajax({
			type: "GET",
			contentType: 'application/json',
			dataType: "json",
			data : data,
			url : app.apiUrl() + "/player",
			success:function(usernames){
				$("#create-game-possible-opponents-holder").empty();
				for(var i in usernames){
					if(usernames[i].username != app.user.attributes.username){
						var newUserData = {
							name : usernames[i].username
						};
						self.newGameUserSearchedList[usernames[i].username] = usernames[i]._id;
						$("#create-game-possible-opponents-holder").append(self.newGameUserListTemplate(newUserData));
					}
				}
				self.newGameUserSearching = false;
				if(self.newGameUserSearchCurrentText != partialString){
					self.getUsersFromPartialString(partialString);
				}
			},
			error : function(){
				self.newGameUserSearching = false;
				if(self.newGameUserSearchCurrentText != partialString){
					self.getUsersFromPartialString(partialString);
				}
			}
		});
	},
	addNewGameUser : function(event){
		var username = event.currentTarget.parentElement.id;
		username = username.replace("new-game-user-", "");
		var chosenUserData = {
			name : username
		};
		this.newGameChosenUserList[username] = true;
		var tempEl = this.newGameChosenUserListTemplate(chosenUserData);
		this.numberOfChosenUsers ++;
		$("#create-game-chosen-opponents-holder", this.$el).append(tempEl);
		$("#new-game-user" + username, this.$el).remove();
		$("#create-game-possible-opponents-holder", this.$el).empty();
		$("#create-game-opponent", this.$el).val("");
		if(this.numberOfChosenUsers == this.numberOfAvailableUserSlots){
			$(".create-game-opponent-holder", this.$el).css("display","none");
			$("#create-game-possible-opponents-holder", this.$el).empty();
		}
	},
	removeNewGameChosenUser: function(event){
		var username = event.currentTarget.parentElement.id;
		username = username.replace("new-game-chosen-user-", "");
		$("#new-game-chosen-user-" + username, this.$el).remove();
		this.numberOfChosenUsers --;
		$(".create-game-opponent-holder", this.$el).css("display","block");
		delete this.newGameChosenUserList[username];
		
	},
	displayGameQueueEvent: function(event){
		var id = event.currentTarget.id;
		id = id.replace("queue-invite-", "");
		this.displayGameQueue(id);
	},
	displayGameQueue: function(id){
		this.currentDisplayId = id;
		var queueData = myGameQueues.findWhere({"_id":id}).attributes;
		var time = new Date(queueData.time);
		var opponents = [];
		for (var i in queueData.opponents){
			if(queueData.opponents[i] != app.user.id){
				
			}
		}
		if (opponents.length == 0){
			$("#queue-display-opponents-holder", this.$el).css("display", "none");
		}
		$("#queue-game-type-holder", this.$el).html(queueData.type);
		$("#queue-game-ranked-holder", this.$el).html(queueData.ranked);
		this.hideHolders();
		$("#queue-holder", this.$el).css("display", "block");
	},
	displaySentInviteEvent: function(event){
		var id = event.currentTarget.id;
		id = id.replace("inviter-invite-", "");
		this.displaySentInvite(id);
		
	},
	displaySentInvite: function(id){
		this.currentDisplayId = id;
		var inviteData = myGameInvites.findWhere({"_id":id}).attributes;
		var time = new Date(inviteData.time);
		var opponents = inviteData.opponents;
		for(var i in opponents){
			var accepted;
			if(inviteData.accepted[opponents[i]] == true || inviteData.accepted[opponents[i]] == "true"){
				accepted = true;
			} else {
				accepted = false;
			}
			var opponentData = {
				opponentId: opponents[i],
				accepted: accepted
			};
			var opponentDisplay = this.invitedOpponentsListMemberTemplate(opponentData);
			$("#invite-display-opponents", this.$el).append(opponentDisplay);
		
		}
		$("#invite-display-game-type", this.$el).html(inviteData.gameType);
		$("#invite-display-time", this.$el).html(time);
		this.hideHolders();
		$("#invite-holder", this.$el).css("display", "block");
	},
	displayReceivedInviteEvent: function(event){
		var id = event.currentTarget.id;
		id = id.replace("invited-invite-", "");
		this.displayReceivedInvite(id);
	},
	displayReceivedInvite: function(id){
		this.currentDisplayId = id;
		var inviteData = myGameInvites.findWhere({"_id":id}).attributes;
		var allOpponents = inviteData.opponents;
		var opponents = [];
		
		var time = new Date(inviteData.time);
		var invitedBy = inviteData.inviter;
		if(invitedBy){
			$("#invited-display-inviter", this.$el).html(invitedBy);
		}
		
		$("#invited-display-opponents", this.$el).empty();
		for(var i in allOpponents){
			if(allOpponents[i] != app.user.id){
				var accepted = false;
				if(inviteData.accepted[allOpponents[i]] == true || inviteData.accepted[allOpponents[i]] == "true"){
					accepted = true;
				} else {
					accepted = false;
				}
				var opponentData = {
					opponentId: allOpponents[i],
					accepted: accepted
				};
				var opponentDisplay = this.invitedOpponentsListMemberTemplate(opponentData);
				$("#invited-display-opponents", this.$el).append(opponentDisplay);
			} else if (inviteData.accepted[allOpponents[i]] == true || inviteData.accepted[allOpponents[i]] == "true"){
				$("#accept-game-invite-button", this.$el).css("display", "none");
			} else {
				$("#accept-game-invite-button", this.$el).css("display", "inline");
			}
		}
		$("#invited-display-game-type", this.$el).html(inviteData.gameType);
		$("#invited-display-time", this.$el).html(time);
		this.hideHolders();
		$("#invited-holder", this.$el).css("display", "block");
	},
	displayGame: function(event){
		var id = event.currentTarget.id;
		id = id.replace("current-invite-", "");
		this.hideHolders();
		this.setupGame(id);
	},
	displayFinishedGame: function(event){
		var id = event.currentTarget.id;
		id = id.replace("finished-invite-", "");
		this.hideHolders();
		this.setupGame(id);
	},
	leaveQueue: function(event){
		id = this.currentDisplayId;
		var self = this;
		$.ajax({
			type: "PUT",
			contentType: 'application/json',
			dataType: "json",
			url : app.apiUrl() + "/player/" + app.user.id + "/queue/" + id,
			success:function(data){
				if(data.opponents.length == 0){
					myGameQueues.findWhere({"_id":id}).destroy({
						success:function(){
							self.removeGameQueue(id);
						}
					});
				}
			}
		});
	},
	cancelInvite: function(event){
		id = this.currentDisplayId;
		var self = this;
		myGameInvites.findWhere({"_id": id}).destroy({
			success: function(stuff, data){
				$("#invite-holder", self.$el).css("display", "none");
				self.sentInvite[id] = null;
				$("#inviter-invite-" + id, self.$el).remove();
			}
		});
		
	},
	acceptInvite: function(event){
		var id = this.currentDisplayId;
		var self = this;
		var tempInviteModel = myGameInvites.findWhere({"_id": id});
		var accepted = tempInviteModel.attributes.accepted;
		accepted[app.user.id] = true;
		tempInviteModel.set({'accepted': accepted});
		tempInviteModel.save(null, {
			success:function(inviteModel, inviteData){
				var allAccepted = true;
				for(var i in inviteData.accepted){
					if(inviteData.accepted[i] == false){
						allAccepted = false;
					}
				}
				if (allAccepted){
					delete inviteData['_id'];
					myGames.create(inviteData,{
						success: function(gameModel, gameData){
							tempInviteModel.destroy({
								success: function(){
									$("#invited-holder", self.$el).css("display", "none");
									self.receivedInvite[id] = null;
									$("#invited-invite-" + id, self.$el).remove();
								}
							});
							self.addCurrentGame(gameData);
							self.setupGame(gameModel.id);
						}
					});
				} else {
					self.updateReceivedInvite(inviteData);
				}
			}
		});
	},
	denyInvite: function(event) {
		id = this.currentDisplayId;
		var self = this;
		myGameInvites.findWhere({"_id": id}).destroy({
			success: function(stuff, data){
				$("#invited-holder", self.$el).css("display", "none");
				self.receivedInvite[id] = null;
				$("#invited-invite-" + id, self.$el).remove();
			}
		});
	},
	draw: function(event) {
		id = event.target.id.replace("draw-button-", "");
		var self = this;
		$.ajax({
			type: "PUT",
			contentType: 'application/json',
			dataType: "json",
			url : app.apiUrl() + "/player/" + app.user.id + "/game/" + id + "/draw",
			success:function(modelData, data){
				self.currentGameView.update();
				if(modelData.draw == "true" || modelData.draw == true){
					self.removeCurrentGame(id);
					self.addFinishedGame(modelData);
				}
			}
		});
	},
	surrender: function(event){
		id = event.target.id.replace("surrender-button-", "");
		var self = this;
		$.ajax({
			type: "PUT",
			contentType: 'application/json',
			dataType: "json",
			url : app.apiUrl() + "/player/" + app.user.id + "/game/" + id + "/surrender",
			success:function(modelData, data){
				self.currentGameView.update();
				if(modelData.winner != ""){
					self.removeCurrentGame(id);
					self.addFinishedGame(modelData);
				}
			}
		});
	},
	updateReceivedInvite: function(inviteData){
		if(this.receivedInvite[inviteData['_id']]){
			this.receivedInvite[inviteData['_id']] = inviteData;
		}
		if(this.currentDisplayId == inviteData['_id']){
			this.displayReceivedInvite(inviteData['_id']);
		}
	},
	removeGameQueue: function(id){
		$("#queue-holder", this.$el).css("display", "none");
		this.gameQueue[id] = null;
		$("#queue-invite-" + id, this.$el).remove();
	},
	removeReceivedInvite: function(id) {
		$("#invited-holder", this.$el).css("display", "none");
		this.receivedInvite[id] = null;
		$("#invited-invite-" + id, this.$el).remove();
	},
	updateGameQueue: function(gameQueueData){
		if(!this.gameQueue[gameQueueData['_id']]){
			this.gameQueue[gameQueueData['_id']] = gameQueueData['_id'];
		}
		if(this.currentDisplayId == gameQueueData['_id']){
			this.displayGameQueue(gameQueueData);
		}
	},
	updateSentInvite: function(inviteData){
		if(this.sentInvite[inviteData['_id']]){
			this.sentInvite[inviteData['_id']] = inviteData['_id'];
		}
		if(this.currentDisplayId == inviteData['_id']){
			this.displayReceivedInvite(inviteData['_id']);
		}
	},
	removeSentInvite: function(id) {
		$("#invite-holder", self.$el).css("display", "none");
		this.sentInvite[id] = null;
		$("#inviter-invite-" + id, self.$el).remove();
	},
	removeCurrentGame: function(id){
		this.currentGame[id] = null;
		$("#current-invite-" + id, self.$el).remove();
	},
	setupCreateInvite: function(event) {
		this.hideHolders();
		$("#new-game-holder", this.$el).css("display","block");
		$(".create-game-error-holder", this.$el).css("display","none");
		$("#create-game-name", this.$el).val('');
		$("#create-game-opponent", this.$el).val('');
		$("#create-game-type", this.$el).val('empty');
		this.numberOfAvailableUserSlots = 1;
	},
	sendChallenge: function(event){
		var error = "";
		var self = this;
		var gameName = $("#create-game-name", this.$el).val();
		var opponents = this.newGameChosenUserList;
		var gameType = $("#create-game-type", this.$el).val();
		var opponentType = $("#create-game-opponent-type", this.$el).val();
		var ranked = $("input:radio[name='create-game-ranked-choice']:checked").val();
		if(ranked == "ranked"){
			ranked = true;
		} else if (ranked == "unranked"){
			ranked = false;
		}
		
		if(gameType == "empty"){
			error = "Choose a game Type";
		} else if(opponentType != "queue" && gameName == ""){
			error = "No game name entered";
		} else if (opponentType == "player"  && _.isEmpty(opponents)){
			error = "No opponents selected";
		}
		if (error != ""){
			$(".create-game-error-holder", this.$el).css("display","block");
			$("#create-game-error", this.$el).html(error);
			return;
		}
		
		
		if (opponentType == "player") {
			inviteData = {
				name : gameName,
				inviteType: opponentType,
				inviter: app.user.id,
				opponents: [],
				ranked: ranked,
				type: gameType
			};
			for(var i in opponents){
				inviteData.opponents.push(i);
			}
			myGameInvites.create(inviteData, {
				success: function(model, data){
					$("#new-game-holder", this.$el).css("display","none");
					self.addSentInvite(data);
				}
			});
		} else if(opponentType == "computer"){
			var computerGameData  = {
				name : gameName,
				inviteType: opponentType,
				inviter: app.user.id,
				opponents: [],
				ranked: false,
				gameType: gameType
			};
			myGames.create(computerGameData,{
				success: function(stuff, data){
					self.addCurrentGame(data);
					self.setupGame(data);
				}
			});
		} else if(opponentType == "queue"){
			console.log(myGameQueues);
			var queueData = {
				gameType : gameType,
				ranked : ranked
			};
			
			if(myGameQueues.findWhere({type: gameType, ranked : String(ranked)})){
				error = "You are already in that queue";
			} else {
				$.ajax({
					type: "POST",
					contentType: 'application/json',
					dataType: "json",
					data: JSON.stringify(queueData),
					url : app.apiUrl() + "/player/" + app.user.id + "/game/queue",
					success:function(stuff, data){
						$("#new-game-holder", this.$el).css("display","none");
					}
				});
			}
		}
		if (error != ""){
			$(".create-game-error-holder", this.$el).css("display","block");
			$("#create-game-error", this.$el).html(error);
			return;
		}
	},
	addGameQueue: function(data){
		if(this.gameQueue[data._id]){
			return;
		}
		var name = Boolean(data.ranked)? "ranked":"unranked";
		gameData = {
			name : name + " queue",
			gameType : data.type,
			type : 'queue',
			id : data._id
		};
		this.gameQueue[data._id] = data._id;
		$("#game-queue-list-holder", this.$el).append(this.gameListItemTemplate(gameData));
	},
	addSentInvite: function(data) {
		if(this.sentInvite[data._id]){
			return;
		}
		gameData = {
			name : data.name,
			gameType : data.gameType,
			type : 'inviter',
			id : data._id
		};
		this.sentInvite[data._id] = data._id;
		$("#pending-game-list-holder", this.$el).append(this.gameListItemTemplate(gameData));
	},
	addReceivedInvite: function(data) {
		if(this.receivedInvite[data._id]){
			return;
		}
		gameData = {
			name : data.gameName,
			gameType : data.gameType,
			type : 'invited',
			id : data._id
		};
		this.receivedInvite[data._id] = data._id;
		$("#pending-invited-game-list-holder", this.$el).append(this.gameListItemTemplate(gameData));
	},
	finishGame : function(gameId, gameData) {
		this.removeCurrentGame(gameId);
		this.addFinishedGame(gameData);
	},
	addCurrentGame: function(data) {
		if(this.currentGame[data._id]){
			return;
		}
		gameData = {
			name : data.name,
			gameType : data.type,
			type : 'current',
			id : data._id
		};
		this.currentGame[data._id] = data._id;
		$("#current-game-list-holder", this.$el).append(this.gameListItemTemplate(gameData));
	},
	addFinishedGame: function(data) {
		if(this.finishedGame[data._id]){
			return;
		}
		gameData = {
			name : data.name,
			gameType : data.type,
			type : 'finished',
			id : data._id
		};
		this.finishedGame[data._id] = data._id;
		$("#finished-game-list-holder", this.$el).append(this.gameListItemTemplate(gameData));
	},
	setupGame: function(id){
		if(!this.currentGameView || this.currentDisplayId != id) {
			if (!this.recentDisplayedGameViews[id]){
				gameModel = myGames.findWhere({"_id":id});
				var gameType = "";
				if(gameModel.attributes.type == "tictactoe"){
					gameType = "TicTacToeBoardView";
				}
				this.recentDisplayedGameViews[id] = new window[gameType](id).render();
			}
			if(this.currentGameView){
				this.currentGameView.$el.remove();
			}
			this.currentDisplayId = id;
			this.currentGameView = this.recentDisplayedGameViews[id];
			$("#game-playspace-holder", this.$el).append(this.currentGameView.$el);
			this.currentGameView.update();
		}
		
		$("#game-playspace-holder", this.$el).css("display","block");
	}
});