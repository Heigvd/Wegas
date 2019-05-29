angular.module('wegas.models.groups', [])
    .service('GroupsModel', function($http, $q, $interval, $translate, Auth, Responses) {
        "use strict";
        var model = this,
            groups = null,
            loadingGroups = false,
            ServiceURL = window.ServiceURL,
            /* Cache a group, passing the group to add in parameter */
            cacheGroup = function(group) {
                if (group && groups) {
                    if (!_.find(groups, group)) {
                        groups.push(group);
                    }
                }
                return groups;
            },
            /* Uncache a group, passing a group to remove in parameter */
            uncacheGroup = function(group) {
                var groupToUncache;
                if (groups && group) {
                    groupToUncache = _.find(groups, function(g) {
                        return +g.id === +group.id;
                    });
                    if (groupToUncache) {
                        groups = _.without(groups, groupToUncache);
                    }
                }
                return groups;
            },
            /* Cache all groups in a list */
            cacheGroups = function() {
                var deferred = $q.defer(),
                    url = "rest/Role";

                $http.get(ServiceURL + url, {
                    "headers": {
                        "managed-mode": "true"
                    }
                }).success(function(data) {
                    if (data.events !== undefined && data.events.length === 0) {
                        groups = data.updatedEntities;
                        deferred.resolve(true);
                    } else {
                        if (data.events !== undefined) {
                            console.log("WEGAS LOBBY : Error while loading groups");
                            console.log(data.events);
                        }
                        deferred.resolve(false);
                    }
                }).error(function(data) {
                    if (data.events !== undefined) {
                        console.log("WEGAS LOBBY : Error while loading groups");
                        console.log(data.events);
                    }
                    deferred.resolve(false);
                });
                return deferred.promise;
            },
            findGroup = function(id) {
                return _.find(groups, function(g) {
                    return +g.id === +id;
                });
            },
            stopWaiting = function(waitFunction) {
                $interval.cancel(waitFunction);
            },
            wait = function() {
                var deferred = $q.defer(),
                    waitGroups = $interval(function() {
                        if (!loadingGroups) {
                            stopWaiting(waitGroups);
                            deferred.resolve(true);
                        }
                    }, 500);
                return deferred.promise;
            };

        model.clearCache = function() {
            groups = null;
        };

        model.getGroups = function() {
            var deferred = $q.defer();
            Auth.getAuthenticatedUser().then(function(user) {
                if (user !== null) {
                    if (user.isAdmin) {
                        if (groups !== null) {
                            $translate('COMMONS-GROUPS-FIND-FLASH-SUCCESS').then(function(message) {
                                deferred.resolve(Responses.success(message, groups));
                            });
                        } else {
                            if (loadingGroups) {
                                wait().then(function() {
                                    $translate('COMMONS-GROUPS-FIND-FLASH-SUCCESS').then(function(message) {
                                        deferred.resolve(Responses.success(message, groups));
                                    });
                                });
                            } else {
                                loadingGroups = true;
                                cacheGroups().then(function() {
                                    loadingGroups = false;
                                    $translate('COMMONS-GROUPS-FIND-FLASH-SUCCESS').then(function(message) {
                                        deferred.resolve(Responses.success(message, groups));
                                    });
                                });
                            }
                        }
                    } else {
                        $translate('COMMONS-AUTH-IS-ADMIN-FLASH-ERROR').then(function(message) {
                            deferred.resolve(Responses.danger(message, false));
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

        /* Ask for one managed session. */
        model.getGroup = function(id) {
            var deferred = $q.defer(),
                group;
            if (groups === null) {
                if (loadingGroups) {
                    wait().then(function() {
                        group = findGroup(id);
                        if (group) {
                            $translate('COMMONS-GROUPS-GET-FLASH-SUCCESS').then(function(message) {
                                deferred.resolve(Responses.success(message, group));
                            });
                        } else {
                            $translate('COMMONS-GROUPS-GET-FLASH-ERROR').then(function(message) {
                                deferred.resolve(Responses.danger(message, false));
                            });
                        }
                    });
                } else {
                    model.getGroups().then(function() {
                        group = findGroup(id);
                        if (group) {
                            $translate('COMMONS-GROUPS-GET-FLASH-SUCCESS').then(function(message) {
                                deferred.resolve(Responses.success(message, group));
                            });
                        } else {
                            $translate('COMMONS-GROUPS-GET-FLASH-ERROR').then(function(message) {
                                deferred.resolve(Responses.danger(message, false));
                            });
                        }
                    });
                }
            } else {
                group = findGroup(id);
                if (group) {
                    $translate('COMMONS-GROUPS-GET-FLASH-SUCCESS').then(function(message) {
                        deferred.resolve(Responses.success(message, group));
                    });
                } else {
                    $translate('COMMONS-GROUPS-GET-FLASH-ERROR').then(function(message) {
                        deferred.resolve(Responses.danger(message, false));
                    });
                }
            }
            return deferred.promise;
        };

        model.addGroup = function(name) {
            var deferred = $q.defer(),
                groupToAdd = {
                    "id": "",
                    "@class": "Role",
                    "name": name,
                    "permissions": []
                };
            if (name !== null && name !== undefined && name !== "") {
                $http.post(ServiceURL + "rest/Role", groupToAdd, {
                    "headers": {
                        "managed-mode": "true"
                    }
                }).success(function(data) {
                    if (data.events !== undefined && data.events.length === 0) {
                        var newGroup = data.updatedEntities[0];
                        cacheGroup(newGroup);
                        $translate('COMMONS-GROUPS-CREATE-FLASH-SUCCESS').then(function(message) {
                            deferred.resolve(Responses.success(message, newGroup));
                        });
                    } else {
                        if (data.events !== undefined) {
                            console.log("WEGAS LOBBY : Error while creating group");
                            console.log(data.events);
                        }
                        $translate('COMMONS-GROUPS-CREATE-FLASH-ERROR').then(function(message) {
                            deferred.resolve(Responses.danger(message, false));
                        });
                    }
                }).error(function(data) {
                    if (data.events !== undefined) {
                        console.log("WEGAS LOBBY : Error while creating group");
                        console.log(data.events);
                    }
                    $translate('COMMONS-GROUPS-CREATE-FLASH-ERROR').then(function(message) {
                        deferred.resolve(Responses.danger(message, false));
                    });
                });
            } else {
                $translate('COMMONS-GROUPS-CREATE-EMPTY-NAME-FLASH-ERROR').then(function(message) {
                    deferred.resolve(Responses.danger(message, false));
                });
            }
            return deferred.promise;
        };

        model.updateGroup = function(group) {
            var deferred = $q.defer();
            var url = "rest/Role/" + group.id;
            $http.put(ServiceURL + url, group, {
                "headers": {
                    "managed-mode": "true"
                }
            }).success(function(data) {
                if (data.events !== undefined && data.events.length === 0) {
                    groups = uncacheGroup(group);
                    groups = cacheGroup(group);
                    $translate('COMMONS-GROUPS-UPDATE-FLASH-SUCCESS').then(function(message) {
                        deferred.resolve(Responses.success(message, data.updatedEntities));
                    });
                } else {
                    if (data.events !== undefined) {
                        console.log("WEGAS LOBBY : Error while updating group");
                        console.log(data.events);
                    }
                    $translate('COMMONS-GROUPS-UPDATE-FLASH-ERROR').then(function(message) {
                        deferred.resolve(Responses.danger(message, false));
                    });
                }
            }).error(function(data) {
                if (data.events !== undefined) {
                    console.log("WEGAS LOBBY : Error while updating group");
                    console.log(data.events);
                }
                $translate('COMMONS-GROUPS-UPDATE-FLASH-ERROR').then(function(message) {
                    deferred.resolve(Responses.danger(message, false));
                });
            });
            return deferred.promise;
        };

        model.deleteGroup = function(group) {
            var deferred = $q.defer(),
                url = "rest/Role/" + group.id;
            $http.delete(ServiceURL + url, {
                "headers": {
                    "managed-mode": "true"
                }
            }).success(function(data) {
                if (data.events !== undefined && data.events.length === 0) {
                    groups = uncacheGroup(group);
                    $translate('COMMONS-GROUPS-DELETE-FLASH-SUCCESS').then(function(message) {
                        deferred.resolve(Responses.success(message, data.updatedEntities));
                    });
                } else {
                    if (data.events !== undefined) {
                        console.log("WEGAS LOBBY : Error while deleting group");
                        console.log(data.events);
                    }
                    $translate('COMMONS-GROUPS-DELETE-FLASH-ERROR').then(function(message) {
                        deferred.resolve(Responses.danger(message, false));
                    });
                }
            }).error(function(data) {
                if (data.events !== undefined) {
                    console.log("WEGAS LOBBY : Error while deleting group");
                    console.log(data.events);
                }
                $translate('COMMONS-GROUPS-DELETE-FLASH-ERROR').then(function(message) {
                    deferred.resolve(Responses.danger(message, false));
                });
            });
            return deferred.promise;
        };
        model.getMembers = function(groupId) {
            var deferred = $q.defer(),
                url = "rest/User/FindUsersWithRole/" + groupId;
            $http.get(ServiceURL + url, {})
                .success(function(data) {
                    if (data !== undefined && data.length !== 0) {
                        _.each(data, function (user) {
                            // NB: User has been thought to have multiple accounts (ways to authenticate)
                            // Actually, there is only one and this explains the below simplification
                            user.account = user.accounts[0];
                            user.isVerified = user.account.verified;
                        });
                    }
                    deferred.resolve(data);
                });
            return deferred.promise;
        };

    });
