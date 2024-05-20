var mongoose = require('mongoose');
var Q = require('q');

var MongoDB = function () {
  try {
    this.db = mongoose.connect(
      process.env.MONGO_URL || 'mongodb://localhost:27017/textdb',
      {
        "auth": {
          "authSource": "admin"
        },
        "user": process.env.MONGO_USER,
        "pass": process.env.MONGO_PASS,
      }
    );
  } catch (error) {
    throw error
  }
	return this;
};

var models = [],
	currentModel;
MongoDB.prototype.getModel = function(schemaName) {
	if (!schemaName) return null;
	if (!models[schemaName]) {
		var schema = require("../api/schemas/" + schemaName)[schemaName];
		models[schemaName] = this.db.model(schemaName, this.db.Schema(schema, {"minimize":false}), schemaName);
	}
	currentModel = models[schemaName];
	this.currentModel = models[schemaName];
	return models[schemaName];
};

MongoDB.prototype.use = function(schemaName, type, query, changedData, options){
	var currentModel = this.getModel(schemaName);
	if(!currentModel){
		return null;
	}
	var deferred = Q.defer();
	var functionPath = null;
	currentModel.count(function(countErr, count){
		if(type == "findAll"){
			functionPath = currentModel.find();
		} else if(type == "find"){
			functionPath = currentModel.find(query);
		} else if(type == "findOne"){
			functionPath = currentModel.findOne(query);
		} else if(type == "findOneAndModify"){
			functionPath = currentModel.findOneAndUpdate(query, changedData);
		} else if(type == "findOneAndRemove"){
			functionPath = currentModel.findOneAndRemove(query);
		} else if(type == "insert"){
			functionPath = new currentModel(query);
			functionPath.save(function (err, data) {
				if (err) {
					deferred.reject(err);
				}
				deferred.resolve(data);
			});
		}
		if (!options){
		} else if(options.random){
			var rand = Math.floor(Math.random() * count);
			functionPath.skip(rand);
		} else if(options.limit){
			functionPath.limit(options.limit);
		}
		if(functionPath != null && type != "insert"){
			functionPath.exec(function (err, data) {
				if (err) {
					deferred.reject(err);
				}
				deferred.resolve(data);
			});
		}
	});
	return deferred.promise;
};
MongoDB.prototype.findAll = function(schemaName) {
	if (!currentModel && schemaName) {
		currentModel = this.getModel(schemaName);
	}
	var deferred = Q.defer();
	currentModel.find(function (err, data) {
		if (err) {
			deferred.reject(err);
		}
		deferred.resolve(data);
	});
	return deferred.promise;
};
MongoDB.prototype.find = function(query, limit){
	if (!currentModel) {
		return null;
	}
	var deferred = Q.defer();
	var findFunctionPath = null;
	if(limit == null) {
		findFunctionPath = currentModel.find(query);
	} else {
		findFunctionPath = currentModel.find(query).limit(limit);
	}
	findFunctionPath.exec(function (err, data) {
		if (err) {
			deferred.reject(err);
		}
		deferred.resolve(data);
	});
	return deferred.promise;
};

MongoDB.prototype.findOne = function(query) {
	if (!currentModel) {
		return null;
	}
	var deferred = Q.defer();
	currentModel.findOne(query,function (err, data) {
		if (err) {
			deferred.reject(err);
		}
		deferred.resolve(data);
	});
	return deferred.promise;
};
MongoDB.prototype.findOneRandom = function() {
	if (!currentModel) {
		return null;
	}
	var deferred = Q.defer();
	currentModel.count(function(countErr, count){
		
		currentModel.findOne().skip(rand).exec( function (err, data) {
			if (err) {
				deferred.reject(err);
			}
			deferred.resolve(data);
		});
	});
	return deferred.promise;
};
//must have already found and modified data
MongoDB.prototype.findOneAndModify = function(query, modifiedData) {
	if (!currentModel) {
		return null;
	}
	var deferred = Q.defer();
	this.currentModel.findOneAndUpdate(query,modifiedData, function (err, data) {
		if (err) {
			deferred.reject(err);
		}
		deferred.resolve(data);
	});
	return deferred.promise;
};

MongoDB.prototype.findOneAndRemove = function(query) {
	if (!currentModel) {
		return null;
	}
	var deferred = Q.defer();
	currentModel.findOneAndRemove(query,function (err, data) {
		if (err) {
			deferred.reject(err);
		}
		deferred.resolve(data);
	});
	return deferred.promise;
};

MongoDB.prototype.insert = function(query){
	if(!currentModel) {
		return null;
	}
	var deferred = Q.defer();
	var tempModel = new currentModel(query);
	tempModel.save( function(err, data) {
		if (err) {
			deferred.reject(err);
		}
		deferred.resolve(data);
	});
	return deferred.promise;
};

var instance;
exports.getInstance = function () {
	if (!instance) {
		instance = new MongoDB();
	}
	return instance;
};
