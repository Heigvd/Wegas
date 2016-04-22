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

            var url = "rest/Extended/User/" + id + "?view=EditorExtended";
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
                        console.log("WEGAS LOBBY : Error while loading full profil");
                        console.log(data.events);
                    }
                    $translate('COMMONS-USERS-LOAD-FLASH-ERROR').then(function(message) {
                        deferred.resolve(Responses.danger(message, false));
                    });
                }
            }).error(function(data) {
                if (data.events !== undefined) {
                    console.log("WEGAS LOBBY : Error while loading full profil");
                    console.log(data.events);
                }
                $translate('COMMONS-USERS-LOAD-FLASH-ERROR').then(function(message) {
                    deferred.resolve(Responses.danger(message, false));
                });
            });
            return deferred.promise;
        };
        model.updateUser = function(user) {

            var deferred = $q.defer();

            //console.log(user.password !== user.password2);
            if (user.password !== user.password2 && user.password !== null &&
                user.password !== undefined && user.password2 !== null && user.password2 !== undefined) {
                $translate('COMMONS-USERS-UPDATE-PASSWORD-FLASH-ERROR').then(function(message) {
                    deferred.resolve(Responses.danger(message, false));
                });
                return deferred.promise;
            }
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
                .success(function(data) {
                    if (data.events !== undefined && data.events.length === 0) {
                        /*
                        $translate('COMMONS-USERS-UPDATE-FLASH-SUCCESS').then(function(message) {
                            deferred.resolve(Responses.success(message, data.updatedEntities[0]));
                        });
                        */
                        deferred.resolve();
                    } else {
                        if (data.events !== undefined) {
                            console.log("WEGAS LOBBY : Error while updating profile");
                            console.log(data.events);
                        }
                        $translate('COMMONS-USERS-UPDATE-FLASH-ERROR').then(function(message) {
                            deferred.resolve(Responses.danger(message, false));
                        });
                    }
                }).error(function(data) {
                if (data.events !== undefined) {
                    console.log("WEGAS LOBBY : Error while updating profile");
                    console.log(data.events);
                }
                $translate('COMMONS-USERS-UPDATE-FLASH-ERROR').then(function(message) {
                    deferred.resolve(Responses.danger(message, false));
                });
            });
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
