
angular.module('wegas.behaviours.illustrations', [])
.directive('illustrationEditable', function(){
	"use strict";
	return function(scope, element){
     	$(element).addClass("card__illustration--editable");
     	// Implement events around editor box with icons and colors palette
	};
});