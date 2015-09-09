angular.module('wegas.models.scenarios', [])
    .service('ScenariosModel', function($http, $q, $interval, $translate, Auth, Responses) {
        var model = this,
            getPath = function(status) {
                return ServiceURL + "rest/EditorExtended/GameModel/status/" + status;
            },
            scenarios = {
                cache: {},
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
                                deferred.resolve(true);
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
                        if (data.entities) {
                            scenarios.cache[status].data = data.entities;
                            deferred.resolve(true);
                        } else {
                            scenarios.cache[status].data = [];
                            deferred.resolve(true);
                        }
                    }).error(function(data) {
                        scenarios.cache[status].data = [];
                        deferred.resolve(true);
                    });
                } else {
                    scenarios.cache[status] = {
                        data:[],
                        loading:false
                    };
                    deferred.resolve(true);
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
                var deferred = $q.defer(),
                    scenario;
                $http.put(ServiceURL + "rest/EditorExtended/GameModel/" + scenarioId + "/status/" + status).success(function(data) {
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
                scenarioSetted = false,
                properties = ["scriptUri","clientScriptUri","cssUri","pagesUri","logID"];
                
            if (scenarioBeforeChange.name !== infos.name) {
                scenarioBeforeChange.name = infos.name;
                scenarioSetted = true;
            }
            if (scenarioBeforeChange.properties.iconUri !== ("ICON_" + infos.color + "_" + infos.icon.key + "_" + infos.icon.library)) {
                scenarioBeforeChange.properties.iconUri = "ICON_" + infos.color + "_" + infos.icon.key + "_" + infos.icon.library;
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

            _.each(properties, function(el, index) {
                if (scenarioBeforeChange.properties[el] !== infos[el]) {
                    scenarioBeforeChange.properties[el] = infos[el];
                    scenarioSetted = true;
                }
            });

            if (scenarioSetted) {
                var url = "rest/Public/GameModel/" + scenarioBeforeChange.id + "?view=EditorExtended";
                $http.put(ServiceURL + url, scenarioBeforeChange, {
                    "headers": {
                        "managed-mode": "true"
                    }
                }).success(function(data) {
                    if (data.events !== undefined && data.events.length == 0) {
                        var scenario = data.entities[0];
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

        /* Ask for all scenarios in a list */
        model.getScenarios = function(status) {
            var deferred = $q.defer();
            Auth.getAuthenticatedUser().then(function(user) {
                if (user != null) {
                    if (scenarios.cache[status]) {
                        if (scenarios.cache[status].loading) {
                            scenarios.wait(status).then(function() {
                                $translate('COMMONS-SCENARIOS-FIND-FLASH-SUCCESS').then(function (message) {
                                    deferred.resolve(Responses.success(message, scenarios.cache[status].data));
                                });
                            });
                        } else {
                            $translate('COMMONS-SCENARIOS-FIND-FLASH-SUCCESS').then(function (message) {
                                deferred.resolve(Responses.success(message, scenarios.cache[status].data));
                            });
                        }
                    } else {
                        scenarios.cache[status] = {
                            data: null,
                            loading: true
                        };
                        cacheScenarios(status).then(function() {
                            scenarios.cache[status].loading = false;
                            $translate('COMMONS-SCENARIOS-FIND-FLASH-SUCCESS').then(function (message) {
                                deferred.resolve(Responses.success(message, scenarios.cache[status].data));
                            });
                        });
                    }
                } else {
                    $translate('COMMONS-AUTH-CURRENT-FLASH-ERROR').then(function (message) {
                        deferred.resolve(Responses.danger(message, false));
                    });
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
                            $translate('COMMONS-SCENARIOS-GET-FLASH-SUCCESS').then(function (message) {
                                deferred.resolve(Responses.success(message, scenario));
                            });
                        } else {
                            $translate('COMMONS-SCENARIOS-GET-FLASH-ERROR').then(function (message) {
                            deferred.resolve(Responses.danger(message, false));
                        });
                        }
                    });
                } else {
                    scenario = scenarios.findScenario(status, id);
                    if (scenario) {
                        $translate('COMMONS-SCENARIOS-GET-FLASH-SUCCESS').then(function (message) {
                            deferred.resolve(Responses.success(message, scenario));
                        });
                    } else {
                        $translate('COMMONS-SCENARIOS-GET-FLASH-ERROR').then(function (message) {
                            deferred.resolve(Responses.danger(message, false));
                        });
                    }
                }
            } else {
                model.getScenarios(status).then(function() {
                    scenario = scenarios.findScenario(status, id);
                    if (scenario) {
                        $translate('COMMONS-SCENARIOS-GET-FLASH-SUCCESS').then(function (message) {
                            deferred.resolve(Responses.success(message, scenario));
                        });
                    } else {
                        $translate('COMMONS-SCENARIOS-GET-FLASH-ERROR').then(function (message) {
                            deferred.resolve(Responses.danger(message, false));
                        });
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
                                $translate('COMMONS-SCENARIOS-CREATE-FLASH-SUCCESS').then(function (message) {
                                    deferred.resolve(Responses.success(message, data.entities[0]));
                                });
                            } else {
                                if (data.events !== undefined) {
                                    console.log("WEGAS LOBBY : Error while creating scenario");
                                    console.log(data.events);
                                } 
                                $translate('COMMONS-SCENARIOS-CREATE-FLASH-ERROR').then(function (message) {
                                    deferred.resolve(Responses.danger(message, false));
                                });
                            }
                        }).error(function(data) {
                            if (data.events !== undefined) {
                                console.log("WEGAS LOBBY : Error while creating scenario");
                                console.log(data.events);
                            } 
                            $translate('COMMONS-SCENARIOS-CREATE-FLASH-ERROR').then(function (message) {
                                deferred.resolve(Responses.danger(message, false));
                            });
                        });
                    } else {
                        $translate('COMMONS-SCENARIOS-NO-TEMPLATE-FLASH-ERROR').then(function (message) {
                            deferred.resolve(Responses.danger(message, false));
                        });
                    }
                } else {
                    $translate('COMMONS-SCENARIOS-EMPTY-NAME-FLASH-ERROR').then(function (message) {
                        deferred.resolve(Responses.danger(message, false));
                    });
                }
            } else {
                $translate('COMMONS-SCENARIOS-NO-NAME-TEMPLATE-FLASH-ERROR').then(function (message) {
                    deferred.resolve(Responses.danger(message, false));
                });
            }
            return deferred.promise;
        };

        model.copyScenario = function(scenarioId) {
            var deferred = $q.defer(),
                url = "rest/EditorExtended/GameModel/" + scenarioId + "/Duplicate";
            if (scenarioId) {
                $http.post(ServiceURL + url, null, {
                    "headers": {
                        "managed-mode": "true"
                    }
                }).success(function(data) {
                    if (data.events !== undefined && data.events.length == 0) {
                        cacheScenario("LIVE", data.entities[0]);
                        $translate('COMMONS-SCENARIOS-COPY-FLASH-SUCCESS').then(function (message) {
                            deferred.resolve(Responses.success(message, data.entities[0]));
                        });
                    } else {
                        if(data.events[0] && data.events[0]["@class"] == "CustomEvent"){
                            cacheScenario("LIVE", data.entities[0]);
                            $translate('COMMONS-SCENARIOS-COPY-FLASH-SUCCESS').then(function (message) {
                                deferred.resolve(Responses.success(message, data.entities[0]));
                            });
                        }else{
                            console.log("WEGAS LOBBY : Error while copying scenario");
                            console.log(data.events);
                            
                            $translate('COMMONS-SCENARIOS-COPY-FLASH-ERROR').then(function (message) {
                                deferred.resolve(Responses.danger(message, false));
                            });
                        }
                    }
                }).error(function(data) {
                    if (data.events !== undefined) {
                        console.log("WEGAS LOBBY : Error while copying scenario");
                        console.log(data.events);
                    } 
                    $translate('COMMONS-SCENARIOS-COPY-FLASH-ERROR').then(function (message) {
                        deferred.resolve(Responses.danger(message, false));
                    });
                });
            } else {
                $translate('COMMONS-SCENARIOS-NO-COPY-FLASH-ERROR').then(function (message) {
                    deferred.resolve(Responses.danger(message, false));
                });
            }
            return deferred.promise;
        };

        model.createFromJSON = function(file) {
            var deferred = $q.defer(),
                url = "rest/EditorExtended/GameModel",
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
                    $translate('COMMONS-SCENARIOS-CREATE-FLASH-SUCCESS').then(function (message) {
                        deferred.resolve(Responses.success(message, data.entities[0]));
                    });
                } else {
                    if (data.events !== undefined) {
                        console.log("WEGAS LOBBY : Error while creating scenario");
                        console.log(data.events);
                    } 
                    $translate('COMMONS-SCENARIOS-CREATE-FLASH-ERROR').then(function (message) {
                        deferred.resolve(Responses.danger(message, false));
                    });
                }
            }).error(function(data) {
                if (data.events !== undefined) {
                    console.log("WEGAS LOBBY : Error while creating scenario");
                    console.log(data.events);
                } 
                $translate('COMMONS-SCENARIOS-CREATE-FLASH-ERROR').then(function (message) {
                    deferred.resolve(Responses.danger(message, false));
                });
            });
            return deferred.promise;
        };

        model.updateScenario = function(id, infosToSet) {
            var deferred = $q.defer(),
                scenarioBeforeChange = scenarios.findScenario("LIVE", id);
            if (id && infosToSet) {
                if (scenarioBeforeChange) {
                    setScenarioInfos(infosToSet, scenarioBeforeChange).then(function(scenarioSetted) {
                        if(scenarioSetted){
                            $translate('COMMONS-SCENARIOS-UPDATE-FLASH-SUCCESS').then(function (message) {
                                deferred.resolve(Responses.success(message, scenarioSetted));
                            });
                        }else{
                            $translate('COMMONS-SCENARIOS-UPDATE-FLASH-ERROR').then(function (message) {
                                deferred.resolve(Responses.danger(message, false));
                            });
                        }
                    });
                } else {
                    $translate('COMMONS-SCENARIOS-NO-UPDATE-FLASH-ERROR').then(function (message) {
                        deferred.resolve(Responses.danger(message, false));
                    });
                }
            } else {
                $translate('COMMONS-SCENARIOS-UPDATE-FLASH-ERROR').then(function (message) {
                    deferred.resolve(Responses.danger(message, false));
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
                        $translate('COMMONS-SCENARIOS-VERSIONS-FIND-FLASH-SUCCESS').then(function (message) {
                            deferred.resolve(Responses.success(message, versions));
                        });
                    } else {
                        if (data.events !== undefined) {
                            console.log("WEGAS LOBBY : Error while loading scenario version");
                            console.log(data.events);
                        } 
                        $translate('COMMONS-SCENARIOS-VERSIONS-FIND-FLASH-ERROR').then(function (message) {
                            deferred.resolve(Responses.danger(message, false));
                        });
                    }
                }).error(function(data) {
                    if (data.events !== undefined) {
                        console.log("WEGAS LOBBY : Error while creating scenario version");
                        console.log(data.events);
                    } 
                    $translate('COMMONS-SCENARIOS-VERSIONS-FIND-FLASH-ERROR').then(function (message) {
                        deferred.resolve(Responses.danger(message, false));
                    });
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
                    $translate('COMMONS-SCENARIOS-VERSIONS-CREATE-FLASH-SUCCESS').then(function (message) {
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
                    $translate('COMMONS-SCENARIOS-VERSIONS-CREATE-FLASH-ERROR').then(function (message) {
                        deferred.resolve(Responses.danger(message, false));
                    });
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
            }).success(function(data) {
                if (data.events !== undefined && data.events.length == 0) {
                    $translate('COMMONS-SCENARIOS-VERSIONS-DELETE-FLASH-SUCCESS').then(function (message) {
                        deferred.resolve(Responses.success(message, true));
                    });
                } else{
                    if (data.events !== undefined) {
                        console.log("WEGAS LOBBY : Error while deleting scenario version");
                        console.log(data.events);
                    } 
                    $translate('COMMONS-SCENARIOS-VERSIONS-DELETE-FLASH-ERROR').then(function (message) {
                        deferred.resolve(Responses.danger(message, false));
                    });
                } 
            }).error(function(data) {
                if (data.events !== undefined) {
                    console.log("WEGAS LOBBY : Error while deleting scenario version");
                    console.log(data.events);
                } 
                $translate('COMMONS-SCENARIOS-VERSIONS-DELETE-FLASH-ERROR').then(function (message) {
                    deferred.resolve(Responses.danger(message, false));
                });
            });
            return deferred.promise;
        };

        model.restoreVersionHistory = function(scenarioId, version) {
            var deferred = $q.defer(),
                url = "rest/Public/GameModel/" + scenarioId + "/Restore/History/" + version;
            $http.get(ServiceURL + url, {
                "headers": {
                    "managed-mode": "true"
                }
            }).success(function(data) {
                if (data.events !== undefined && data.events.length == 0) {
                    var newScenario = data.entities[0];
                    cacheScenario("LIVE", newScenario);
                    $translate('COMMONS-SCENARIOS-VERSIONS-RESTORE-FLASH-SUCCESS', { name: newScenario.name}).then(function (message) {
                        deferred.resolve(Responses.success(message, newScenario));
                    });
                } else{
                    if (data.events !== undefined) {
                        console.log("WEGAS LOBBY : Error while restoring scenario version");
                        console.log(data.events);
                    } 
                    $translate('COMMONS-SCENARIOS-VERSIONS-RESTORE-FLASH-ERROR').then(function (message) {
                        deferred.resolve(Responses.danger(message, false));
                    });
                }
            }).error(function(data) {
                if (data.events !== undefined) {
                    console.log("WEGAS LOBBY : Error while restoring scenario version");
                    console.log(data.events);
                } 
                $translate('COMMONS-SCENARIOS-VERSIONS-RESTORE-FLASH-ERROR').then(function (message) {
                    deferred.resolve(Responses.danger(message, false));
                });
            });
            return deferred.promise;
        };

    /*  ---------------------------------
            ARCHIVED SCENARIOS SERVICES
        --------------------------------- */
        model.countArchivedScenarios = function() {
            var deferred = $q.defer();
            $http.get(ServiceURL + "rest/GameModel/status/BIN/count").success(function(data) {
                $translate('PRIVATE-ARCHIVES-COUNT').then(function (message) {
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
                        $translate('COMMONS-SCENARIOS-ARCHIVE-FLASH-SUCCESS').then(function (message) {
                            deferred.resolve(Responses.success(message, scenarioArchived));
                        });
                    } else {
                        $translate('COMMONS-SCENARIOS-ARCHIVE-FLASH-ERROR').then(function (message) {
                            deferred.resolve(Responses.danger(message, false));
                        });
                    }
                });
            } else {
                $translate('COMMONS-SCENARIOS-WRONG-OBJECT-FLASH-ERROR').then(function (message) {
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
                        $translate('COMMONS-SCENARIOS-UNARCHIVE-FLASH-SUCCESS').then(function (message) {
                            deferred.resolve(Responses.success(message, scenarioUnarchived));
                        });
                    } else {
                        $translate('COMMONS-SCENARIOS-UNARCHIVE-FLASH-ERROR').then(function (message) {
                            deferred.resolve(Responses.danger(message, false));
                        });
                    }
                });
            } else {
                $translate('COMMONS-SCENARIOS-WRONG-OBJECT-FLASH-ERROR').then(function (message) {
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
                        $translate('COMMONS-SCENARIOS-SUPPRESSION-FLASH-SUCCESS').then(function (message) {
                            deferred.resolve(Responses.success(message, data));
                        });
                    } else {
                        $translate('COMMONS-SCENARIOS-SUPRESSION-FLASH-ERROR').then(function (message) {
                            deferred.resolve(Responses.danger(message, false));
                        });
                    }
                });
            } else {
                $translate('COMMONS-SCENARIOS-WRONG-OBJECT-FLASH-ERROR').then(function (message) {
                    deferred.resolve(Responses.danger(message, false));
                });
            }
            return deferred.promise;
        };

        /* Clear all scenarios in cache */
        model.clearCache = function() {
            scenarios.cache = [];
        };
    });
