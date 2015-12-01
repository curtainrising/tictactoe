window.HomeView = Backbone.View.extend({
	 initialize: function () {
		this.currentNavButton = null;
		this.currentMainView = null;
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
		"click .nav-inventory" : "setupInventory",
		"click .nav-home" : "setupHome",
		"click .nav-card-modifier" : "setupCardModifier",
	},
	changethestuff: function(event) {
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
	}
});