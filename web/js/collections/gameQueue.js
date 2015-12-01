var gameQueueModel = Backbone.Model.extend({
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
	destroy: function(options){
		if(options && options.noSync == true){console.log('noSync');
			this.trigger('destroy', this, this.model, options);
			if(options.success){
				options.success();
			}
		} else {console.log('yes sync');
			return Backbone.Model.prototype.destroy.call(this, options);
		}
	},
	idAttribute: "_id",
	url: function(queueId) {
		if(!queueId) {
			return app.apiUrl() + "/player/" + app.user.id + "/queue";
		}
		return app.apiUrl() + "/player/" + app.user.id + "/queue/" + queueId;
	}
});
var gameQueueCollection = Backbone.Collection.extend({
	model: gameQueueModel,
	url: function() {
		return app.apiUrl() + "/player/" + app.user.id + "/queue";
	}
});
