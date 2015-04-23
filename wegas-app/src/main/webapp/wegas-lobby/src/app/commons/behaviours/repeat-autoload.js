angular.module('wegas.behaviours.repeat.autoload', [])
.directive('repeatAutoLoad', function($rootScope){
	return function(scope, element, attrs){
		element.bind('scroll', function() {
			var stateScroll = element.height() + element.scrollTop(),
	    	 	maxHeight = (this.scrollHeight - 40) - 50;
	    	if(stateScroll >= maxHeight){
	    		$rootScope.$emit("changeLimit", true);
	    	}
	    });
	};
});