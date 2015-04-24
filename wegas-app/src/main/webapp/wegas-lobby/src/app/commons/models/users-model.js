'use strict';
angular.module('wegas.models.users', [])
    .service('UsersModel', function(Auth, $http, $q, $interval, Responses) {
        var model = this,
            users = {
                cache: null,
                findUser: function(id) {
                    return _.find(users.cache.data, function(s) {
                        return s.id == id;
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
                                deferred.resolve(true)
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
                        if (data.events !== undefined && data.events.length == 0) {
                            // NB: User has been thought to have multiple account (ways to authenticate)
                            // Actually, there is only one and this explains the below simplification
                            _.each(data.entities, function(user) {
                                user.account = user.accounts[0];
                            });
                            users.cache.data = data.entities;
                            deferred.resolve(Responses.success("Scenarios loaded", users.cache));
                        } else if (data.events !== undefined) {
                            users.cache.data = [];
                            deferred.resolve(Responses.danger(data.events[0].exceptions[0].message, false));
                        } else {
                            users.cache.data = [];
                            deferred.resolve(Responses.danger("Whoops...", false));
                        }
                    }).error(function(data) {
                        var test = [{"@class":"User","id":1039001,"account":{"@class":"JpaAccount","id":1039002,"username":"","firstname":null,"lastname":null,"email":"player@mail.com","password":null,"hash":"17d97fd09f54da2f4175eaaf14ae4f95","name":""},"name":""}];
                        users.cache.data = test;
                        deferred.resolve(Responses.success("Scenarios loaded", users.cache));
                        return;
                        if (data.events !== undefined && data.events.length > 0) {
                            deferred.resolve(Responses.danger(data.events[0].exceptions[0].message, false));
                        } else {
                            deferred.resolve(Responses.danger("Whoops...", false));
                        }
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

        model.getUsers = function() {
            var deferred = $q.defer();
            Auth.getAuthenticatedUser().then(function(user) {
                if (user != null) {
                    if (users.cache) {
                        if (users.cache.loading) {
                            users.wait().then(function() {
                                deferred.resolve(Responses.success("Users found", users.cache.data));
                            });
                        } else {
                            deferred.resolve(Responses.success("Users found", users.cache.data));
                        }
                    } else {
                        users.cache = {
                            data: null,
                            loading: true
                        };
                        cacheUsers().then(function(response) {
                            users.cache.loading = false;
                            deferred.resolve(Responses.info(response.message, users.cache.data));
                        });
                    }
                } else {
                    deferred.resolve(Responses.danger("You need to be logged", false));
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
                            deferred.resolve(Responses.success("User find", user));
                        } else {
                            deferred.resolve(Responses.danger("No user find", false));
                        }
                    });
                } else {
                    user = users.findUser(id);
                    if (user) {
                        deferred.resolve(Responses.success("User find", user));
                    } else {
                        deferred.resolve(Responses.danger("No user find", false));
                    }
                }
            } else {
                model.getUsers().then(function() {
                    user = users.findUser(id);
                    if (user) {
                        deferred.resolve(Responses.success("User find", user));
                    } else {
                        deferred.resolve(Responses.danger("No user find", false));
                    }
                });
            }
            return deferred.promise;
        }

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
                if (data.events !== undefined && data.events.length == 0) {

                    data.entities[0].account = data.entities[0].accounts[0];
                    deferred.resolve(Responses.success("Full Profile loaded", data.entities[0]));
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
        }
        model.updateUser = function(user) {

            var deferred = $q.defer();

            if (user.password != user.password2) {
                deferred.resolve(Responses.danger("Passwords do not match...", false));
                return deferred.promise;
            }
            delete user.hash
            delete user.name
            delete user.password2

            var url = "rest/Extended/User/Account/" + user.id;
            $http
                .put(ServiceURL + url, user, {
                    "headers": {
                        "managed-mode": "true"
                    }
                })
                .success(function(data) {
                    if (data.events !== undefined && data.events.length == 0) {
                        deferred.resolve(Responses.success("Profile updated", data.entities[0]));
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
                    if (data.events !== undefined && data.events.length == 0) {

                        users.cache.data = uncacheUser(user);
                        deferred.resolve(Responses.success("User deleted", data.entities));
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
        }
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
        }
    });