angular.module('private.directives', [])
    .directive('privateSidebar', function($state, $rootScope, $translate, WegasTranslations, Auth) {
        return {
            templateUrl: 'app/private/directives.tmpl/sidebar.html',
            link: function(scope, element, attrs) {
                var config = localStorage.getObject("wegas-config");
                scope.currentLanguage = $translate.use();
                scope.languages = WegasTranslations.languages;
                    
                Auth.getAuthenticatedUser().then(function(user) {
                    scope.user = user;
                    scope.changeLanguage = function(key){
                        config.commons.language = key;
                        config.users[scope.user.email].language = key;
                        scope.currentLanguage = key;
                        $translate.use(key);
                        localStorage.setObject("wegas-config", config);
                    };
                });

                scope.$watch(function() {
                    return $rootScope.translationWorkspace;
                }, function(newValue) {
                    scope.translationWorkspace = newValue;
                });

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
                
                $('h2.view__headding-workspace').unbind("click");
                $('h2.view__headding-workspace').on('click', function(e) {
                    e.preventDefault();
                    $('#menu-toggler').trigger('click');
                    return false;
                });
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
                    if($(".action--language .subactions").hasClass("subactions--show")){
                        $(".action--language .subactions").removeClass("subactions--show");
                    }
                    console.log("World");
                    return;
                });
                $(element).ready(function(){
                    $(".action--language").on("click", ".button--language", function(e){
                        console.log("Hello");
                        e.stopPropagation();
                        e.preventDefault();
                        $(".action--language .subactions").toggleClass("subactions--show");
                    });
                });
               
            }
        };
    });