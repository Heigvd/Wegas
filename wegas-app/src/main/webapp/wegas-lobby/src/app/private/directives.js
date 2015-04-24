angular.module('private.directives', [
    'wegas.service.viewInfos'
])
    .directive('privateSidebar', function($state, ViewInfos, Auth) {
        return {
            templateUrl: 'app/private/directives.tmpl/sidebar.html',
            link: function(scope, element, attrs) {

                Auth.getAuthenticatedUser().then(function(user) {
                    scope.user = user;
                });

                scope.$watch(function() {
                    return ViewInfos.name;
                }, function(newVal, oldVal) {
                    scope.name = newVal;
                });

                scope.profile = function() {
                    alert('Sorry... Not yet implemented');
                };

                scope.logout = function() {
                    Auth.logout().then(function() {
                        $state.go("wegas.public.login");
                    });
                };

                scope.editProfile = function() {
                    // Decide which controller to display in background
                    if ($state.current.name == "wegas.private.scenarist") {
                        profileState = "wegas.private.profile.scenarist";
                    } else if ($state.current.name == "wegas.private.trainer") {
                        profileState = "wegas.private.profile.trainer";
                    } else if ($state.current.name == "wegas.private.player") {
                        profileState = "wegas.private.profile.player";
                    } else if ($state.current.name == "wegas.private.admin") {
                        profileState = "wegas.private.profile.admin";
                    } else if ($state.current.name == "wegas.private.admin.users") {
                        profileState = "wegas.private.profile.admin.users";
                    } else {
                        profileState = "wegas.private.profile";
                    }
                    $state.go(profileState);
                };

                scope.logout = function() {
                    $state.go("wegas.private.logout");
                };

                $(document).on('click', function(e) {
                    var $menu = $('.menu');
                    var $menuToggler = $('#menu-toggler');
                    var $labelMenuToggler = $('label[for="menu-toggler"]');
                    // if element is opened and click target is outside it, hide it
                    if ($menuToggler.is(':checked')) {
                        if ($menu.is(e.target) || $menuToggler.is(e.target) || $labelMenuToggler.is(e.target)) {
                            return;
                        } else {
                            $menuToggler.trigger('click');
                        }
                    }
                    return;
                });
            }
        };
    });