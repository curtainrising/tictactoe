window.SignUpView = Backbone.View.extend({

	initialize: function() {
		var self = this;
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
		"click #create-user-button": "createUser",
		"keyup #username-create-input": "resetError",
		"keyup #password-create-input": "resetError",
		"keyup #password-reenter-passinputword": "resetError"
	},
	resetError: function(event) {
		$("#sign-up-error-holder", this.$el).css("display","none");
		$("#sign-up-error-holder", this.$el).html("");
	},
	createUser: function(event) {
		var password = $("#password-create-input", this.$el).val();
		var reEnteredPassword = $("#password-reenter-input", this.$el).val();
		var username = $("#username-create-input", this.$el).val();
		var error = "";
		if(username == ""){
			error = "no username entered";
		} else if (password == ""){
			error = "no password entered";
		} else if (reEnteredPassword == ""){
			error = "please re-enter password";
		} else if(password != reEnteredPassword){
			error = "passwords do not match";
		}
		if(error != "") {
			$("#sign-up-error-holder", this.$el).css("display","block");
			$("#sign-up-error-holder", this.$el).html(error);
		}
		var hashedPassword = sjcl.encrypt(this.salt, password);
		var randomString = app.randomString(15);
		var hashedAll = sjcl.encrypt(randomString, hashedPassword + this.salt + randomString);
		var hashedAll = JSON.stringify(hashedAll);
		var data = {"username": username, "password":hashedAll, "salt": randomString};
		app.user = new userModel(data);
		app.user.save(data,{
			success: function(stuff, data) {
				app.user.unset("password");
				app.logIn();
				
			},
			error : function(errorStatus, errorMessage){
				console.log(errorMessage);
				error = errorMessage.responseJSON.message;
				$("#sign-up-error-holder", this.$el).css({"display":"block"});
				$("#sign-up-error-holder", this.$el).html(error);
				app.user = null;
			}
		});
	}
});