angular.module('wegas.models.scenarios', [])
    .service('PermissionModel', function($http, $q, $interval, Auth, Responses) {
        var model = this;

        model.getPermissionsFor = function(scenarioId) {
            // Todo
        }

        model.updatePermissions = function(scenarioId, userId, canCreate, canDuplicate, canEdit) {

            var deferred = $q.defer();
            // Removing all permission
            this.deletePermissions(scenarioId, userId).then(function(response) {
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
        }

        model.deletePermissions = function(scenarioId, userId) {
            var deferred = $q.defer();

            var url = "rest/Extended/User/DeleteAccountPermissionByInstanceAndAccount/gm" + scenarioId + "/" + userId;

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
        }
    })
    .service('ScenariosModel', function($http, $q, $interval, Auth, PermissionModel, Responses) {
        var model = this,
            getPath = function(status) {
                return ServiceURL + "rest/GameModel/status/" + status + "?view=EditorExtended";
            },
            scenarios = {
                cache: [],
                findScenario: function(status, id) {
                    return _.find(scenarios.cache[status].data, function(s) {
                        return s.id == id;
                    });
                },
                stopWaiting: function(waitFunction) {
                    $interval.cancel(waitFunction);
                },
                wait: function(status) {
                    var deferred = $q.defer(),
                        waitScenarios = $interval(function() {
                            if (!scenarios.cache[status].loading) {
                                scenarios.stopWaiting(waitScenarios);
                                deferred.resolve(true)
                            }
                        }, 500);
                    return deferred.promise;
                }
            },
            /* Cache all scenarios in a list */
            cacheScenarios = function(status) {
                var deferred = $q.defer();
                if (scenarios.cache[status]) {
                    $http.get(getPath(status), {
                        "headers": {
                            "managed-mode": "true"
                        }
                    }).success(function(data) {
                        if (data.events !== undefined && data.events.length == 0) {
                            scenarios.cache[status].data = data.entities;
                            deferred.resolve(Responses.success("Scenarios loaded", scenarios.cache[status]));
                        } else if (data.events !== undefined) {
                            scenarios.cache[status].data = [];
                            deferred.resolve(Responses.danger(data.events[0].exceptions[0].message, false));
                        } else {
                            scenarios.cache[status].data = [];
                            deferred.resolve(Responses.danger("Whoops...", false));
                        }
                    }).error(function(data) {
                        scenarios.cache[status].data = [];
                        if (data.events !== undefined && data.events.length > 0) {
                            deferred.resolve(Responses.danger(data.events[0].exceptions[0].message, false));
                        } else {
                            deferred.resolve(Responses.danger("Whoops...", false));
                        }
                    });
                } else {
                    scenarios.cache[status] = [];
                    deferred.resolve(scenarios.cache[status]);
                }
                return deferred.promise;
            },

            /* Cache a scenario, passing a scenario list and the scenario to add in parameter */
            cacheScenario = function(status, scenario) {
                var list = null;
                if (status && scenario) {
                    if (scenarios.cache[status]) {
                        list = scenarios.cache[status].data;
                        if (!_.find(list, scenario)) {
                            list.push(scenario);
                        }
                    }
                }
                return list;
            },

            /* Uncache a scenario, passing a scenario list and the scenario to remove in parameter */
            uncacheScenario = function(status, scenario) {
                var list = null,
                    scenarioToUncache = null;
                if (scenarios.cache[status]) {

                    list = scenarios.cache[status].data;
                    scenarioToUncache = _.find(list, scenario);
                    if (scenarioToUncache) {
                        list = _.without(list, scenario);
                    }
                }
                return list;
            },
            /* Update status of scenario (LIVE, BIN, DELETE, SUPPRESSED) */
            setScenarioStatus = function(scenarioId, status) {
                var deferred = $q.defer();

                $http.put(ServiceURL + "rest/GameModel/" + scenarioId + "/status/" + status + "?view=EditorExtended").success(function(data) {
                    for (var cacheName in scenarios.cache) {
                        scenario = scenarios.findScenario(cacheName, scenarioId);
                        if (scenario) {
                            scenarios.cache[cacheName].data = uncacheScenario(cacheName, scenario);
                        }
                        if (status == cacheName) {
                            scenarios.cache[cacheName].data = cacheScenario(cacheName, data);
                        }
                    }
                    deferred.resolve(data);
                }).error(function(data) {
                    deferred.resolve(false);
                });
                return deferred.promise;
            };
        setScenarioInfos = function(infos, scenarioBeforeChange) {
            var deferred = $q.defer(),
                scenarioSetted = false;
            if (scenarioBeforeChange.name !== infos.name) {
                scenarioBeforeChange.name = infos.name;
                scenarioSetted = true;
            }
            if (scenarioBeforeChange.properties.iconUri !== ("ICON_" + infos.color + "_" + infos.icon)) {
                scenarioBeforeChange.properties.iconUri = "ICON_" + infos.color + "_" + infos.icon;
                scenarioSetted = true;
            }
            if (scenarioBeforeChange.properties.freeForAll !== infos.individual) {
                scenarioBeforeChange.properties.freeForAll = infos.individual;
                scenarioSetted = true;
            }
            if (scenarioBeforeChange.comments !== infos.comments) {
                scenarioBeforeChange.comments = infos.comments;
                scenarioSetted = true;
            }
            if (scenarioBeforeChange.properties.scriptUri !== infos.scriptUri) {
                scenarioBeforeChange.properties.scriptUri = infos.scriptUri;
                scenarioSetted = true;
            }
            if (scenarioBeforeChange.properties.clientScriptUri !== infos.clientScriptUri) {
                scenarioBeforeChange.properties.clientScriptUri = infos.clientScriptUri;
                scenarioSetted = true;
            }
            if (scenarioBeforeChange.properties.cssUri !== infos.cssUri) {
                scenarioBeforeChange.properties.cssUri = infos.cssUri;
                scenarioSetted = true;
            }
            if (scenarioBeforeChange.properties.pagesUri !== infos.pagesUri) {
                scenarioBeforeChange.properties.pagesUri = infos.pagesUri;
                scenarioSetted = true;
            }


            if (scenarioSetted) {
                var url = "rest/Public/GameModel/" + scenarioBeforeChange.id + "?view=EditorExtended";
                $http.put(ServiceURL + url, scenarioBeforeChange, {
                    "headers": {
                        "managed-mode": "true"
                    }
                }).success(function(data) {
                    if (data.events !== undefined && data.events.length == 0) {
                        var scenario = data.entities[0];
                        deferred.resolve(Responses.success("Scenario updated", scenario));
                    } else if (data.events !== undefined) {
                        deferred.resolve(Responses.danger(data.events[0].exceptions[0].message, false));
                    } else {
                        deferred.resolve(Responses.danger("Error during gameModel update", false));
                    }
                }).error(function(data) {
                    if (data.events !== undefined && data.events.length > 0) {
                        deferred.resolve(Responses.danger(data.events[0].exceptions[0].message, false));
                    } else {
                        deferred.resolve(Responses.danger("Error during gameModel update", false));
                    }
                });
            } else {
                deferred.resolve(Responses.success("Nothing to update in scenario", scenarioBeforeChange));
            }
            return deferred.promise;
        };

        /* Ask for all scenarios in a list */
        model.getScenarios = function(status) {
            var deferred = $q.defer();
            Auth.getAuthenticatedUser().then(function(user) {
                if (user != null) {
                    if (scenarios.cache[status]) {
                        if (scenarios.cache[status].loading) {
                            scenarios.wait(status).then(function() {
                                deferred.resolve(Responses.success("Scenarios find", scenarios.cache[status].data));
                            });
                        } else {
                            deferred.resolve(Responses.success("Scenarios find", scenarios.cache[status].data));
                        }
                    } else {
                        scenarios.cache[status] = {
                            data: null,
                            loading: true
                        };
                        cacheScenarios(status).then(function(response) {
                            scenarios.cache[status].loading = false;
                            deferred.resolve(Responses.info(response.message, scenarios.cache[status].data));
                        });
                    }
                } else {
                    deferred.resolve(Responses.danger("You need to be logged", false));
                }
            });
            return deferred.promise;
        };

        /* Ask for one scenario. */
        model.getScenario = function(status, id) {
            var deferred = $q.defer(),
                scenario = null;
            if (scenarios.cache[status]) {
                if (scenarios.cache[status].loading) {
                    scenarios.wait(status).then(function() {
                        scenario = scenarios.findScenario(status, id);
                        if (scenario) {
                            deferred.resolve(Responses.success("Scenarios find", scenario));
                        } else {
                            deferred.resolve(Responses.danger("No scenario find", false));
                        }
                    });
                } else {
                    scenario = scenarios.findScenario(status, id);
                    if (scenario) {
                        deferred.resolve(Responses.success("Scenarios find", scenario));
                    } else {
                        deferred.resolve(Responses.danger("No scenario find", false));
                    }
                }
            } else {
                model.getScenarios(status).then(function() {
                    scenario = scenarios.findScenario(status, id);
                    if (scenario) {
                        deferred.resolve(Responses.success("Scenarios find", scenario));
                    } else {
                        deferred.resolve(Responses.danger("No scenario find", false));
                    }
                });
            }
            return deferred.promise;
        };

        model.createScenario = function(name, templateId) {
            var deferred = $q.defer(),
                url = "rest/Public/GameModel/" + templateId;
            if (name && templateId) {
                if (name !== "") {
                    if (templateId !== 0) {
                        $http.post(ServiceURL + url, {
                            "@class": "GameModel",
                            "name": name,
                            "properties": {}
                        }, {
                            "headers": {
                                "managed-mode": "true"
                            }
                        }).success(function(data) {
                            if (data.events !== undefined && data.events.length == 0) {
                                cacheScenario("LIVE", data.entities[0]);
                                deferred.resolve(Responses.success("Scenario created", data.entities[0]));
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
                    } else {
                        deferred.resolve(Responses.danger("You need to choose a template scenario", false));
                    }
                } else {
                    deferred.resolve(Responses.danger("Name field can not be empty", false));
                }
            } else {
                deferred.resolve(Responses.danger("No name or template found", false));
            }
            return deferred.promise;
        };

        model.copyScenario = function(scenarioId) {
            var deferred = $q.defer(),
                url = "rest/Public/GameModel/" + scenarioId + "/Duplicate";
            if (scenarioId) {
                $http.post(ServiceURL + url, null, {
                    "headers": {
                        "managed-mode": "true"
                    }
                }).success(function(data) {
                    if (data.events !== undefined && data.events.length == 0) {
                        cacheScenario("LIVE", data.entities[0]);
                        deferred.resolve(Responses.success("Scenario copied", data.entities[0]));
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
            } else {
                deferred.resolve(Responses.danger("You need to set which scenario will be copied", false));
            }

            return deferred.promise;
        };

        model.createFromJSON = function(file) {
            var deferred = $q.defer(),
                url = "rest/GameModel",
                fd = new FormData();


            fd.append('file', file);
            $http.post(ServiceURL + url, fd, {
                transformRequest: angular.identity,
                headers: {
                    "managed-mode": true,
                    "Content-Type": undefined
                }
            }).success(function(data) {
                if (data.events !== undefined && data.events.length == 0) {
                    cacheScenario("LIVE", data.entities[0]);
                    deferred.resolve(Responses.success("Scenario created", data.entities[0]));
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

        model.updateScenario = function(id, infosToSet) {
            var deferred = $q.defer(),
                scenarioBeforeChange = scenarios.findScenario("LIVE", id);
            if (id && infosToSet) {
                if (scenarioBeforeChange) {
                    setScenarioInfos(infosToSet, scenarioBeforeChange).then(function(response) {
                        deferred.resolve(response);
                    });
                } else {
                    deferred.resolve(Responses.danger("No scenario to update", false));
                }
            } else {
                deferred.resolve(Responses.danger("No scenario to update", false));
            }
            return deferred.promise;
        };

        model.archiveScenario = function(scenarioToArchive) {
            var deferred = $q.defer();
            if (scenarioToArchive["@class"] === "GameModel") {
                setScenarioStatus(scenarioToArchive.id, "BIN").then(function(scenarioArchived) {
                    if (scenarioArchived) {
                        deferred.resolve(Responses.success("Scenario archived", scenarioArchived));
                    } else {
                        deferred.resolve(Responses.danger("Error during scenario archivage", false));
                    }
                });
            } else {
                deferred.resolve(Responses.danger("This is not a scenario", false));
            }
            return deferred.promise;
        };

        model.deletePermissions = function(scenarioId, userId) {
            return PermissionModel.deletePermissions(scenarioId, userId);
        }
        model.updatePermissions = function(scenarioId, userId, canCreate, canDuplicate, canEdit) {
            return PermissionModel.updatePermissions(scenarioId, userId, canCreate, canDuplicate, canEdit);
        };

        model.getPermissions = function(scenarioId) {

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

            var deferred = $q.defer();
            var scenario = scenarios.findScenario("LIVE", scenarioId);
            if (scenario === null) {
                deferred.resolve(Responses.danger("Whoops...", false));
            } else {
                var url = "rest/Extended/User/FindAccountPermissionByInstance/gm" + scenarioId
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
            }
            return deferred.promise;
        };


        model.getVersionsHistory = function(scenarioId) {
            var deferred = $q.defer();
            var url = "rest/Public/GameModel/" + scenarioId + "/File/list/History";

            $http.get(ServiceURL + url, {
                "headers": {
                    "managed-mode": "true"
                }
            })
                .success(function(data) {
                    if (data.events !== undefined && data.events.length == 0) {
                        var versions = data.entities;
                        deferred.resolve(Responses.success("Versions loaded", versions));
                    } else if (data.events !== undefined) {
                        deferred.resolve(Responses.danger(data.events[0].exceptions[0].message, false));
                    } else {
                        deferred.resolve(Responses.danger("Whoops...", false));
                    };
                }).error(function(data) {
                    if (data.events !== undefined && data.events.length > 0) {
                        deferred.resolve(Responses.danger(data.events[0].exceptions[0].message, false));
                    } else {
                        deferred.resolve(Responses.danger("Whoops...", false));
                    }
                });

            return deferred.promise;
        };

        model.addVersionHistory = function(scenarioId) {
            var deferred = $q.defer();

            var url = "rest/Public/GameModel/" + scenarioId + "/CreateVersion";
            $http.post(ServiceURL + url, {
                "headers": {
                    "managed-mode": "true"
                }
            })
                .success(function(data) {
                    // TODO: Managed mode seems not implemented...
                    // if (data.events !== undefined && data.events.length == 0) {
                    deferred.resolve(Responses.success("Version created", true));
                    // } else if (data.events !== undefined){
                    //   deferred.resolve(Responses.danger(data.events[0].exceptions[0].message, false));
                    // } else {
                    //   deferred.resolve(Responses.danger("Whoops...", false));
                    // };
                }).error(function(data) {
                    // TODO: Managed mode seems not implemented...
                    // if (data.events !== undefined &&  data.events.length > 0) {
                    //   deferred.resolve(Responses.danger(data.events[0].exceptions[0].message, false));
                    // } else {
                    deferred.resolve(Responses.danger("Whoops...", false));
                    // }
                });

            return deferred.promise;
        };
        model.deleteVersionHistory = function(scenarioId, version) {
            var deferred = $q.defer();
            var url = "rest/Public/GameModel/" + scenarioId + "/File/delete/History/" + version;

            $http.delete(ServiceURL + url, {
                "headers": {
                    "managed-mode": "true"
                }
            })
                .success(function(data) {
                    if (data.events !== undefined && data.events.length == 0) {
                        deferred.resolve(Responses.success("Version deleted", true));
                    } else if (data.events !== undefined) {
                        deferred.resolve(Responses.danger(data.events[0].exceptions[0].message, false));
                    } else {
                        deferred.resolve(Responses.danger("Whoops...", false));
                    };
                }).error(function(data) {
                    if (data.events !== undefined && data.events.length > 0) {
                        deferred.resolve(Responses.danger(data.events[0].exceptions[0].message, false));
                    } else {
                        deferred.resolve(Responses.danger("Whoops...", false));
                    }
                });

            return deferred.promise;
        };

        model.restoreVersionHistory = function(scenarioId, version) {

            var deferred = $q.defer();
            var url = "rest/Public/GameModel/" + scenarioId + "/Restore/History/" + version;

            $http.get(ServiceURL + url, {
                "headers": {
                    "managed-mode": "true"
                }
            })
                .success(function(data) {
                    if (data.events !== undefined && data.events.length == 0) {
                        var newScenario = data.entities[0];
                        cacheScenario("LIVE", newScenario);
                        deferred.resolve(Responses.success('Scenario has been duplicated with name: "' + newScenario.name + '"', newScenario));
                    } else if (data.events !== undefined) {
                        deferred.resolve(Responses.danger(data.events[0].exceptions[0].message, false));
                    } else {
                        deferred.resolve(Responses.danger("Whoops...", false));
                    };
                }).error(function(data) {
                    if (data.events !== undefined && data.events.length > 0) {
                        deferred.resolve(Responses.danger(data.events[0].exceptions[0].message, false));
                    } else {
                        deferred.resolve(Responses.danger("Whoops...", false));
                    }
                });

            return deferred.promise;
        };

        /*  ---------------------------------
ARCHIVED SCENARIOS SERVICES
--------------------------------- */

        /* Unarchive scenario */
        model.unarchiveScenario = function(scenarioToUnarchive) {
            var deferred = $q.defer();
            if (scenarioToUnarchive["@class"] === "GameModel") {
                setScenarioStatus(scenarioToUnarchive.id, "LIVE").then(function(scenarioUnarchived) {
                    if (scenarioUnarchived) {
                        deferred.resolve(Responses.success("Scenario unarchived", scenarioToUnarchive));
                    } else {
                        deferred.resolve(Responses.danger("Error during scenario unarchivage", false));
                    }
                });
            } else {
                deferred.resolve(Responses.danger("This is not a scenario", false));
            }
            return deferred.promise;
        }

        /* Delete all archived scenarios . */
        model.deleteArchivedScenarios = function() {
            var deferred = $q.defer();
            if (scenarios.cache.BIN) {
                if (scenarios.cache.BIN.data.length > 0) {
                    $http.delete(ServiceURL + "rest/GameModel").success(function(data) {
                        if (data) {
                            scenarios.cache.BIN.data = [];
                            deferred.resolve(Responses.success("All archives deleted", true));
                        }
                    }).error(function(data) {
                        deferred.resolve(Responses.danger("Error during archives suppression", false));
                    });
                } else {
                    deferred.resolve(Responses.info("No scenarios archived", true));
                }
            } else {
                deferred.resolve(Responses.info("No scenarios archived", true));
            }
            return deferred.promise;
        }

        /* Delete an archived scenario, passing this scenario in parameter. */
        model.deleteArchivedScenario = function(scenarioToDelete) {
            var deferred = $q.defer();
            if (scenarioToDelete["@class"] === "GameModel") {
                setScenarioStatus(scenarioToDelete.id, "DELETE").then(function(data) {
                    if (data) {
                        deferred.resolve(Responses.success("Scenario suppressed", scenarioToDelete));
                    } else {
                        deferred.resolve(Responses.danger("Error during scenario suppression", false));
                    }
                });
            } else {
                deferred.resolve(Responses.danger("This is not a scenario", false));
            }
            return deferred.promise;
        }

        /* Clear all scenarios in cache */
        model.clearCache = function() {
            scenarios.cache = [];
        };
    });