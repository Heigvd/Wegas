angular.module('private', [
   'private.player',
   'private.trainer',
   'private.scenarist',
    "wegas.service.viewInfos"
])
.config(function ($stateProvider) {
    $stateProvider
        .state('wegas.private', {
            url: '',
            abstract:true,
            views: {
                'main@': {
                    controller: 'PrivateCtrl as privateCtrl',
                    templateUrl: 'app/private/private.tmpl.html'
                }
            }
        })
    ;
})
.controller('PrivateCtrl', function PrivateCtrl($state, Auth) {
    var privateCtrl = this;
    Auth.getAuthenticatedUser().then(function(user){
        if(user == null){
            $state.go("wegas.public");
        }
        privateCtrl.user = user;
    }); 
})
.directive('privateSidebar', function(ViewInfos, Auth) {
  return {
    templateUrl: 'app/private/private-sidebar.tmpl.html',
    link: function (scope, element, attrs) {
        Auth.getAuthenticatedUser().then(function(user){
            scope.user = user;
            console.log(scope.user);
        });
        scope.$watch(function(){
            return ViewInfos.name;
        }, function(newVal, oldVal){
            scope.name = newVal;
            console.log(scope.name);
        });
    }
  };
});