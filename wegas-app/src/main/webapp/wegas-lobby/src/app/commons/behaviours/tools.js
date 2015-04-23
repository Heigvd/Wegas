'use strict';
angular.module('wegas.behaviours.tools', [])
.directive('toolOpenable', function(){
  return function(scope, element, attr){
  	$(element).find(".tool__link").on("click", function(e){
  		if($(element).hasClass("tool--open")){
	  		$(element).removeClass("tool--open");
  		}else{
			$(element).addClass("tool--open");
  		}
  	});
  };
})
;