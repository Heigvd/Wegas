angular.module('wegas.behaviours.expandable', [])
.directive('expandable', function(){
    return function(scope, element, attrs){
        scope.$on('expand', function() {
            if(!element.hasClass("view--expanded")){
                element.addClass("view--expanded");
            }
        });
        
        scope.$on('collapse', function() {
            if(element.hasClass("view--expanded")){
                element.removeClass("view--expanded");
            }
        });
    };
})
.directive('expander', function(){
    return function(scope, element, attrs){
        element.on("click", function(){
            scope.$emit('expand');
        });
        
    };
})
.directive('collapser', function(){
    return function(scope, element, attrs){
        element.on('click', function(e) {
            scope.$emit('collapse');
        });
    };
});        
