var AppRouter = Backbone.Router.extend({
	id: "logged-out-home",
	initialize: function () {
		this.user = null;
		if(document.cookie){
			var token = this.getCookie('token');
			if(token != ""){
				this.authenticate(token);
			} else {
				this.setupLoggedOutHome();
			}
		} else {
			this.setupLoggedOutHome();
		}
		
	},
	setupLoggedOutHome: function(){
		this.homeView = new HomeLoggedOutView();
		$(".header").append(this.homeView.render().$el);
	},
	getCookie: function(cname) {
		var name = cname + "=";
		var ca = document.cookie.split(';');
		for(var i=0; i<ca.length; i++) {
			var c = ca[i];
			while (c.charAt(0)==' '){
				c = c.substring(1);
			}
			if (c.indexOf(name) == 0) {
				return c.substring(name.length,c.length);
			}
		}
		return "";
	},
	authenticate: function(authToken) {
		var self = this;
		$.ajax({
			type: "POST",
			contentType: 'application/json',
			headers: {
				"access-token": authToken
			},
			dataType: "json",
			url : app.apiUrl() + "/authenticate",
			success: function(data) {
				self.user = new userModel(data);
				self.logIn();
			},
			error: function(error, erro1){console.log(error);
				self.setupLoggedOutHome();
				document.cookie = "token=; expires=Thu, 01 Jan 1970 00:00:00 UTC";
			}
		});
	},
	apiUrl: function(){
		return "http://" + config.baseUrl + ":" + config.apiPort;
	},
	logOut: function() {
		document.cookie = "token=; expires=Thu, 01 Jan 1970 00:00:00 UTC";
		myGames = null;
		myGameInvites = null;
		myGameQueues = null;
		document.cookie = null;
		this.user = null;
		this.homeView.$el.remove();
		this.homeView = null;
		this.homeView = new HomeLoggedOutView();
		$(".header").append(this.homeView.render().$el);
	},
	logIn: function() {
		//document.cookie = JSON.stringify({"token" : this.user.attributes.token});
		document.cookie = "token=" + this.user.attributes.token;
		Backbone.$.ajaxSetup({
			headers: {'access-token': this.user.attributes.token}
		});
		myGames = new gameCollection();
		myGameInvites = new gameInviteCollection();
		myGameQueues = new gameQueueCollection();
		if(this.homeView){
			this.homeView.$el.remove();
			this.homeView = null;
		}
		
		this.homeView = new HomeLoggedInView();
		$(".header").append(this.homeView.render().$el);
		this.socket = io.connect(app.apiUrl(), {query: "id=" + this.user.id});
	},
	randomString: function(length){
		var carrier = "1234567890abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUWXYZ";
		var randomString = "";
		for(var i = 0; i <length; i ++){
			var randomNumber = Math.floor(Math.random() * (carrier.length - 1));
			randomString += carrier[randomNumber];
		}
		return randomString;
	}
});
var app;
$("document").ready(function(){
	var views = ['Profile','TicTacToeBoard','Game', 'HomeLoggedOut', 'HomeLoggedIn', 'SignUp', 'LogIn'];
	var deferred = [];
	
	var myGames;
	var myGameInvites;
	var myGameQueues;
	var socket;
	$.each(views, function(index, view) {
		view += 'View';
		if(window[view]) {
			deferred.push($.get('html/' + view + '.html', function(data) {
				window[view].prototype.template = _.template(data);
			}));
		}
	});
	$.when.apply(null, deferred).done(function(){
		app = new AppRouter();
	});
});


