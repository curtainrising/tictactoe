var gameInviteModel = Backbone.Model.extend({
	defaults: {
		
	},
	sync: function(method, model, options){console.log(method);
		if(method=='GET'){
			options.url = model.url; 
		}else{
			options.url = this.url(model.attributes._id); 
		}
		return Backbone.sync(method, model, options);
	},
	idAttribute: "_id",
	url: function(inviteId) {
		if(!inviteId) {
			return app.apiUrl() + "/player/" + app.user.id + "/gameInvite";
		}
		return app.apiUrl() + "/player/" + app.user.id + "/gameInvite/" + inviteId;
	}
});
var gameInviteCollection = Backbone.Collection.extend({
	model: gameInviteModel,
	url: function() {
		return app.apiUrl() + "/player/" + app.user.id + "/gameInvite";
	}
});
