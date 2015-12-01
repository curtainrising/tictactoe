var gameModel = Backbone.Model.extend({
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
	url: function(gameId) {
		if(!gameId) {
			return app.apiUrl() + "/player/" + app.user.id + "/game";
		}
		return app.apiUrl() + "/player/" + app.user.id + "/game/" + gameId;
	}
});
var gameCollection = Backbone.Collection.extend({
	model: gameModel,
	url: function() {
		return app.apiUrl() + "/player/" + app.user.id + "/game";
	}
});
