window.LogInView = Backbone.View.extend({

	initialize: function() {
		var self = this;
    console.log('here');
		return $.ajax({
			type: "GET",
			contentType: 'application/json',
			dataType: "json",
			url : app.apiUrl() + "/signlogauth",
			success: function(data) {
				self.salt = data.salt;
				return self;
			}
		});
	},
	render: function () {
		this.$el.append(this.template());
		
		return this;
	},
	
	events: {
		"click #log-in-user-button": "login",
		"keyup #username-log-in-input": "resetError",
		"keyup #password-log-in-input": "resetError"
	},
	resetError: function(event) {
		$("#log-in-error-holder", this.$el).css("display","none");
		$("#log-in-error-holder", this.$el).html("");
	},
	setError: function(error){
		$("#log-in-error-holder", this.$el).css("display","block");
			$("#log-in-error-holder", this.$el).html(error);
	},
	login: function(event) {
		var self = this;
		var password = $("#password-log-in-input", this.$el).val();
		var username = $("#username-log-in-input", this.$el).val();
		var error = "";
		if(password == ""){
			error = "enter password";
		} else if(username == ""){
			error = "enter suername";
		}
		if(error != ""){
			$("#log-in-error-holder", this.$el).css("display","block");
			$("#log-in-error-holder", this.$el).html(error);
		}
		var hashedPassword = sjcl.encrypt(this.salt, password);
		var randomString = app.randomString(15);
		var hashedAll = sjcl.encrypt(randomString, hashedPassword + this.salt + randomString);
		var data = {"username": username, "password":hashedAll, "salt": randomString};
		$.ajax({
			type: "POST",
			contentType: 'application/json',
			data: JSON.stringify(data),
			dataType: "json",
			url : app.apiUrl() + "/player/login",
			success: function(data) {
				app.user = new userModel(data);
				app.logIn();
			},
			error: function(error){
				console.log(error);
				self.setError(error.responseJSON.message);
			}
		});
	}
});