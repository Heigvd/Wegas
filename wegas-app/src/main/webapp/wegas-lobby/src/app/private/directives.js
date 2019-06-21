angular.module('private.directives', [])
    .directive('privateSidebar', function($state, $rootScope, $translate, $timeout, WegasTranslations, Auth) {
        "use strict";
        return {
            templateUrl: 'app/private/directives.tmpl/sidebar.html',
            link: function(scope, element, attrs) {
                var config = localStorage.getObject("wegas-config");
                scope.currentLanguage = $translate.use();
                scope.languages = WegasTranslations.languages;
                $rootScope.currentRole = "GUEST"; // Set initially as Guest for safety

                Auth.getAuthenticatedUser().then(function(user) {
                    scope.user = user;
                    scope.changeLanguage = function(key) {
                        var type = "";
                        config.commons.language = key;
                        config.users[scope.user.email].language = key;
                        scope.currentLanguage = key;
                        $translate.use(key);
                        localStorage.setObject("wegas-config", config);
                        switch ($state.current.name) {
                            case "wegas.private.scenarist":
                                type = "SCENARIST";
                                break;
                            case "wegas.private.trainer":
                                type = "TRAINER";
                                break;
                            case "wegas.private.player":
                                type = "PLAYER";
                                break;
                            case "wegas.private.admin":
                            case "wegas.private.admin.users":
                            case "wegas.private.admin.groups":
                            case "wegas.private.admin.who":
                                type = "ADMIN";
                                break;
                        }
                        $rootScope.currentRole = type;
                        $rootScope.translationWorkspace = {workspace: WegasTranslations.workspaces[type][$translate.use()]};
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

                scope.verifyEmail = function() {
                    Auth.requestEmailValidation().then(function(response) {
                        response.flash();
                    });
                };

                scope.editProfile = function() {
                    // Decide which controller to display in background
                    var profileState;
                    switch ($state.current.name) {
                        case "wegas.private.modeler":
                            profileState = "wegas.private.profile.modeler";
                            break;
                        case "wegas.private.scenarist":
                            profileState = "wegas.private.profile.scenarist";
                            break;
                        case "wegas.private.trainer":
                            profileState = "wegas.private.profile.trainer";
                            break;
                        case "wegas.private.player":
                            profileState = "wegas.private.profile.player";
                            break;
                        case "wegas.private.admin":
                            profileState = "wegas.private.profile.admin";
                            break;
                        case "wegas.private.admin.users":
                            profileState = "wegas.private.profile.admin.users";
                            break;
                        case "wegas.private.admin.groups":
                            profileState = "wegas.private.profile.admin.groups";
                            break;
                        case "wegas.private.admin.who":
                            profileState = "wegas.private.profile.admin.who";
                            break;
                        default:
                            profileState = "wegas.private.profile";

                    }
                    $state.go(profileState);
                };

                scope.logout = function() {
                    $state.go("wegas.private.logout");
                };

                scope.menuClick = function(e) {
                    e.stopPropagation();
                    e.preventDefault();
                    $('#menu-toggler').trigger('click');
                    return false;
                };

                $(document).on('click', function(e) {
                    var $menu = $('.menu');
                    var $menuToggler = $('#menu-toggler');

                    // if element is opened and click target is outside it, hide it
                    if ($menuToggler.is(':checked')) {
                        if ($menu.is(e.target) || $menuToggler.is(e.target)
                            || $('#roleMenuTitle').is(e.target)
                            || $('label[for="menu-toggler"]').is(e.target)) {
                            return;
                        } else {
                            $menuToggler.trigger('click');
                        }
                    }
                    if ($(".action--language .subactions").hasClass("subactions--show")) {
                        $(".action--language .subactions").removeClass("subactions--show");
                    }
                    return;
                });

                $timeout(function() {
                    // Install click handler on role menu title (which must exist beforehand):
                    /*
                     var roleMenuTitle = $('#roleMenuTitle');
                     roleMenuTitle.unbind("click");
                     roleMenuTitle.on('click', function (e) {
                     e.preventDefault();
                     $('#menu-toggler').trigger('click');
                     return false;
                     });
                     */
                    // Install click handler on language menu title
                    var actionLanguage = $('.action--language');
                    actionLanguage.unbind("click");
                    actionLanguage.on("click", ".button--language", function(e) {
                        e.stopPropagation();
                        e.preventDefault();
                        $(".action--language .subactions").toggleClass("subactions--show");
                    });
                });
            }
        };
    });
