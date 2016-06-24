angular.module('wegas.service.responses', [])
.factory('Responses', function(Flash) {
	"use strict";
	var create = function(level, message, data, custom){
		return {
			level: level,
			message: message,
			data: data,
            custom: custom,
			flash: function(customMessage){
				var flashMessage = customMessage || message;
				Flash(level, flashMessage);
			},
			isErroneous: function(){
				return (data === false);
			},
            getCustom: function(){
                return custom;
            }
		};
	};
	return {
		success: function(message, data, custom){
			return create("success", message, data, custom);
		},
		danger: function(message, data, custom){
			return create("danger", message, data, custom);
		},
		warning: function(message, data, custom){
			return create("warning", message, data, custom);
		},
		info: function(message, data, custom){
			return create("info", message, data, custom);
		}
	};
});
