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
                    var url = "rest/Shadow/User/";
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
                                user.isVerified = user.account.verified;
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

            var url = "rest/Shadow/User/" + id;
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
        model.updateUser = function(currentEmail, oUser, relaxed) {
            // clone object to prevent unwanted UI update
            var user = JSON.parse(JSON.stringify(oUser));

            relaxed = relaxed || false;
            var deferred = $q.defer(),
                isNonLocal = user['@class'] !== "JpaAccount";

            /**
             * Assert the user's username is valid.
             * returns false if the username looks like a e-mail address
             * @param {object} user user.username
             * @returns {Boolean} if the user is valid or not
             */
            var isUsernameValid = function(user) {
                var username = user.username.trim();
                return !username || username.indexOf('@') < 0;
            };


            var postUser = function(user) {
                // clean local admin modifications
                if (user.roles) {
                    for (var i = 0; i < user.roles.length; i++) {
                        // Additional attribute created in user admin code:
                        delete user.roles[i].users;
                    }
                }
                var url = "rest/Extended/User/Account/" + user.id;
                $http.put(ServiceURL + url, user, {
                    "headers": {
                        "managed-mode": "true"
                    }
                }).success(function(data) {
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
                        $translate('COMMONS-USERS-UPDATE-FLASH-ERROR').then(function(message) {
                            deferred.resolve(Responses.danger(message, false));
                        });
                    }
                }).error(function(data) {
                    if (data.events !== undefined) {
                        console.log("WEGAS LOBBY : Error while updating profile");
                        console.log(data.events);
                        try {
                            deferred.resolve(Responses.danger(data.events[0].exceptions[0].localizedMessage, false));
                            return;
                        } catch (e) {
                            // Fall through to generic error message
                        }
                    }
                    $translate('COMMONS-USERS-UPDATE-FLASH-ERROR').then(function(message) {
                        deferred.resolve(Responses.danger(message, false));
                    });
                });
            };

            if (isNonLocal || user.email && user.email.length > 0) {
                if (isNonLocal || relaxed || isUsernameValid(user)) {
                    if (isNonLocal || !user.password || user.password.length >= 3) {
                        if (isNonLocal || !user.password || user.password === user.password2) {
                            if (isNonLocal || relaxed
                                || user.firstname && user.firstname.length > 0
                                && user.lastname && user.lastname.length > 0) {

                                /*
                                 * we need to salt and hash the password before sending it to
                                 * the server. The server must be asked for the hash function
                                 * and the salt to be used.
                                 */
                                $http.get(window.ServiceURL + "rest/User/AuthMethod/" + currentEmail)
                                    .success(function(data) {
                                        var jpaAuths = data.filter(function(method) {
                                            return method["@class"] === "JpaAuthentication";
                                        });
                                        if (jpaAuths.length) {
                                            // using JPA authentication requires to hash the new password
                                            var salt = jpaAuths[0].salt || "";
                                            // salt and hash the password
                                            Auth.digest(jpaAuths[0].mandatoryMethod, salt + user.password)
                                                .then(function(digestedPassword) {
                                                    delete user.hash;
                                                    delete user.name;
                                                    delete user.password2;

                                                    // hack: empty password means do not update the password
                                                    if (user.password) {
                                                        user.password = digestedPassword;
                                                    } else {
                                                        user.password = "";
                                                    }

                                                    postUser(user);
                                                });
                                        } else {
                                            var aaiAuths = data.filter(function(method) {
                                                return method["@class"] === "AaiAuthentication";
                                            });
                                            if (aaiAuths.length) {
                                                delete user.hash;
                                                delete user.name;
                                                delete user.password2;
                                                delete user.password;

                                                postUser(user);
                                            } else {
                                                $translate('COMMONS-AUTH-LOGIN-FLASH-ERROR-CLIENT').then(function(message) {
                                                    deferred.resolve(Responses.danger(message, false));
                                                });
                                            }
                                        }
                                    }).error(function(data) {
                                    // no auth method
                                    $translate('COMMONS-AUTH-LOGIN-FLASH-ERROR-SERVER').then(function(message) {
                                        deferred.resolve(Responses.danger(message, false));
                                    });
                                });


                            } else {
                                $translate('CREATE-ACCOUNT-FLASH-WRONG-NAME').then(function(message) {
                                    deferred.resolve(Responses.danger(message, false));
                                });
                            }
                        } else {
                            $translate('CREATE-ACCOUNT-FLASH-WRONG-PASS2').then(function(message) {
                                deferred.resolve(Responses.danger(message, false));
                            });
                        }
                    } else {
                        $translate('CREATE-ACCOUNT-FLASH-WRONG-PASS').then(function(message) {
                            deferred.resolve(Responses.danger(message, false));
                        });
                    }
                } else {
                    $translate('CREATE-ACCOUNT-FLASH-WRONG-EMAIL-IN-USERNAME').then(function(message) {
                        deferred.resolve(Responses.danger(message, false));
                    });
                }
            } else {
                $translate('CREATE-ACCOUNT-FLASH-WRONG-EMAIL').then(function(message) {
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
