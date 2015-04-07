angular.module('wegas.service.responses', [])
.factory('Responses', function() {
	var create = function(level, message, data){
		return {
			level: level,
			message: message,
			data: data
		};
	}
	return {
		success: function(message, data){
			return create("success", message, data);
		},
		error: function(message, data){
			return create("error", message, data);
		},
		warning: function(message, data){
			return create("warning", message, data);
		},
		info: function(message, data){
			return create("info", message, data);
		}
	};
});
