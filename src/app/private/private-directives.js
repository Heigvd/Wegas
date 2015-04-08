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
        scope.profile = function () {
          alert('Sorry... Not yet implemented');
        }
        scope.logout = function(){
          $state.go("wegas.private.logout");
        };
        $(document).on('click', function (e) {
          var $menu = $('.menu');
          var $menuToggler = $('#menu-toggler');
          var $labelMenuToggler = $('label[for="menu-toggler"]');
          // if element is opened and click target is outside it, hide it
          if ($menuToggler.is(':checked') && !$menu.is(e.target)  && !$labelMenuToggler.is(e.target)) {
            $menuToggler.trigger('click');
          }
        });
    }
  };
});