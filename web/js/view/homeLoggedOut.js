window.HomeLoggedOutView = Backbone.View.extend({
	 initialize: function () {
	 	this.signUp = null;
	 	this.currentMainView = null;
	 	this.currentNavButton = null;
		return this;
	},
	
	render: function () {
		this.$el.append(this.template());
		this.currentNavButton = $(".active", this.$el);
		this.currentMainView = $("#home", this.$el);
		return this;
	},
	
	events: {
		"click .nav-option": "changethestuff",
		'click .log-in-selector': "setupLogIn",
		"click .sign-up-selector": "setupSignUp"
	},
	changethestuff: function(event) {
		this.currentNavButton = $(event.target).parent();
		this.currentNavButton.addClass('active');
		$("#sign-up-log-in").css('display','none');
		
		$("#logged-out-home").css('display','block');
	},
	setupLogIn: function(event) {
		$("#sign-up-log-in").css('display','block');
		$("#logged-out-home").css('display','none');
		if(!this.logIn){
			this.logIn = new LogInView({"class": "main-page-log-in"});
			$("#log-in", this.$el).append(this.logIn.render().$el);
			this.currentMainView = $("#log-in", this.$el);
			$("#sign-up").css("display", "none");
		}
		if(this.currentMainView != $("#log-in", this.$el)){
			this.currentMainView.css("display","none");
			this.currentMainView = $("#log-in", this.$el);
			this.currentMainView.css("display","block");
		}
		this.currentNavButton.removeClass('active');
		var top = (app.height/2) - ($("#log-in", this.$el).height()/2);
		console.log(top);
		$("#sign-up-log-in").css("top", top);
	},
	setupSignUp: function(event) {
		$("#sign-up-log-in").css('display','block');
		$("#logged-out-home").css('display','none');
		if(!this.signUp){
			this.signUp = new SignUpView({"class": "main-page-sign-up"});
			$("#sign-up", this.$el).append(this.signUp.render().$el);
			this.currentMainView = $("#sign-up", this.$el);
			$("#log-in").css("display", "none");
		}
		if(this.currentMainView != $("#sign-up", this.$el)){
			this.currentMainView.css("display","none");
			this.currentMainView = $("#sign-up", this.$el);
			this.currentMainView.css("display","block");
		}
		this.currentNavButton.removeClass('active');
		var top = (app.height/2) - ($("#sign-up", this.$el).height()/2);
		console.log(top);
		$("#sign-up-log-in").css("top", top);
	}
});