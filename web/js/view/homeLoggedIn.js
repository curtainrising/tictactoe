window.HomeLoggedInView = Backbone.View.extend({
	id: "logged-in-home",
	initialize: function () {
		this.currentNavButton = null;
		this.currentMainView = null;
		this.playerInventory = null;
		this.cardModifier = null;
		this.games = null;
		this.playerProfile = null;
		return this;
	},
	
	render: function () {
		this.$el.append(this.template());
		this.currentNavButton = $(".active", this.$el);
		this.currentMainView = $("#home", this.$el);
		$(".logged-in-home-username", this.$el).html(app.user.attributes.username);
		return this;
	},
	
	events: {
		"click .nav-option": "changeActiveNavOption",
		"click .nav-inventory" : "setupInventory",
		"click .nav-home" : "setupHome",
		"click .nav-card-modifier" : "setupCardModifier",
		"click .nav-game" : "setupGames",
		"click .nav-profile": "setupPlayerProfile",
		"click .logged-in-home-log-out" : "logOut"
	},
	changeActiveNavOption: function(event) {
		this.currentNavButton.removeClass("active");
		// 1: the event.target is not a jquery element
		// 2: the event.target is the name of the nav element
		this.currentNavButton = $(event.target).parent();
		this.currentNavButton.addClass('active');
	},
	setupInventory: function(event) {
		if (!this.playerInventory) {
			this.playerInventory = new InventoryView();
			$("#inventory", this.$el).append(this.playerInventory.render().$el);
		}
		if(this.currentMainView != $("#inventory", this.$el)){
			this.currentMainView.css("display","none");
			this.currentMainView = $("#inventory", this.$el);
			this.currentMainView.css("display","block");
		}
	},
	setupHome: function(event) {
		if(this.currentMainView != $("#home", this.$el)){
			this.currentMainView.css("display","none");
			this.currentMainView = $("#home", this.$el);
			this.currentMainView.css("display","block");
		}
	},
	setupCardModifier: function(event) {
		if (!this.cardModifer) {
			this.cardModifer = new CardModifierView();
			$("#cardModifier", this.$el).append(this.cardModifer.render().$el);
		}
		if(this.currentMainView != $("#cardModifier", this.$el)){
			this.currentMainView.css("display","none");
			this.currentMainView = $("#cardModifier", this.$el);
			this.currentMainView.css("display","block");
		}
	},
	setupGames: function(event) {
		if (!this.games) {
			this.games = new GameView();
			$("#game", this.$el).append(this.games.render().$el);
		}
		if(this.currentMainView != $("#game", this.$el)){
			this.currentMainView.css("display","none");
			this.currentMainView = $("#game", this.$el);
			this.currentMainView.css("display","block");
		}
	},
	setupPlayerProfile: function(event) {
		if (!this.playerProfile) {
			this.playerProfile = new ProfileView(app.user.id);
			$("#profile", this.$el).append(this.playerProfile.render().$el);
		}
		if(this.currentMainView != $("#profile", this.$el)){
			this.currentMainView.css("display","none");
			this.currentMainView = $("#profile", this.$el);
			this.currentMainView.css("display","block");
		}
	},
	logOut : function(event) {
		app.logOut();
	}
});