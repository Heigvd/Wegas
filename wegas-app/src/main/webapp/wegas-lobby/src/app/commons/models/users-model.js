angular.module('wegas.models.users', [])
    .service('UsersModel', function($http, $q, $interval, $translate, Auth, Responses) {
        "use strict";
        var model = this,
            ServiceURL = window.ServiceURL,
            users = {
                cache: null,
                findUser: function(id) {
                    return _.find(users.cache.data, function(s) {
                        return +s.id === +id;
                    });
                },

                stopWaiting: function(waitFunction) {
                    $interval.cancel(waitFunction);
                },
                wait: function() {
                    var deferred = $q.defer(),
                        waitUsers = $interval(function() {
                            if (!users.cache.loading) {
                                users.stopWaiting(waitUsers);
                                deferred.resolve(true);
                            }
                        }, 500);
                    return deferred.promise;
                }
            },
            /* Cache all users in a list */
            cacheUsers = function() {
                var deferred = $q.defer();
                if (users.cache) {
                    var url = "rest/Extended/User/?view=Public";
                    $http.get(ServiceURL + url, {
                        "headers": {
                            "managed-mode": "true"
                        }
                    }).success(function(data) {
                        if (data.events !== undefined && data.events.length === 0) {
                            // NB: User has been thought to have multiple account (ways to authenticate)
                            // Actually, there is only one and this explains the below simplification
                            _.each(data.updatedEntities, function(user) {
                                user.account = user.accounts[0];
                            });
                            users.cache.data = data.updatedEntities;
                            deferred.resolve(true);
                        } else {
                            users.cache.data = [];
                            if (data.events !== undefined) {
                                console.log("WEGAS LOBBY : Error while loading users");
                                console.log(data.events);
                            }
                            deferred.resolve(false);
                        }
                    }).error(function(data) {
                        if (data.events !== undefined) {
                            console.log("WEGAS LOBBY : Error while loading users");
                            console.log(data.events);
                        }
                        deferred.resolve(false);
                    });
                } else {
                    users.cache = [];
                    deferred.resolve(users.cache);
                }
                return deferred.promise;
            },

            /* Cache a user, passing a user list and the user to add in parameter */
            cacheUser = function(user) {
                var list = null;
                if (user) {
                    if (users.cache) {
                        list = users.cache.data;
                        if (!_.find(list, user)) {
                            list.push(user);
                        }
                    }
                }
                return list;
            },

            /* Uncache a user, passing a user list and the user to remove in parameter */
            uncacheUser = function(user) {
                var list = null,
                    userToUncache = null;
                if (users.cache) {

                    list = users.cache.data;
                    userToUncache = _.find(list, user);
                    if (userToUncache) {
                        list = _.without(list, user);
                    }
                }
                return list;
            };

        model.clearCache = function() {
            users.cache = null;
        };

        model.getUsers = function() {
            var deferred = $q.defer();
            Auth.getAuthenticatedUser().then(function(user) {
                if (user !== null) {
                    if (users.cache) {
                        if (users.cache.loading) {
                            users.wait().then(function() {
                                $translate('COMMONS-USERS-FIND-FLASH-SUCCESS').then(function(message) {
                                    deferred.resolve(Responses.success(message, users.cache.data));
                                });
                            });
                        } else {
                            $translate('COMMONS-USERS-FIND-FLASH-SUCCESS').then(function(message) {
                                deferred.resolve(Responses.success(message, users.cache.data));
                            });
                        }
                    } else {
                        users.cache = {
                            data: null,
                            loading: true
                        };
                        cacheUsers().then(function() {
                            users.cache.loading = false;
                            $translate('COMMONS-USERS-FIND-FLASH-SUCCESS').then(function(message) {
                                deferred.resolve(Responses.success(message, users.cache.data));
                            });
                        });
                    }
                } else {
                    $translate('COMMONS-AUTH-CURRENT-FLASH-ERROR').then(function(message) {
                        deferred.resolve(Responses.danger(message, false));
                    });
                }
            });
            return deferred.promise;
        };


        model.getUser = function(id) {
            var deferred = $q.defer(),
                user = null;
            if (users.cache) {
                if (users.cache.loading) {
                    users.wait().then(function() {
                        user = users.findUser(id);
                        if (user) {
                            $translate('COMMONS-USERS-GET-FLASH-SUCCESS').then(function(message) {
                                deferred.resolve(Responses.success(message, user));
                            });
                        } else {
                            $translate('COMMONS-USERS-GET-FLASH-ERROR').then(function(message) {
                                deferred.resolve(Responses.danger(message, false));
                            });
                        }
                    });
                } else {
                    user = users.findUser(id);
                    if (user) {
                        $translate('COMMONS-USERS-GET-FLASH-SUCCESS').then(function(message) {
                            deferred.resolve(Responses.success(message, user));
                        });
                    } else {
                        $translate('COMMONS-USERS-GET-FLASH-ERROR').then(function(message) {
                            deferred.resolve(Responses.danger(message, false));
                        });
                    }
                }
            } else {
                model.getUsers().then(function() {
                    user = users.findUser(id);
                    if (user) {
                        $translate('COMMONS-USERS-GET-FLASH-SUCCESS').then(function(message) {
                            deferred.resolve(Responses.success(message, user));
                        });
                    } else {
                        $translate('COMMONS-USERS-GET-FLASH-ERROR').then(function(message) {
                            deferred.resolve(Responses.danger(message, false));
                        });
                    }
                });
            }
            return deferred.promise;
        };

        model.getFullUser = function(id) {
            var deferred = $q.defer();

            if (isNaN(id)) {
                deferred.resolve(false);
                return;
            }

            var url = "rest/Extended/User/" + id + "?view=Editor";
            $http.get(ServiceURL + url, {
                "headers": {
                    "managed-mode": "true"
                }
            }).success(function(data) {
                if (data.events !== undefined && data.events.length === 0) {
                    data.updatedEntities[0].account = data.updatedEntities[0].accounts[0];
                    $translate('COMMONS-USERS-FULL-LOAD-FLASH-SUCCESS').then(function(message) {
                        deferred.resolve(Responses.success(message, data.updatedEntities[0]));
                    });
                } else {
                    if (data.events !== undefined) {
                        console.log("WEGAS LOBBY : Error while loading full profile");
                        console.log(data.events);
                    }
                    $translate('COMMONS-USERS-LOAD-FLASH-ERROR').then(function(message) {
                        deferred.resolve(Responses.danger(message, false));
                    });
                }
            }).error(function(data) {
                if (data.events !== undefined) {
                    console.log("WEGAS LOBBY : Error while loading full profile");
                    console.log(data.events);
                }
                $translate('COMMONS-USERS-LOAD-FLASH-ERROR').then(function(message) {
                    deferred.resolve(Responses.danger(message, false));
                });
            });
            return deferred.promise;
        };
        model.updateUser = function(user, relaxed) {
            relaxed = relaxed || false;
            var deferred = $q.defer(),
                isNonLocal = user['@class'] !== "JpaAccount";

            // Returns true if either (1) username does not look like an e-mail address or (2) username is an e-mail and is identical to the e-mail address field.
            // Returns false otherwise.
            var checkEmailInUsername = function(user) {
                var username = user.username.trim();
                if (username.indexOf('@') != -1) {
                    return (username==user.email.trim());
                } else {
                    return true;
                }
            };


            if (isNonLocal || user.username && user.username.length > 0) {
                if (isNonLocal || user.email && user.email.length > 0) {
                    if (isNonLocal || relaxed || checkEmailInUsername(user)) {
                        if (isNonLocal || !user.password || user.password.length >= 3) {
                            if (isNonLocal || !user.password || user.password === user.password2) {
                                if (isNonLocal || relaxed || user.firstname && user.firstname.length > 0 && user.lastname &&
                                    user.lastname.length > 0) {

                                    delete user.hash;
                                    delete user.name;
                                    delete user.password2;

                                    var url = "rest/Extended/User/Account/" + user.id;
                                    $http
                                        .put(ServiceURL + url, user, {
                                            "headers": {
                                                "managed-mode": "true"
                                            }
                                        })
                                        .success(function (data) {
                                            if (data.events !== undefined && data.events.length === 0) {
                                                /*
                                                 $translate('COMMONS-USERS-UPDATE-FLASH-SUCCESS').then(function(message) {
                                                 deferred.resolve(Responses.success(message, data.updatedEntities[0]));
                                                 });
                                                 */
                                                deferred.resolve();
                                                return;
                                            } else {
                                                if (data.events !== undefined) {
                                                    console.log("WEGAS LOBBY : Error while updating profile");
                                                    console.log(data.events);
                                                }
                                                $translate('COMMONS-USERS-UPDATE-FLASH-ERROR').then(function (message) {
                                                    deferred.resolve(Responses.danger(message, false));
                                                });
                                            }
                                        })
                                        .error(function (data) {
                                            if (data.events !== undefined) {
                                                console.log("WEGAS LOBBY : Error while updating profile");
                                                console.log(data.events);
                                                try {
                                                    deferred.resolve(Responses.danger(data.events[0].exceptions[0].localizedMessage, false));
                                                    return;
                                                } catch(e) {
                                                    // Fall through to generic error message
                                                }
                                            }
                                            $translate('COMMONS-USERS-UPDATE-FLASH-ERROR').then(function (message) {
                                                deferred.resolve(Responses.danger(message, false));
                                            });
                                        });
                                } else {
                                    $translate('CREATE-ACCOUNT-FLASH-WRONG-NAME').then(function (message) {
                                        deferred.resolve(Responses.danger(message, false));
                                    });
                                }
                            } else {
                                $translate('CREATE-ACCOUNT-FLASH-WRONG-PASS2').then(function (message) {
                                    deferred.resolve(Responses.danger(message, false));
                                });
                            }
                        } else {
                            $translate('CREATE-ACCOUNT-FLASH-WRONG-PASS').then(function (message) {
                                deferred.resolve(Responses.danger(message, false));
                            });
                        }
                    } else {
                        $translate('CREATE-ACCOUNT-FLASH-WRONG-EMAIL-IN-USERNAME').then(function (message) {
                            deferred.resolve(Responses.danger(message, false));
                        });
                    }
                } else {
                    $translate('CREATE-ACCOUNT-FLASH-WRONG-EMAIL').then(function (message) {
                        deferred.resolve(Responses.danger(message, false));
                    });
                }
            } else {
                $translate('CREATE-ACCOUNT-FLASH-WRONG-USERNAME').then(function (message) {
                    deferred.resolve(Responses.danger(message, false));
                });
            }
            return deferred.promise;
        };


        model.deleteUser = function(user) {
            var deferred = $q.defer();

            var url = "rest/Extended/User/Account/" + user.account.id;

            $http
                .delete(ServiceURL + url, {
                    "headers": {
                        "managed-mode": "true"
                    }
                })
                .success(function(data) {
                    if (data.events !== undefined && data.events.length === 0) {
                        users.cache.data = uncacheUser(user);

                        $translate('COMMONS-USERS-DELETE-FLASH-SUCCESS').then(function(message) {
                            deferred.resolve(Responses.success(message, data.updatedEntities));
                        });
                    } else {
                        if (data.events !== undefined) {
                            console.log("WEGAS LOBBY : Error while deleting user");
                            console.log(data.events);
                        }
                        $translate('COMMONS-USERS-DELETE-FLASH-ERROR').then(function(message) {
                            deferred.resolve(Responses.danger(message, false));
                        });
                    }
                }).error(function(data) {
                if (data.events !== undefined) {
                    console.log("WEGAS LOBBY : Error while deleting user");
                    console.log(data.events);
                }
                $translate('COMMONS-USERS-DELETE-FLASH-ERROR').then(function(message) {
                    deferred.resolve(Responses.danger(message, false));
                });
            });


            return deferred.promise;
        };
        /* Find user with a pattern in a list of groups (Player, Trainer, Scenarist, Administrator) */
        model.autocomplete = function(pattern, rolesList) {
            var deferred = $q.defer();

            var url = "rest/User/AutoComplete/" + pattern;

            $http
                .post(ServiceURL + url, {
                    "rolesList": rolesList
                })
                .success(function(data) {
                    deferred.resolve(data);
                }).error(function(data) {
                deferred.resolve([]);
            });
            return deferred.promise;
        };
    });
