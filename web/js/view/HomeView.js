window.HomeView = Backbone.View.extend({
	 initialize: function () {
		this.render();
	},
	
	render: function () {
		$(this.el).html(this.template());
		return this;
	},
	
	events: {
		"click .temptitle" : "dostuff"
	},
	
	dostuff: function(event) {
		alert("woo");
	}
});


