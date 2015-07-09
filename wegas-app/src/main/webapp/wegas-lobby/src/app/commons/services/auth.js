angular.module('wegas.service.auth', [
    'wegas.models.sessions'
])
    .service('Auth', function($http, $q, $interval, $translate, Responses) {
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
            var deferred = $q.defer(),
                url = "rest/User/Authenticate";
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
                    $translate('COMMONS-AUTH-LOGIN-FLASH-SUCCESS').then(function (message) {
                        deferred.resolve(Responses.success(message, true));
                    });
                    service.getAuthenticatedUser();
                } else if (data.events !== undefined) {
                    console.log(data.events[0].exceptions[0].message);
                    $translate('COMMONS-AUTH-LOGIN-FLASH-ERROR-CLIENT').then(function (message) {
                        deferred.resolve(Responses.danger(message, false));
                    });
                } else {
                    $translate('COMMONS-AUTH-LOGIN-FLASH-ERROR-SERVER').then(function (message) {
                        deferred.resolve(Responses.danger(message, false));
                    });
                }
            }).error(function(data) {
                if (data.events !== undefined && data.events.length > 0) {
                    console.log(data.events[0].exceptions[0].message);
                    $translate('COMMONS-AUTH-LOGIN-FLASH-ERROR-CLIENT').then(function (message) {
                        deferred.resolve(Responses.danger(message, false));
                    });
                } else {
                    $translate('COMMONS-AUTH-LOGIN-FLASH-ERROR-SERVER').then(function (message) {
                        deferred.resolve(Responses.danger(message, false));
                    });
                }
            });
            return deferred.promise;
        };

        service.logout = function() {
            var deferred = $q.defer(),
                url = "rest/User/Logout";
            $http.get(ServiceURL + url).success(function(data) {
                authenticatedUser = null;
                $translate('COMMONS-AUTH-LOGOUT-FLASH-SUCCESS').then(function (message) {
                    deferred.resolve(Responses.success(message, true));
                });
            }).error(function(data) {
                $translate('COMMONS-AUTH-LOGOUT-FLASH-ERROR').then(function (message) {
                    deferred.resolve(Responses.danger(message, false));
                });
            });
            return deferred.promise;
        };

        service.signup = function(email, username, password, firstname, lastname) {
            var deferred = $q.defer(),
                url = "rest/User/Signup";
            $http.post(ServiceURL + url, {
                "@class": "JpaAccount",
                "email": email,
                "username": username,
                "password": password,
                "firstname": firstname,
                "lastname": lastname
            }).success(function(data) {
                $translate('COMMONS-AUTH-CREATE-ACCOUNT-FLASH-SUCCESS').then(function (message) {
                    deferred.resolve(Responses.success(message, true));
                });
            }).error(function(data) {
                $translate('COMMONS-AUTH-CREATE-ACCOUNT-FLASH-ERROR').then(function (message) {
                    deferred.resolve(Responses.danger(message, true));
                });
                deferred.resolve(Responses.danger(data.message, false));
            });
            return deferred.promise;
        };

        service.remindPassword = function(email) {
            var deferred = $q.defer(),
                url = "rest/User/SendNewPassword";
            $http.post(ServiceURL + url, {
                "@class": "AuthenticationInformation",
                "login": email
            }, {
                "headers": {
                    "managed-mode": "true"
                }
            })
                .success(function(data) {
                    $translate('COMMONS-AUTH-PASSWORD-FLASH-SUCCESS').then(function (message) {
                        deferred.resolve(Responses.success(message, true));
                    });
                })
                .error(function(data) {
                    $translate('COMMONS-AUTH-PASSWORD-FLASH-ERROR').then(function (message) {
                        deferred.resolve(Responses.danger(message, false));
                    });
                });
            return deferred.promise;
        };

        service.loginAsGuest = function() {
            var deferred = $q.defer(),
                url = "rest/User/GuestLogin/",
                messageARendre;
            service.getAuthenticatedUser().then(function(noUser) {
                if (noUser == null) {
                    $http.post(ServiceURL + url, {
                        "@class": "AuthenticationInformation",
                        "login": "",
                        "password": "",
                        "remember": true
                    }, {
                        "headers": {
                            "managed-mode": "true"
                        }
                    })
                        .success(function(data) {
                            service.getAuthenticatedUser().then(function(guest){
                                $translate('COMMONS-AUTH-GUEST-FLASH-SUCCESS').then(function (message) {
                                    deferred.resolve(Responses.success(message, guest));
                                });
                            });
                        })
                        .error(function(data) {
                            $translate('COMMONS-AUTH-GUEST-FLASH-ERROR').then(function (message) {
                                deferred.resolve(Responses.danger(message, false));
                            });
                        });
                }else{
                    $translate('COMMONS-AUTH-GUEST-FLASH-ERROR').then(function (message) {
                        deferred.resolve(Responses.danger(message, false));
                    });
                }
            });
            return deferred.promise;
        };
    });