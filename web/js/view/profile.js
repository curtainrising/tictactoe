window.ProfileView = Backbone.View.extend({
	gameChoiceOptionTemplate: _.template(
		'<option class="game-stats-choose-game-option" value="<%=type%>"><%=name%></option>'
	),
	gameStatTemplate: _.template(
		'<li>' + 
			'<span class="game-stat"><%=name%></span>:' + 
			'<span class="game-stat-number"><%=stat%></span>' +
		'</li>'
	),
	initialize : function(data) {
		return this;
	},
	render: function() {
		this.$el.append(this.template());
		var self = this;
		for(var i in config.common.currentPlayableGames){
			var data = {
				type : i,
				name : config.common.currentPlayableGames[i]
			};
			$("#profile-game-stats-choose-game",this.$el).append(this.gameChoiceOptionTemplate(data));
		}
		return this;
	},
	events: {
		"change #profile-game-stats-choose-game": "displayGameStats"
	},
	displayGameStats: function(event){
		var self = this;
		var value = event.currentTarget.value;
		$("#profile-game-stats-display-holder", this.$el).empty();
		if(value == "empty"){
			return;
		}
		app.user.fetch({
			success: function(model, modelData){
				var stats = modelData.gameStats[value];
				for(var i in stats){
					var data = {
						name : i,
						stat : stats[i]
					};
					var tempEl = self.gameStatTemplate(data);
					console.log('here');
					$("#profile-game-stats-display-holder", self.$el).append(tempEl);
				}
			}
		});
		
	}
});