angular.module('private.directives', [
    'wegas.service.viewInfos'
])
.directive('privateSidebar', function($state, ViewInfos, Auth) {
  return {
    templateUrl: 'app/private/private-sidebar.tmpl.html',
    link: function (scope, element, attrs) {
        Auth.getAuthenticatedUser().then(function(user){
            scope.user = user;
        });
        scope.$watch(function(){
            return ViewInfos.name;
        }, function(newVal, oldVal){
            scope.name = newVal;
        });
        scope.logout = function(){
            Auth.logout().then(function(){
                $state.go("wegas.public.login");
            });
        };
    }
  };
});