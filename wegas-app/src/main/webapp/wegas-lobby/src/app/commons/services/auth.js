angular.module('wegas.service.auth', [
    'wegas.models.sessions'
])
    .service('Auth', function($http, $q, $interval, Responses) {
        var service = this,
            authenticatedUser = null,
            rights = null,
            loading = false,
            stopWaiting = function(waitFunction) {
                $interval.cancel(waitFunction);
            },
            wait = function() {
                var deferred = $q.defer(),
                    waitSessions = $interval(function() {
                        if (!loading) {
                            stopWaiting(waitSessions);
                            deferred.resolve(true);
                        }
                    }, 500);
                return deferred.promise;
            },
            getCurrentUser = function() {
                var deferred = $q.defer();
                $http.get(ServiceURL + "rest/User/Current?view=EditorExtended").success(function(data) {
                    authenticatedUser = {
                        id: data.id,
                        jpaId: data.accounts[0].id,
                        email: data.accounts[0].email,
                        username: data.accounts[0].username,
                        firstname: data.accounts[0].firstname,
                        lastname: data.accounts[0].lastname,
                        isTrainer: false,
                        isScenarist: false,
                        isAdmin: false
                    };
                    rights = data.accounts[0].roles;
                    rights.forEach(function(elem) {
                        switch (elem.name) {
                            case "Trainer":
                                authenticatedUser.isTrainer = true;
                                break;
                            case "Scenarist":
                                authenticatedUser.isScenarist = true;
                                break;
                            case "Administrator":
                                authenticatedUser.isAdmin = true;
                                break;
                        }
                    });
                    deferred.resolve(authenticatedUser);
                }).error(function(data) {
                    authenticatedUser = null;
                    deferred.resolve(authenticatedUser);
                });
                return deferred.promise;
            };

        service.getAuthenticatedUser = function() {
            var deferred = $q.defer();
            if (authenticatedUser != null) {
                deferred.resolve(authenticatedUser);
            } else {
                if (loading) {
                    wait().then(function() {
                        deferred.resolve(authenticatedUser);
                    });
                } else {
                    loading = true;
                    getCurrentUser().then(function() {
                        deferred.resolve(authenticatedUser);
                        loading = false;
                    });
                }
            }
            return deferred.promise;
        };

        service.login = function(login, password) {
            var deferred = $q.defer();
            var url = "rest/User/Authenticate";
            $http.post(ServiceURL + url, {
                "@class": "AuthenticationInformation",
                "login": login,
                "password": password,
                "remember": true
            }, {
                "headers": {
                    "managed-mode": "true"
                }
            }).success(function(data) {
                if (data.events !== undefined && data.events.length == 0) {
                    deferred.resolve(Responses.success("You are connected", true));
                    service.getAuthenticatedUser();
                } else if (data.events !== undefined) {
                    deferred.resolve(Responses.danger(data.events[0].exceptions[0].message, false));
                } else {
                    deferred.resolve(Responses.danger("Whoops...", false));
                }
            }).error(function(data) {
                if (data.events !== undefined && data.events.length > 0) {
                    deferred.resolve(Responses.danger(data.events[0].exceptions[0].message, false));
                } else {
                    deferred.resolve(Responses.danger("Whoops...", false));
                }
            });
            return deferred.promise;
        };

        service.logout = function() {
            var deferred = $q.defer();
            var url = "rest/User/Logout";
            $http.get(ServiceURL + url).success(function(data) {
                authenticatedUser = null;
                deferred.resolve(Responses.success("Logout successfully", true));
            }).error(function(data) {
                deferred.resolve(Responses.danger("Error when logout", false));
            });
            return deferred.promise;
        };

        service.signup = function(email, username, password, firstname, lastname) {
            var deferred = $q.defer();
            var url = "rest/User/Signup";
            $http.post(ServiceURL + url, {
                "@class": "JpaAccount",
                "email": email,
                "username": username,
                "password": password,
                "firstname": firstname,
                "lastname": lastname
            }).success(function(data) {
                deferred.resolve(Responses.success("Account created", true));
            }).error(function(data) {
                deferred.resolve(Responses.danger(data.message, false));
            });
            return deferred.promise;
        };

        service.remindPassword = function(email) {
            var obj = {
                "email": email
            };
            var deferred = $q.defer();
            $http.post(ServiceURL + "rest/User/SendNewPassword", obj)
                .success(function(data) {
                    deferred.resolve(Responses.success("A new password has been send", true));
                })
                .error(function(data) {
                    deferred.resolve(Responses.danger("Error during password generation", false));
                });
            return deferred.promise;
        };
    });