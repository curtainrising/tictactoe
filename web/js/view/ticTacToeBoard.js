window.TicTacToeBoardView = Backbone.View.extend({
	markedBoxes : {},
	numberOfMoves: 0,
	initialize: function(gameId){
		this.numberOfMoves = 0;
		var self = this;
		this.model = myGames.findWhere({"_id":gameId});
		this.hasWinner = false;
		this.player = this.model.attributes.playersById[app.user.id];
		this.markedBoxes = {
			0 : {0:'', 1: '', 2:''},
			1 : {0:'', 1: '', 2:''},
			2 : {0:'', 1: '', 2:''}
		};
		app.socket.on("action-" + self.model.id, function(data){
			self.model.fetch({
				success: function(gameModel, gameData){
					self.catchUp(self.numberOfMoves -1);
					if(!self.checkWin()){
						self.determinePlayer();
					}
				}
			});
		});
	},
	render: function () {
		var drawSent = false;
		var surrenderSent = false;
		var templateAttr = {
			id : this.model.id
		};
	
		this.$el.append(this.template(templateAttr));
		this.setupButtons(this.model.attributes);
		this.catchUp();

		return this;
		
	},
	events: {
		"click .tic-tac-toe-square": "clickSquare",
	},
	clickSquare: function(event){
		rowNumber = Number(event.currentTarget.getAttribute('value'));
		columnNumber = Number(event.currentTarget.parentNode.getAttribute('value'));
		var error = null;
		var self = this;
		if(!this.hasWinner && this.model.attributes.currentPlayer == this.player && this.markedBoxes[columnNumber][rowNumber] == '') {
			var move = {
				player : this.player,
				column: columnNumber,
				row: rowNumber
			};
			var action = {
				'move' : move
			};
			$.ajax({
				type: "PUT",
				contentType: 'application/json',
				dataType: "json",
				url : app.apiUrl() + "/player/" + app.user.id + "/game/" + this.model.id,
				data: JSON.stringify(action),
				headers:{"access-token": app.user.attributes.token},
				success: function(data){
					self.model.set(data);
					self.doMove(move);
					if(!self.checkWin()){
						self.determinePlayer();
					}
				}
			});
		} else if(this.markedBoxes[columnNumber][rowNumber] != ''){
			//someone already went there
			error = "illegal move";
			
		} else if(this.hasWinner){
			// game is over
			error = "game is over";
		} else {
			//not your turn
			error = "not your turn";
		}
		if (error) {
			$("#error-message-holder").html(error);
		}
	},
	setupButtons: function(data) {
		if(data.draw == true || data.draw == "true"){
			this.catsGame();
		} else if(data.requestedDraw != "") {
			if(data.requestedDraw == app.user.id){
				$("#draw-button-" + this.model.id, this.$el).html("Draw Sent");
			} else {
				$("#draw-button-" + this.model.id, this.$el).html("Accept Draw");
			}
		} else {
			$("#draw-button-" + this.model.id, this.$el).html("Draw");
		}
		if(data.surrendered[app.user.id]){
			$("#surrender-button-" + this.model.id, this.$el).html("Surrender Sent");
		} else {
			$("#surrender-button-" + this.model.id, this.$el).html("Accept Surrender");
		}
	},
	update: function() {
		var self = this;
		this.model.fetch({
			success: function(stuff, data){
				self.updateAfterFetch(data);
			}
		});
	},
	updateAfterFetch: function(data){
		this.setupButtons(data);
		if(this.numberOfMoves != data.moves.length){
			this.catchUp(self.numberOfMoves - 1);
		} else if(data.draw == "true" || data.draw == true){
			this.catsGame();
		} else if(data.winner != ""){
			this.win(data.winString);
		}
	},
	catchUp: function(startAt) {
		moves = this.model.attributes.moves;
		if (!startAt || startAt < 0) {
			startAt = 0;
		}
		for(var i = startAt; i < moves.length; i++) {
			this.doMove(moves[i]);
		}
		if(!this.checkWin()){
			this.determinePlayer();
		}
	},
	doMove: function(move){
		var mark="";
		if(move.player == "0"){
			mark = "X";
		} else {
			mark = "O";
		}
		var row = Number(move.row);
		var column = Number(move.column);
		if(this.markedBoxes[column][row] == ""){
			var selector = "#tic-tac-toe-square-" + row + "-" + column;
			$(selector, this.$el).html(mark);
			this.markedBoxes[column][row] = mark.toLowerCase();
			this.numberOfMoves++;
		}
		
	},
	determinePlayer: function(){
		//TODO
		if(this.model.attributes.winner != "" && (this.model.attributes.draw == "false" || this.model.attributes.draw == false)){
			return;
		}
		var player = this.model.attributes.currentPlayer;
		if(this.model.attributes.players[player] == app.user.id){
			$("#current-player-holder", this.$el).html('your turn');
		} else {
			$("#current-player-holder", this.$el).html('opponent turn');
		}
	},
	checkWin: function(){
		if(this.numberOfMoves <= 4){
			return false;
		}
		if(this.numberOfMoves >= 9){
			this.catsGame();
			return true;
		}
		if(this.hasWinner) {
			return true;
		}
		if(this.model.attributes.winner != ""){
			this.win(this.model.attributes.winString);
			return true;
		}
		return false;
	},
	win: function(message) {
		this.hasWinner = true;
		$("#error-message-holder").html('');
		$("#current-player-holder").html('');
		$("#win-message-holder", this.$el).html(message);
		this.removeButtons();
	},
	catsGame: function(){
		this.hasWinner = true;
		this.winner = "cat";
		$("#error-message-holder").html('');
		$("#current-player-holder").html('');
		$("#win-message-holder", this.$el).html("cats game");
		this.removeButtons();
	},
	removeButtons: function() {
		$("#surrender-button-" + this.model.id, this.$el).remove();
		$("#draw-button-" + this.model.id, this.$el).remove();
	}
});