angular.module('autologin', [
    'wegas.models.sessions'
])
    .config(function($stateProvider) {
        "use strict";
        $stateProvider
            .state('wegas.autologin', {
                url: 'play/:token',
                views: {
                    'main@': {
                        controller: 'AutologinCtrl as autologinCtrl',
                        templateUrl: 'app/autologin/autologin.tmpl.html'
                    }
                }
            })
            .state('wegas.consume_token', {
                url: 'token/:accountId/:token',
                views: {
                    'main@': {
                        controller: 'TokenCtrl as trokenCtrl',
                        templateUrl: 'app/autologin/wait.tmpl.html'
                    }
                }
            })
            .state('wegas.logout_before_token', {
                url: 'token_logout',
                views: {
                    'main@': {
                        controller: 'LogoutCtrl as trokenCtrl',
                        templateUrl: 'app/autologin/confirm_logout.tmpl.html'
                    }
                },
                params: {
                    message: null,
                    token: null,
                    accountId: null
                }
            });
    })
    .controller("LogoutCtrl", function(Auth, $scope, $stateParams, $state) {

        $scope.message = $stateParams.message;
        $scope.abort = function() {
            $state.go("wegas");
        };

        $scope.logOutAndContinue = function() {
            Auth.logout().then(function() {
                $state.go("wegas.consume_token", {
                    token: $stateParams.token,
                    accountId: $stateParams.accountId
                });
            });
        };
    })
    .controller("TokenCtrl", function(Auth, $scope, $stateParams, $state) {
        "use strict";

        /**
         * To consume the token once user is authenticated with the requested account
         * @param {type} token
         * @returns {undefined}
         */
        function process(token) {
            Auth.processToken(token)
                .then(function(token) {
                    // back to root
                    $state.go("wegas.public");
                    // postpone redirection to give the cookie time to register
                    window.setTimeout(function() {
                        // redirect
                        var newUrl = window.ServiceURL + token.redirectTo;

                        if (newUrl.startsWith("/")) {
                            newUrl = newUrl.slice(1);
                        }

                        window.location = window.location.pathname + newUrl;
                    }, 0);
                })
                .catch(function(error) {
                    $scope.errorMessage = error || "Error while processing token";
                });
        }

        function getUserDisplayName(user) {
            return user.isGuest ? "guest" : user.commonName;
        }

        $scope.errorMessage = "";

        /**
         * Fetch full token and make sure the user is authenticated with the correct account.
         * Redirect to login page or signup page is the token request authentication.
         * Redirect to confirm logout page if user is not authenticated with the correct account.
         * Create a guest is token request a anonymous login.
         *
         * If everything is fine, consume the token.
         */
        Auth.getToken($stateParams.accountId, $stateParams.token)
            .then(function(token) {
                var autoLogin = token.autoLogin;

                Auth.getAuthenticatedUser().then(function(user) {
                    if (user) {
                        // already logged-in
                        if (!token.account && autoLogin) {
                            // Such configuration implies a guest login
                            // Hence, user has to log out to continue

                            // ask confirmation to log out
                            var text = "You are currently logged in as \"" + getUserDisplayName(user) + "\".<br /></br />"
                                + "To ensure your privacy, you have to log out";

                            $state.go("wegas.logout_before_token", {
                                message: text,
                                accountId: $stateParams.accountId,
                                token: $stateParams.token
                            });
                        } else if (token.account && token.account.id != user.accountId) {
                            // The user is not logged in with the account requested by the token.

                            var text = "You are currently logged in as \"" + getUserDisplayName(user) + "\""
                                + " but your link/token has been crafted for \"" + token.account.name + "\".<br /><br />"
                                + "In order to continue, you have to log out";
                            $state.go("wegas.logout_before_token", {
                                message: text,
                                accountId: $stateParams.accountId,
                                token: $stateParams.token
                            });
                        } else {
                            // the user is logged in with the correct account
                            // or the token does not requeat any specific account
                            process(token);
                        }
                    } else {
                        // not logged-in
                        if (autoLogin) {
                            if (token.account) {
                                // Auto log in to to linked account
                                Auth.loginWithToken($stateParams.accountId, $stateParams.token)
                                    .then(function() {
                                        process(token);
                                    })
                                    .catch(function(error) {
                                        $scope.errorMessage = error || "Invalid token";
                                    });
                            } else {
                                // Auto login not linked to existing account means login as guest
                                Auth.loginAsGuest().then(function(responseAuth) {
                                    if (!responseAuth.isErroneous()) {
                                        process(token);
                                    } else {
                                        $scope.errorMessage = "Failed to create an anonymous account";
                                    }
                                });

                            }
                        } else {
                            // not authenticated and no autologin
                            if (token.account) {
                                // force to log-in with given accountg
                                switch (token.account["@class"]) {
                                    case "JpaAccount":
                                        // redirect to jpa login
                                        $state.go("wegas.public.login", {
                                            forcedUsername: token.account.email,
                                            redirectTo: "/#/token/" + $stateParams.accountId
                                                + "/" + $stateParams.token
                                        });
                                        break;
                                    case "AaiAccount":
                                        // redirect to aai login
                                        Auth.getAaiConfig().then(function(config) {
                                            window.location = config.loginUrl + "&redirect="
                                                + encodeURIComponent("/#/token/"
                                                    + $stateParams.accountId
                                                    + "/" + $stateParams.token);
                                        });
                                        break;
                                    case "GuestJpaAccount":
                                        // not sure this case could even happen...
                                        // no autologin and Guest are quite not compatible
                                        $scope.errorMessage = "Invalid Token for GuestAccount";
                                        break;
                                }
                            } else {
                                // log in with any account or create new one
                                // goto signup with redirectTo = this
                                $state.go("wegas.public.login", {
                                    redirectTo: "/#/token/" + $stateParams.accountId
                                        + "/" + $stateParams.token
                                });
                            }
                        }
                    }
                });
            })
            .catch(function(error) {
                $scope.errorMessage = error || "Invalid token";
            });
    })
    .controller("ResetPasswordCtrl", function(Auth, $scope, $stateParams, $state, WegasModalService) {
        "use strict";
        $scope.success = false;
        $scope.failure = false;
        Auth.loginWithToken($stateParams.token)
            .then(function() {
                WegasModalService.displayAModal({
                    templateUrl: 'app/private/profile/profile.tmpl.html',
                    controller: "ModalsController as modalsCtrl"
                }).then(function(modal) {
                    modal.close.then(function() {
                        $state.go("wegas");
                    });
                });
                $state.go("wegas.private.profile");
            })
            .catch(function(error) {
                $scope.errorMessage = error || "Invalid token";
            });
    })
    .controller("VerifyCtrl", function(Auth, $scope, $stateParams, $state) {
        "use strict";
        $scope.errorMessage = "";
        Auth.loginWithToken($stateParams.token)
            .then(function() {
                $state.go("wegas");
            })
            .catch(function(error) {
                $scope.errorMessage = error || "Invalid token";
                //$scope.$apply();
            });
    })
    .controller('AutologinCtrl',
        function AutologinCtrl(Auth, Flash, $scope, $state, $stateParams, TeamsModel, SessionsModel, $translate) {
            "use strict";
            var errorRedirect = function(response) {
                response.flash();
                $state.go("wegas");
            },
                joinIndividualSession = function(session) {
                    TeamsModel.joinIndividually(session).then(function(response) {
                        if (!response.isErroneous()) {
                            window.location.href = window.ServiceURL + "game-play.html?gameId=" + session.id;
                        } else {
                            errorRedirect(response);
                        }
                    });
                };
            SessionsModel.findSessionToJoin($stateParams.token).then(function(responseToken) {
                if (!responseToken.isErroneous()) {
                    Auth.getAuthenticatedUser().then(function(user) {
                        var session;
                        if (user) {
                            session = responseToken.data;
                            TeamsModel.getTeamBySessionId(session.id).then(function(responseTeam) {
                                if (!responseTeam.isErroneous()) {
                                    window.location.href = window.ServiceURL + "game-play.html?gameId=" + session.id;
                                } else {
                                    if (session.properties.freeForAll) {
                                        joinIndividualSession(session);
                                    } else {
                                        $state.go("wegas.private.join", {'token': $stateParams.token});
                                    }
                                }
                            });
                        } else {
                            session = responseToken.data;
                            if (session.properties.guestAllowed) {

                                $translate('COMMONS-TEAMS-GUEST-JOINING').then(function(message) {
                                    $scope.message = message;
                                });
                                Auth.loginAsGuest().then(function(responseAuth) {
                                    if (!responseAuth.isErroneous()) {
                                        if (session.properties.freeForAll) {
                                            joinIndividualSession(session);
                                        } else {
                                            $state.go("wegas.private.join", {'token': $stateParams.token});
                                        }
                                    } else {
                                        errorRedirect(responseToken);
                                    }
                                });
                            } else {
                                window.location.href = window.ServiceURL + "?redirect=" + encodeURIComponent("#/play/" + session.token);
                            }
                        }
                    });
                } else {
                    errorRedirect(responseToken);
                }
            });
        }
    );
