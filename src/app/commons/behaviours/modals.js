angular.module('wegas.behaviours.modals', [])
.directive('modalInit', function($animate){
	return {
		link : function(scope, element, attrs){
			var shadow = $(".shadow");			
    		$animate.addClass(element, "modal--open");
    		$animate.addClass(shadow, "shadow--show");
		}
	};
})
.directive('modalClose', function($animate, $q){
	return {
		scope : {
			modalState: "=",
			modalHide: "&",
			modalCallback: "&"
		},
		link : function(scope, element, attrs){
			var loadScope = function(){
		      	var deferred = $q.defer();
	        	scope.$apply(function(){
	        		deferred.resolve(true);
	        	});
      			return deferred.promise;
			};
			element.bind('click', function(){
				scope.modalHide();
				var shadow = $(".shadow");
				var modal = $(".modal");	
		       	loadScope().then(function(){
		       		if(scope.modalState == "close"){
						$animate.removeClass(shadow, "shadow--show");
				        $animate.removeClass(modal, "modal--open").then(function(){
				        	scope.modalCallback();
				        });
			    	}	
		       	});
			});
		}
	};
})
;