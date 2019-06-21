angular.module('wegas.models.scenarios', [])
    .service('ScenariosModel', function($http, $q, $interval, $translate, Auth, Responses) {
        "use strict";
        var model = this,
            ServiceURL = window.ServiceURL,
            getPath = function(status, type) {
                return ServiceURL + "rest/Lobby/GameModel/type/" + type + "/status/" + status;
            },
            scenarios = {
                cache: {},
                findScenario: function(cacheName, id) {
                    return _.find(scenarios.cache[cacheName].data, function(s) {
                        return +s.id === +id;
                    });
                },
                stopWaiting: function(waitFunction) {
                    $interval.cancel(waitFunction);
                },
                wait: function(cacheName) {
                    var deferred = $q.defer(),
                        waitScenarios = $interval(function() {
                            if (!scenarios.cache[cacheName].loading) {
                                scenarios.stopWaiting(waitScenarios);
                                deferred.resolve(true);
                            }
                        }, 500);
                    return deferred.promise;
                }
            },
            cachePermissions = function(status, type, cacheKey) {
                var deferred = $q.defer(),
                    path = ServiceURL + "rest/Lobby/GameModel/permissions/" + type + "/status/" + status;

                if (scenarios.cache[cacheKey]) {
                    $http.get(path, {
                        "headers": {
                            "managed-mode": "true"
                        }
                    }).success(function(data) {
                        if (data.updatedEntities) {
                            scenarios.cache[cacheKey].data = data.updatedEntities[0];
                            deferred.resolve(true);
                        } else {
                            scenarios.cache[cacheKey].data = [];
                            deferred.resolve(true);
                        }
                    }).error(function(data) {
                        scenarios.cache[cacheKey].data = [];
                        deferred.resolve(true);
                    });
                } else {
                    scenarios.cache[cacheKey] = {
                        data: [],
                        loading: false
                    };
                    deferred.resolve(true);
                }
                return deferred.promise;
            },
            /* Cache all scenarios in a list */
            cacheScenarios = function(status, type) {
                var deferred = $q.defer(),
                    cacheKey = type + ":" + status;
                if (scenarios.cache[cacheKey]) {
                    $http.get(getPath(status, type), {
                        "headers": {
                            "managed-mode": "true"
                        }
                    }).success(function(data) {
                        if (data.updatedEntities) {
                            scenarios.cache[cacheKey].data = data.updatedEntities;
                            deferred.resolve(true);
                        } else {
                            scenarios.cache[cacheKey].data = [];
                            deferred.resolve(true);
                        }
                    }).error(function(data) {
                        scenarios.cache[cacheKey].data = [];
                        deferred.resolve(true);
                    });
                } else {
                    scenarios.cache[cacheKey] = {
                        data: [],
                        loading: false
                    };
                    deferred.resolve(true);
                }
                return deferred.promise;
            },
            /* Cache a scenario, passing a scenario list and the scenario to add in parameter */
            cacheScenario = function(cacheName, scenario) {
                var list = null;
                if (cacheName && scenario) {
                    if (scenarios.cache[cacheName]) {
                        list = scenarios.cache[cacheName].data;
                        if (!_.find(list, scenario)) {
                            list.push(scenario);
                        }
                    }
                }
                return list;
            },
            /* Uncache a scenario, passing a scenario list and the scenario to remove in parameter */
            uncacheScenario = function(cacheName, scenario) {
                var list = null,
                    scenarioToUncache = null;
                if (scenarios.cache[cacheName]) {

                    list = scenarios.cache[cacheName].data;
                    scenarioToUncache = _.find(list, scenario);
                    if (scenarioToUncache) {
                        list = _.without(list, scenario);
                    }
                }
                return list;
            },
            /* Update status of scenario (LIVE, BIN, DELETE, SUPPRESSED) */
            setScenarioStatus = function(scenarioId, status) {
                var deferred = $q.defer(),
                    scenario;
                $http.put(ServiceURL + "rest/Lobby/GameModel/" + scenarioId + "/status/" + status).success(function(data) {
                    for (var cacheName in scenarios.cache) {
                        scenario = scenarios.findScenario(cacheName, scenarioId);
                        if (scenario) {
                            var permCacheName = "perm" + ":" + scenario.type + ":" + scenario.status;
                            var perm = scenarios.cache[permCacheName].data[scenario.id];

                            // remove scenario from the previous cache
                            scenarios.cache[cacheName].data = uncacheScenario(cacheName, scenario);
                            var newCacheName = cacheName.split(":")[0] + ":" + status;
                            if (scenarios.cache[newCacheName]) {
                                // add move it to the new cache
                                scenarios.cache[newCacheName].data = cacheScenario(newCacheName, data);
                                permCacheName = "perm" + ":" + scenario.type + ":" + status;
                                if (scenarios.cache[permCacheName]) {
                                    scenarios.cache[permCacheName].data[scenario.id] = perm;
                                }
                            }
                            break;
                        }
                    }
                    deferred.resolve(data);
                }).error(function(data) {
                    deferred.reject(data);
                });
                return deferred.promise;
            },
            setScenarioInfos = function(infos, scenarioBeforeChange) {
                var deferred = $q.defer(),
                    scenarioSetted = false,
                    newGameModel = JSON.parse(JSON.stringify(scenarioBeforeChange)),
                    properties = ["scriptUri", "clientScriptUri", "cssUri", "pagesUri", "logID", "guestAllowed"];

                if (newGameModel.name !== infos.name) {
                    newGameModel.name = infos.name;
                    scenarioSetted = true;
                }
                if (newGameModel.properties.iconUri !== ("ICON_" + infos.color + "_" + infos.icon.key + "_" + infos.icon.library)) {
                    newGameModel.properties.iconUri = "ICON_" + infos.color + "_" + infos.icon.key + "_" + infos.icon.library;
                    scenarioSetted = true;
                }
                if (newGameModel.properties.freeForAll !== infos.individual) {
                    newGameModel.properties.freeForAll = infos.individual;
                    scenarioSetted = true;
                }
                if (newGameModel.comments !== infos.comments) {
                    newGameModel.comments = infos.comments;
                    scenarioSetted = true;
                }

                _.each(properties, function(el, index) {
                    if (newGameModel.properties[el] !== infos[el]) {
                        newGameModel.properties[el] = infos[el];
                        scenarioSetted = true;
                    }
                });

                if (scenarioSetted) {
                    var url = "rest/Lobby/GameModel/" + scenarioBeforeChange.id;
                    $http.put(ServiceURL + url, newGameModel, {
                        "headers": {
                            "managed-mode": "true"
                        }
                    }).success(function(data) {
                        if (data.events !== undefined && data.events.length === 0) {
                            var scenario = data.updatedEntities[0];
                            scenarioBeforeChange.name = scenario.name;
                            scenarioBeforeChange.properties.iconUri = scenario.properties.iconUri;
                            scenarioBeforeChange.properties.freeForAll = scenario.properties.freeForAll;
                            scenarioBeforeChange.comments = scenario.comments;

                            _.each(properties, function(el, index) {
                                scenarioBeforeChange.properties[el] = scenario.properties[el];
                            });


                            deferred.resolve(scenario);
                        } else if (data.events !== undefined) {
                            //Responses.danger(data.events[0].exceptions[0].message,
                            deferred.resolve(false);
                        } else {
                            deferred.resolve(false);
                        }
                    }).error(function(data) {
                        if (data.events !== undefined && data.events.length > 0) {
                            //deferred.resolve(Responses.danger(data.events[0].exceptions[0].message, false));
                            deferred.resolve(false);
                        } else {
                            deferred.resolve(false);
                        }
                    });
                } else {
                    deferred.resolve(scenarioBeforeChange);
                }
                return deferred.promise;
            };

        model.hasAnyPermissions = function(gameModel, argPermissions, pMatrix /*optionnal*/) {
            var permissions;
            if (typeof argPermissions === "string") {
                permissions = [argPermissions];
            } else if (Array.isArray(argPermissions)) {
                permissions = argPermissions;
            } else {
                return false;
            }

            if (!pMatrix) {
                var cacheName = "perm:" + gameModel.type + ":" + gameModel.status;
                pMatrix = scenarios.cache[cacheName] && scenarios.cache[cacheName].data;
            }

            if (pMatrix) {
                var perms = pMatrix[gameModel.id];
                if (perms) {
                    return permissions.filter(function(reqPerm) {
                        return perms.filter(function(grantedPerm) {
                            return grantedPerm === "*" || grantedPerm.toUpperCase().indexOf(reqPerm) >= 0;
                        }).length > 0;
                    }).length > 0;
                }
            }

            return false;
        };

        model.getGameModelsByStatusTypeAndPermission = function(type, status, argPermissions) {
            var deferred = $q.defer();

            model.getPermissionsMatrix(status, type).then(function(permResponse) {
                model.getScenarios(status, type).then(function(gameModelResponse) {
                    var gameModels = gameModelResponse.data,
                        pMatrix = permResponse.data;

                    // filter gameModel against requested permisions
                    var filtered = gameModels.filter(function(gameModel) {
                        return model.hasAnyPermissions(gameModel, argPermissions, pMatrix);
                    });

                    $translate('COMMONS-SCENARIOS-FIND-FLASH-SUCCESS').then(function(message) {
                        deferred.resolve(Responses.success(message, filtered));
                    });
                });
            });

            return deferred.promise;
        };

        /* Ask for all scenarios in a list */
        model.getPermissionsMatrix = function(status, type) {
            var deferred = $q.defer(),
                eType = type || "SCENARIO",
                cacheName = "perm:" + eType + ":" + status;
            Auth.getAuthenticatedUser().then(function(user) {
                if (user) {
                    if (scenarios.cache[cacheName]) {
                        if (scenarios.cache[cacheName].loading) {
                            scenarios.wait(cacheName).then(function() {
                                $translate('COMMONS-SCENARIOS-FIND-FLASH-SUCCESS').then(function(message) {
                                    deferred.resolve(Responses.success(message, scenarios.cache[cacheName].data));
                                });
                            });
                        } else {
                            $translate('COMMONS-SCENARIOS-FIND-FLASH-SUCCESS').then(function(message) {
                                deferred.resolve(Responses.success(message, scenarios.cache[cacheName].data));
                            });
                        }
                    } else {
                        scenarios.cache[cacheName] = {
                            data: null,
                            loading: true
                        };
                        cachePermissions(status, eType, cacheName).then(function() {
                            scenarios.cache[cacheName].loading = false;
                            $translate('COMMONS-SCENARIOS-FIND-FLASH-SUCCESS').then(function(message) {
                                deferred.resolve(Responses.success(message, scenarios.cache[cacheName].data));
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



        model.getModels = function(status) {
            return model.getScenarios(status, "MODEL");
        };

        /* Ask for all scenarios in a list */
        model.getScenarios = function(status, type) {
            var deferred = $q.defer(),
                eType = type || "SCENARIO",
                cacheName = eType + ":" + status;
            Auth.getAuthenticatedUser().then(function(user) {
                if (user) {
                    if (scenarios.cache[cacheName]) {
                        if (scenarios.cache[cacheName].loading) {
                            scenarios.wait(cacheName).then(function() {
                                $translate('COMMONS-SCENARIOS-FIND-FLASH-SUCCESS').then(function(message) {
                                    deferred.resolve(Responses.success(message, scenarios.cache[cacheName].data));
                                });
                            });
                        } else {
                            $translate('COMMONS-SCENARIOS-FIND-FLASH-SUCCESS').then(function(message) {
                                deferred.resolve(Responses.success(message, scenarios.cache[cacheName].data));
                            });
                        }
                    } else {
                        scenarios.cache[cacheName] = {
                            data: null,
                            loading: true
                        };
                        cacheScenarios(status, eType).then(function() {
                            scenarios.cache[cacheName].loading = false;
                            $translate('COMMONS-SCENARIOS-FIND-FLASH-SUCCESS').then(function(message) {
                                deferred.resolve(Responses.success(message, scenarios.cache[cacheName].data));
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


        /* Ask for one model. */
        model.getModel = function(status, id) {
            return model.getScenario(status, id, "MODEL");
        };

        /* Ask for one scenario. */
        model.getScenario = function(status, id, type) {
            var deferred = $q.defer(),
                eType = type || "SCENARIO",
                cacheName = eType + ":" + status,
                scenario = null;
            if (scenarios.cache[cacheName]) {
                if (scenarios.cache[cacheName].loading) {
                    scenarios.wait(cacheName).then(function() {

                        scenario = scenarios.findScenario(cacheName, id);
                        if (scenario) {
                            $translate('COMMONS-SCENARIOS-GET-FLASH-SUCCESS').then(function(message) {
                                deferred.resolve(Responses.success(message, scenario));
                            });
                        } else {
                            $translate('COMMONS-SCENARIOS-GET-FLASH-ERROR').then(function(message) {
                                deferred.resolve(Responses.danger(message, false));
                            });
                        }
                    });
                } else {
                    scenario = scenarios.findScenario(cacheName, id);
                    if (scenario) {
                        $translate('COMMONS-SCENARIOS-GET-FLASH-SUCCESS').then(function(message) {
                            deferred.resolve(Responses.success(message, scenario));
                        });
                    } else {
                        $translate('COMMONS-SCENARIOS-GET-FLASH-ERROR').then(function(message) {
                            deferred.resolve(Responses.danger(message, false));
                        });
                    }
                }
            } else {
                model.getScenarios(status, eType).then(function() {
                    scenario = scenarios.findScenario(cacheName, id);
                    if (scenario) {
                        $translate('COMMONS-SCENARIOS-GET-FLASH-SUCCESS').then(function(message) {
                            deferred.resolve(Responses.success(message, scenario));
                        });
                    } else {
                        $translate('COMMONS-SCENARIOS-GET-FLASH-ERROR').then(function(message) {
                            deferred.resolve(Responses.danger(message, false));
                        });
                    }
                });
            }
            return deferred.promise;
        };
        (function() { // GameModel (...scenario...) creation functions
            // 2xx return code
            function createSuccess(deferred) {
                return function success(data) {
                    var gameModel = _.find(data.updatedEntities, {'@class': 'GameModel'});
                    if (gameModel) {
                        var cacheName = gameModel.type + ':' + gameModel.status;
                        cacheScenario(cacheName, gameModel);
                        var pCache = scenarios.cache["perm:" + cacheName];
                        if (pCache){
                            // grant all right
                            pCache.data[gameModel.id] = ["*"];
                        }
                        $translate('COMMONS-SCENARIOS-COPY-FLASH-SUCCESS').then(function(message) {
                            deferred.resolve(Responses.success(message, gameModel));
                        });
                    } else {
                        $translate('COMMONS-SCENARIOS-COPY-FLASH-ERROR').then(function(message) {
                            deferred.resolve(Responses.danger(message, false));
                        });
                    }
                };
            }
            // other return code
            function createError(deferred) {
                return function error(data) {
                    if (data.events !== undefined) {
                        console.log("WEGAS LOBBY : Error while copying scenario");
                        console.log(data.events);
                    }
                    $translate('COMMONS-SCENARIOS-COPY-FLASH-ERROR').then(function(message) {
                        deferred.resolve(Responses.danger(message, false));
                    });
                };
            }

            model.releaseScenario = function(scenarioId) {
                var deferred = $q.defer(),
                    url = "rest/Lobby/GameModel/Release/" + scenarioId;
                if (scenarioId) {
                    $http.get(ServiceURL + url, {
                        "headers": {
                            "managed-mode": "true"
                        }
                    }).success(createSuccess(deferred)).error(createError(deferred));

                    return deferred.promise;
                }
                return deferred.promise;
            };

            model.integrateScenario = function(modelId, scenarioId) {
                var deferred = $q.defer(),
                    url = "rest/Lobby/GameModel/" + modelId + "/Integrate/" + scenarioId;
                if (modelId && scenarioId) {
                    $http.get(ServiceURL + url, {
                        "headers": {
                            "managed-mode": "true"
                        }
                    }).success(createSuccess(deferred)).error(createError(deferred));

                    return deferred.promise;
                }
                return deferred.promise;
            };

            model.extractModel = function(name, ids) {
                var deferred = $q.defer(),
                    url = "rest/Lobby/GameModel/extractModel/";
                if (name && ids) {
                    if (name !== "") {
                        if (ids.length > 0) {
                            url += ids.join(",");
                            $http.post(ServiceURL + url, {
                                "@class": "GameModel",
                                "name": name,
                                "properties": {}
                            }, {
                                "headers": {
                                    "managed-mode": "true"
                                }
                            }).success(createSuccess(deferred)).error(createError(deferred));
                        } else {
                            $translate('COMMONS-SCENARIOS-NO-TEMPLATE-FLASH-ERROR').then(function(message) {
                                deferred.resolve(Responses.danger(message, false));
                            });
                        }
                    } else {
                        $translate('COMMONS-SCENARIOS-EMPTY-NAME-FLASH-ERROR').then(function(message) {
                            deferred.resolve(Responses.danger(message, false));
                        });
                    }
                } else {
                    $translate('COMMONS-SCENARIOS-NO-NAME-TEMPLATE-FLASH-ERROR').then(function(message) {
                        deferred.resolve(Responses.danger(message, false));
                    });
                }
                return deferred.promise;
            };

            model.createModel = function(name, templateId) {
                return model.abstractCreate(name, "model", templateId);
            };

            model.createScenario = function(name, templateId) {
                return model.abstractCreate(name, null, templateId);
            };

            model.abstractCreate = function(name, restPath, templateId) {
                var deferred = $q.defer(),
                    url = "rest/Lobby/GameModel/" + (restPath ? restPath + "/" : "") + templateId;
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
                            }).success(createSuccess(deferred)).error(createError(deferred));
                        } else {
                            $translate('COMMONS-SCENARIOS-NO-TEMPLATE-FLASH-ERROR').then(function(message) {
                                deferred.resolve(Responses.danger(message, false));
                            });
                        }
                    } else {
                        $translate('COMMONS-SCENARIOS-EMPTY-NAME-FLASH-ERROR').then(function(message) {
                            deferred.resolve(Responses.danger(message, false));
                        });
                    }
                } else {
                    $translate('COMMONS-SCENARIOS-NO-NAME-TEMPLATE-FLASH-ERROR').then(function(message) {
                        deferred.resolve(Responses.danger(message, false));
                    });
                }
                return deferred.promise;
            };

            model.copyScenario = function(scenario) {
                var deferred = $q.defer();
                if (scenario) {
                    var url = "rest/Lobby/GameModel/" + scenario.id + "/Duplicate";
                    $http.post(ServiceURL + url, null, {
                        "headers": {
                            "managed-mode": "true"
                        }
                    })
                        .success(createSuccess(deferred))
                        .error(createError(deferred));
                } else {
                    $translate('COMMONS-SCENARIOS-NO-COPY-FLASH-ERROR').then(function(message) {
                        deferred.resolve(Responses.danger(message, false));
                    });
                }
                return deferred.promise;
            };

            model.createFromJSON = function(file) {
                var deferred = $q.defer(),
                    url = "rest/Lobby/GameModel",
                    fd = new FormData();

                fd.append('file', file);
                $http.post(ServiceURL + url, fd, {
                    transformRequest: angular.identity,
                    headers: {
                        "managed-mode": true,
                        "Content-Type": undefined
                    }
                }).success(createSuccess(deferred)).error(createError(deferred));
                return deferred.promise;
            };
        })();

        model.updateScenario = function(id, infosToSet, type) {
            var deferred = $q.defer(),
                eType = type || "SCENARIO",
                cacheName = eType + ":LIVE",
                scenarioBeforeChange = scenarios.findScenario(cacheName, id);

            if (id && infosToSet) {
                if (scenarioBeforeChange) {
                    setScenarioInfos(infosToSet, scenarioBeforeChange).then(function(scenarioSetted) {
                        if (scenarioSetted) {
                            $translate('COMMONS-SCENARIOS-UPDATE-FLASH-SUCCESS').then(function(message) {
                                deferred.resolve(Responses.success(message, scenarioSetted));
                            });
                        } else {
                            $translate('COMMONS-SCENARIOS-UPDATE-FLASH-ERROR').then(function(message) {
                                deferred.resolve(Responses.danger(message, false));
                            });
                        }
                    });
                } else {
                    $translate('COMMONS-SCENARIOS-NO-UPDATE-FLASH-ERROR').then(function(message) {
                        deferred.resolve(Responses.danger(message, false));
                    });
                }
            } else {
                $translate('COMMONS-SCENARIOS-UPDATE-FLASH-ERROR').then(function(message) {
                    deferred.resolve(Responses.danger(message, false));
                });
            }
            return deferred.promise;
        };

        model.getVersionsHistory = function(scenarioId) {
            var deferred = $q.defer();
            var url = "rest/Public/GameModel/" + scenarioId + "/History";

            $http.get(ServiceURL + url, {
                "headers": {
                    "managed-mode": "true"
                }
            })
                .success(function(data) {
                    if (data.events !== undefined && data.events.length === 0) {
                        var versions = data.updatedEntities;
                        $translate('COMMONS-SCENARIOS-VERSIONS-FIND-FLASH-SUCCESS').then(function(message) {
                            deferred.resolve(Responses.success(message, versions));
                        });
                    } else {
                        if (data.events !== undefined) {
                            console.log("WEGAS LOBBY : Error while loading scenario version");
                            console.log(data.events);
                        }
                        $translate('COMMONS-SCENARIOS-VERSIONS-FIND-FLASH-ERROR').then(function(message) {
                            deferred.resolve(Responses.danger(message, false));
                        });
                    }
                }).error(function(data) {
                if (data.events !== undefined) {
                    console.log("WEGAS LOBBY : Error while creating scenario version");
                    console.log(data.events);
                }
                $translate('COMMONS-SCENARIOS-VERSIONS-FIND-FLASH-ERROR').then(function(message) {
                    deferred.resolve(Responses.danger(message, false));
                });
            });

            return deferred.promise;
        };

        model.addVersionHistory = function(scenarioId) {
            var deferred = $q.defer();

            var url = "rest/Public/GameModel/" + scenarioId + "/History/CreateVersion";
            $http.post(ServiceURL + url, {
                "headers": {
                    "managed-mode": "true"
                }
            })
                .success(function(data) {
                    // TODO: Managed mode seems not implemented...
                    // if (data.events !== undefined && data.events.length == 0) {
                    $translate('COMMONS-SCENARIOS-VERSIONS-CREATE-FLASH-SUCCESS').then(function(message) {
                        deferred.resolve(Responses.success(message, true));
                    });
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
                $translate('COMMONS-SCENARIOS-VERSIONS-CREATE-FLASH-ERROR').then(function(message) {
                    deferred.resolve(Responses.danger(message, false));
                });
                // }
            });

            return deferred.promise;
        };
        model.deleteVersionHistory = function(scenarioId, version) {
            var deferred = $q.defer();
            var url = "rest/Public/GameModel/" + scenarioId + "/History/" + version;
            $http.delete(ServiceURL + url, {
                "headers": {
                    "managed-mode": "true"
                }
            }).success(function(data) {
                if (data.events !== undefined && data.events.length === 0) {
                    $translate('COMMONS-SCENARIOS-VERSIONS-DELETE-FLASH-SUCCESS').then(function(message) {
                        deferred.resolve(Responses.success(message, true));
                    });
                } else {
                    if (data.events !== undefined) {
                        console.log("WEGAS LOBBY : Error while deleting scenario version");
                        console.log(data.events);
                    }
                    $translate('COMMONS-SCENARIOS-VERSIONS-DELETE-FLASH-ERROR').then(function(message) {
                        deferred.resolve(Responses.danger(message, false));
                    });
                }
            }).error(function(data) {
                if (data.events !== undefined) {
                    console.log("WEGAS LOBBY : Error while deleting scenario version");
                    console.log(data.events);
                }
                $translate('COMMONS-SCENARIOS-VERSIONS-DELETE-FLASH-ERROR').then(function(message) {
                    deferred.resolve(Responses.danger(message, false));
                });
            });
            return deferred.promise;
        };

        model.restoreVersionHistory = function(scenarioId, version) {
            var deferred = $q.defer(),
                url = "rest/Lobby/GameModel/" + scenarioId + "/History/Restore/" + version;
            $http.get(ServiceURL + url, {
                "headers": {
                    "managed-mode": "true"
                }
            }).success(function(data) {
                if (data.events !== undefined && data.events.length === 0) {
                    var newScenario = data.updatedEntities[0];
                    cacheScenario(newScenario.type + ":LIVE", newScenario);
                    $translate('COMMONS-SCENARIOS-VERSIONS-RESTORE-FLASH-SUCCESS', {
                        name: newScenario.name
                    }).then(function(message) {
                        deferred.resolve(Responses.success(message, newScenario));
                    });
                } else {
                    if (data.events !== undefined) {
                        console.log("WEGAS LOBBY : Error while restoring scenario version");
                        console.log(data.events);
                    }
                    $translate('COMMONS-SCENARIOS-VERSIONS-RESTORE-FLASH-ERROR').then(function(message) {
                        deferred.resolve(Responses.danger(message, false));
                    });
                }
            }).error(function(data) {
                if (data.events !== undefined) {
                    console.log("WEGAS LOBBY : Error while restoring scenario version");
                    console.log(data.events);
                }
                $translate('COMMONS-SCENARIOS-VERSIONS-RESTORE-FLASH-ERROR').then(function(message) {
                    deferred.resolve(Responses.danger(message, false));
                });
            });
            return deferred.promise;
        };

        /*  ---------------------------------
         ARCHIVED SCENARIOS SERVICES
         --------------------------------- */
        model.countArchivedModels = function() {
            var deferred = $q.defer();
            $http.get(ServiceURL + "rest/GameModel/type/MODEL/status/BIN/count").success(function(data) {
                $translate('PRIVATE-ARCHIVES-COUNT').then(function(message) {
                    deferred.resolve(Responses.info(message, data));
                });
            });
            return deferred.promise;
        };


        model.countArchivedScenarios = function() {
            var deferred = $q.defer();
            $http.get(ServiceURL + "rest/GameModel/status/BIN/count").success(function(data) {
                $translate('PRIVATE-ARCHIVES-COUNT').then(function(message) {
                    deferred.resolve(Responses.info(message, data));
                });
            });
            return deferred.promise;
        };

        model.archiveScenario = function(scenarioToArchive) {
            var deferred = $q.defer();
            if (scenarioToArchive["@class"] === "GameModel") {
                setScenarioStatus(scenarioToArchive.id, "BIN").then(function(scenarioArchived) {
                    if (scenarioArchived) {
                        $translate('COMMONS-SCENARIOS-ARCHIVE-FLASH-SUCCESS').then(function(message) {
                            deferred.resolve(Responses.success(message, scenarioArchived));
                        });
                    } else {
                        $translate('COMMONS-SCENARIOS-ARCHIVE-FLASH-ERROR').then(function(message) {
                            deferred.resolve(Responses.danger(message, false));
                        });
                    }
                }).catch(function(data) {
                    if (data && data.message) {
                        deferred.resolve(Responses.danger(data.message, false));
                    } else {
                        $translate('COMMONS-SCENARIOS-SUPPRESSION-FLASH-ERROR').then(function(message) {
                            deferred.resolve(Responses.danger(message, false));
                        });
                    }
                });

            } else {
                $translate('COMMONS-SCENARIOS-WRONG-OBJECT-FLASH-ERROR').then(function(message) {
                    deferred.resolve(Responses.danger(message, false));
                });
            }
            return deferred.promise;
        };

        /* Unarchive scenario */
        model.unarchiveScenario = function(scenarioToUnarchive) {
            var deferred = $q.defer();
            if (scenarioToUnarchive["@class"] === "GameModel") {
                setScenarioStatus(scenarioToUnarchive.id, "LIVE").then(function(scenarioUnarchived) {
                    if (scenarioUnarchived) {
                        $translate('COMMONS-SCENARIOS-UNARCHIVE-FLASH-SUCCESS').then(function(message) {
                            deferred.resolve(Responses.success(message, scenarioUnarchived));
                        });
                    } else {
                        $translate('COMMONS-SCENARIOS-UNARCHIVE-FLASH-ERROR').then(function(message) {
                            deferred.resolve(Responses.danger(message, false));
                        });
                    }
                }).catch(function(data) {
                    if (data && data.message) {
                        deferred.resolve(Responses.danger(data.message, false));
                    } else {
                        $translate('COMMONS-SCENARIOS-SUPPRESSION-FLASH-ERROR').then(function(message) {
                            deferred.resolve(Responses.danger(message, false));
                        });
                    }
                });
            } else {
                $translate('COMMONS-SCENARIOS-WRONG-OBJECT-FLASH-ERROR').then(function(message) {
                    deferred.resolve(Responses.danger(message, false));
                });
            }
            return deferred.promise;
        };

        /* Delete an archived scenario, passing this scenario in parameter. */
        model.deleteArchivedScenario = function(scenarioToDelete) {
            var deferred = $q.defer();
            if (scenarioToDelete["@class"] === "GameModel") {
                setScenarioStatus(scenarioToDelete.id, "DELETE").then(function(data) {
                    if (data) {
                        $translate('COMMONS-SCENARIOS-SUPPRESSION-FLASH-SUCCESS').then(function(message) {
                            deferred.resolve(Responses.success(message, data));
                        });
                    } else {
                        $translate('COMMONS-SCENARIOS-SUPPRESSION-FLASH-ERROR').then(function(message) {
                            deferred.resolve(Responses.danger(message, false));
                        });
                    }
                }).catch(function(data) {
                    if (data && data.message) {
                        deferred.resolve(Responses.danger(data.message, false));
                    } else {
                        $translate('COMMONS-SCENARIOS-SUPPRESSION-FLASH-ERROR').then(function(message) {
                            deferred.resolve(Responses.danger(message, false));
                        });
                    }
                });
            } else {
                $translate('COMMONS-SCENARIOS-WRONG-OBJECT-FLASH-ERROR').then(function(message) {
                    deferred.resolve(Responses.danger(message, false));
                });
            }
            return deferred.promise;
        };

        /* Clear all scenarios in cache */
        model.clearCache = function() {
            scenarios.cache = {};
        };
    });
