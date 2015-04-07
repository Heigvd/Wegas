angular
.module('private.profile.directives', [
])
.directive('profileIndex', function(UsersModel){
    return {

        templateUrl: 'app/private/profile/tmpl/profile-index.html',
        controller : function($scope, $stateParams, $sce, $rootScope, Auth) {
            var ctrl = this;
            $scope.user = {};
            Auth.getAuthenticatedUser().then(function (user) {
                $scope.user = user;
            });

            ctrl.updateInformations = function () {
                alert('ho!ü')
            }

        }
    };
})
.directive('profileContent', function(){
    return {
        templateUrl: 'app/private/profile/tmpl/profile-content.html',
        scope: true,
        require: "^profileIndex",
        link : function($scope, element, attrs, parentCtrl) {

            $scope.$watch(function() {
                return $scope.$parent.user
            } , function(n,o) {
                $scope.user = n;
            });
            $parent = parentCtrl;

        }
    };
})
.directive('profileTools', function(){
    return {
        templateUrl: 'app/private/profile/tmpl/profile-tools.html',
        scope: true,
        require: "^profileIndex",
        link : function($scope, element, attrs, parentCtrl) {

            $scope.updateInformations = function () {
                parentCtrl.updateInformations();
            }

        }
    };
})