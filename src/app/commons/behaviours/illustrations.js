
angular.module('wegas.behaviours.illustrations', [])
.directive('illustrationEditable', function(){
	return function(scope, element, attrs){
     	$(element).addClass("card__illustration--editable");
     	// Implement events around editor box with icons and colors palette
	};
});