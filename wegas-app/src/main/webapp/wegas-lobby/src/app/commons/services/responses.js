angular.module('wegas.service.responses', [])
.factory('Responses', function(Flash) {
	"use strict";
	var create = function(level, message, data){
		return {
			level: level,
			message: message,
			data: data,
			flash: function(customMessage){
				var flashMessage = customMessage || message;
				Flash(level, flashMessage);
			},
			isErroneous: function(){
				return (data === false);
			}
		};
	};
	return {
		success: function(message, data){
			return create("success", message, data);
		},
		danger: function(message, data){
			return create("danger", message, data);
		},
		warning: function(message, data){
			return create("warning", message, data);
		},
		info: function(message, data){
			return create("info", message, data);
		}
	};
});
