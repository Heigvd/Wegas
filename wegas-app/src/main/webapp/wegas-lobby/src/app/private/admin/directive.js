angular.module('private.admin.directives', [
])
.directive('adminActions', function($state, ViewInfos, Auth) {
    return {
        templateUrl: 'app/private/admin/directives.tmpl/actions.html',
        replace: true, 
        link: function(scope, elem, attrs){
        	scope.ServiceURL = ServiceURL;
        }
    }
})
