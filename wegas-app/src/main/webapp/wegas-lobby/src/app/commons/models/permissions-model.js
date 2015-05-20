angular.module('wegas.models.permissions', [])
    .service('PermissionsModel', function($http, $q, $interval, Auth, Responses) {
        var model = this;
        model.getSessionPermissions = function(session) {
            var deferred = $q.defer();
            $http.get(ServiceURL + "rest/Extended/User/FindAccountPermissionByInstance/g" + session.id).success(function(data) {
                permissionsToReturn = [];
                _(data).each(function(account, i) {
                    var permissions = [],
                        pattern = new RegExp("^Game:(.*):g" + session.id + "$");

                    // For each permission of each account...
                    _(account.permissions).each(function(permission, j) {
                        // Is permission linked with current game ?
                        if (pattern.test(permission.value)) {
                            var localPermission = permission.value.match(pattern)[1].split(",");
                            permissions = permissions.merge(localPermission)
                        }
                    });
                    if (permissions.indexOf("View") >= 0 && permissions.indexOf("Edit") >= 0) {
                        permissionsToReturn.push(account);
                    }
                });
                deferred.resolve(permissionsToReturn);
            }).error(function(data) {
                deferred.resolve(false);
            });
            return deferred.promise;
        };

        /* Add a new trainer to the session */
        model.addSessionPermission = function(session, trainers, trainer) {
            var deferred = $q.defer();
            if (session) {
                var alreadyIn = false;
                trainers.forEach(function(elem) {
                    if (elem.id == trainer.id) {
                        alreadyIn = true;
                    }
                });
                if (!alreadyIn) {
                    $http.post(ServiceURL + "rest/Extended/User/addAccountPermission/Game:View,Edit:g" + session.id + "/" + trainer.id).success(function(data) {
                        deferred.resolve(Responses.success("Trainer added", trainer));
                    }).error(function(data) {
                        deferred.resolve(Responses.danger("Error for adding trainer", false));
                    });
                } else {
                    deferred.resolve(Responses.info("This user is already a trainer for this session", false));
                }
            } else {
                deferred.resolve(Responses.danger("No access to this session", false));
            }
            return deferred.promise;
        };

        /* Remove a trainer from a session in cached sessions et persistant datas */
        model.removeSessionPermission = function(session, trainers, trainerId) {
            var deferred = $q.defer();
            if (session) {
                trainer = _.find(trainers, function(t) {
                    return t.id == trainerId;
                });
                if (trainer) {
                    $http.delete(ServiceURL + "rest/Extended/User/DeleteAccountPermissionByInstanceAndAccount/g" + session.id + "/" + trainer.id).success(function(data) {
                        deferred.resolve(Responses.success("Trainer removed", trainer));
                    }).error(function(data) {
                        deferred.resolve(Responses.danger("You can not remove this trainer", data));
                    });
                }else{
                	deferred.resolve(Response.danger("Trainer permission not found", false));
                }
            } else {
                deferred.resolve(Response.danger("No access to this session", false));
            }
            return deferred.promise;
        };


        model.getScenarioPermissions = function(scenarioId) {
            var deferred = $q.defer(),
            	url = "rest/Extended/User/FindAccountPermissionByInstance/gm" + scenarioId;
            function mapPermissions(data) {
                /* Transform permissions in a comprehensible way :) */
                var permissions = [];

                var gameRegex = new RegExp(":gm" + scenarioId + "$");
                var itemsRegex = new RegExp(":(.*):");

                /* For each user */
                _.each(data, function(user) {

                    /* Search for permissions linked with current scenario */
                    var userPermissions = [];
                    _.each(user.permissions, function(element, index, list) {
                        if (gameRegex.test(element.value)) {
                            var items = itemsRegex.exec(element.value);
                            userPermissions = userPermissions.concat(items[1].split(","));
                        }
                    });

                    userPermissions = _.uniq(userPermissions); /* Remove duplicates */

                    permissions.push({
                        user: user,
                        permissions: userPermissions
                    });

                });
                return permissions;
            };           
            $http.get(ServiceURL + url, {
                "headers": {
                    "managed-mode": "true"
                }
            }).success(function(data) {
                if (data.events !== undefined && data.events.length == 0) {
                    var permissions = mapPermissions(data.entities);
                    deferred.resolve(Responses.success("Permissions loaded", permissions));
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


        model.updateScenarioPermissions = function(scenarioId, userId, canCreate, canDuplicate, canEdit) {
            var deferred = $q.defer();
            // Removing all permission
            model.deleteScenarioPermissions(scenarioId, userId).then(function(response) {
                // Remove works ?
                if (response.isErroneous()) {
                    deferred.resolve(response);
                } else {
                    // Calculating new permission as wegas see them
                    var permissions = "";
                    if (canEdit) {
                        permissions = "View,Edit,Delete,Duplicate,Instantiate";
                    } else {
                        if (canCreate && canDuplicate) {
                            permissions = "Instantiate,Duplicate";
                        } else if (canCreate) {
                            permissions = "Instantiate";
                        } else if (canDuplicate) {
                            permissions = "Duplicate";
                        } else {
                            // No permissions means ok.
                            deferred.resolve(Responses.success("Permissions updated.", true));
                        }
                    }

                    var url = "rest/Extended/User/addAccountPermission/" +
                        "GameModel:" + permissions + ":gm" + scenarioId + "/" + userId;
                    // Updating permissions
                    $http
                        .post(ServiceURL + url, null, {
                            "headers": {
                                "managed-mode": "true"
                            }
                        })
                        .success(function(data) {
                            if (data.events !== undefined && data.events.length == 0) {
                                deferred.resolve(Responses.success("Permissions updated.", true));
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
                }
            });
            return deferred.promise;
        };

        model.deleteScenarioPermissions = function(scenarioId, userId) {
            var deferred = $q.defer(),
            	url = "rest/Extended/User/DeleteAccountPermissionByInstanceAndAccount/gm" + scenarioId + "/" + userId;

            $http
                .delete(ServiceURL + url, {
                    "headers": {
                        "managed-mode": "true"
                    }
                })
                .success(function(data) {
                    if (data.events !== undefined && data.events.length == 0) {
                        deferred.resolve(Responses.success("Permissions deleted.", true));
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
    });