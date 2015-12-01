var userModel = Backbone.Model.extend({
	defaults: {
		
	},
	idAttribute: "_id",
	url: function() {
		if(this.id){
			return app.apiUrl() + "/player/" + this.id;
		}
		return app.apiUrl() + "/player/";
	}
});