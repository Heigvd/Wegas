angular.module('wegas.models.sessions', [])
    .service('SessionsModel', function($http, $q, $interval, Auth, Responses) {
        /* Namespace for model accessibility. */
        var model = this,
            sessions = {
                cache: [],
                getPath: function(status) {
                    return ServiceURL + "rest/EditorExtended/GameModel/Game/status/" + status;
                },
                findSession: function(status, id) {
                    return _.find(sessions.cache[status].data, function(s) {
                        return s.id == id;
                    });
                },
                stopWaiting: function(waitFunction) {
                    $interval.cancel(waitFunction);
                },
                wait: function(status) {
                    var deferred = $q.defer(),
                        waitSessions = $interval(function() {
                            if (!sessions.cache[status].loading) {
                                sessions.stopWaiting(waitSessions);
                                deferred.resolve(true)
                            }
                        }, 500);
                    return deferred.promise;
                }
            },
            /* Cache all scenarios in a list */
            cacheSessions = function(status) {
                var deferred = $q.defer();
                if (sessions.cache[status]) {
                    $http.get(sessions.getPath(status), {
                        "headers": {
                            "managed-mode": "true"
                        }
                    }).success(function(data) {
                        if (data.events !== undefined && data.events.length == 0) {
                            sessions.cache[status].data = data.entities;
                            deferred.resolve(Responses.success("Sessions loaded", sessions.cache[status]));
                        } else if (data.events !== undefined) {
                            sessions.cache[status].data = [];
                            deferred.resolve(Responses.danger(data.events[0].exceptions[0].message, false));
                        } else {
                            sessions.cache[status].data = [];
                            deferred.resolve(Responses.danger("Whoops...", false));
                        }
                    }).error(function(data) {
                        sessions.cache[status].data = [];
                        if (data.events !== undefined && data.events.length > 0) {
                            deferred.resolve(Responses.danger(data.events[0].exceptions[0].message, false));
                        } else {
                            deferred.resolve(Responses.danger("Whoops...", false));
                        }
                    });
                } else {
                    sessions.cache[status] = [];
                    deferred.resolve(sessions.cache[status]);
                }
                return deferred.promise;
            },

            /* Cache a session, passing the status of the session and the session to add in parameter */
            cacheSession = function(status, sessionToCache) {
                if (status && sessionToCache && sessions.cache[status]) {
                    if (!_.find(sessions.cache[status].data, sessionToCache)) {
                        sessions.cache[status].data.push(sessionToCache);
                    }
                }
            },

            /* Uncache a scenario, passing a scenario list and the scenario to remove in parameter */
            uncacheSession = function(status, sessionToUncache) {
                if (sessions.cache[status]) {
                    if (_.find(sessions.cache[status].data, sessionToUncache)) {
                        sessions.cache[status].data = _.without(sessions.cache[status].data, sessionToUncache);
                    }
                }
            },

            updateGameSession = function(sessionInfos, sessionBeforeChange) {
                var deferred = $q.defer(),
                    gameSetted = false;
                if (sessionBeforeChange.name !== sessionInfos.name) {
                    sessionBeforeChange.name = sessionInfos.name;
                    gameSetted = true;
                }
                if (sessionBeforeChange.token !== sessionInfos.token) {
                    sessionBeforeChange.token = sessionInfos.token;
                    gameSetted = true;
                }
                if (gameSetted) {
                    $http.put(ServiceURL + "rest/GameModel/Game/" + sessionBeforeChange.id, sessionBeforeChange).success(function(data) {
                        deferred.resolve(Responses.success("Game updated", sessionBeforeChange));
                    }).error(function(data) {
                        deferred.resolve(Responses.danger("Error during game update", false));
                    });
                } else {
                    deferred.resolve(Responses.info("Nothing to set in game", sessionBeforeChange));
                }
                return deferred.promise;
            },

            updateGameModelSession = function(sessionInfos, sessionBeforeChange) {
                var deferred = $q.defer(),
                    gameModelSetted = false,
                    scenarioBeforeChange = sessionBeforeChange.gameModel;

                if (scenarioBeforeChange.properties.iconUri !== ("ICON_" + sessionInfos.color + "_" + sessionInfos.icon.key + "_" + sessionInfos.icon.library)) {
                    sessionBeforeChange.properties.iconUri = "ICON_" + sessionInfos.color + "_" + sessionInfos.icon.key + "_" + sessionInfos.icon.library;
                    scenarioBeforeChange.properties.iconUri = "ICON_" + sessionInfos.color + "_" + sessionInfos.icon.key + "_" + sessionInfos.icon.library;
                    gameModelSetted = true;
                }
                if (scenarioBeforeChange.properties.freeForAll !== sessionInfos.individual) {
                    sessionBeforeChange.properties.freeForAll = sessionInfos.individual;
                    scenarioBeforeChange.properties.freeForAll = sessionInfos.individual;
                    gameModelSetted = true;
                }
                if (scenarioBeforeChange.comments !== sessionInfos.comments) {
                    scenarioBeforeChange.comments = sessionInfos.comments;
                    gameModelSetted = true;
                }
                if (scenarioBeforeChange.properties.scriptUri !== sessionInfos.scriptUri) {
                    scenarioBeforeChange.properties.scriptUri = sessionInfos.scriptUri;
                    gameModelSetted = true;
                }
                if (scenarioBeforeChange.properties.clientScriptUri !== sessionInfos.clientScriptUri) {
                    scenarioBeforeChange.properties.clientScriptUri = sessionInfos.clientScriptUri;
                    gameModelSetted = true;
                }
                if (scenarioBeforeChange.properties.cssUri !== sessionInfos.cssUri) {
                    scenarioBeforeChange.properties.cssUri = sessionInfos.cssUri;
                    gameModelSetted = true;
                }
                if (scenarioBeforeChange.properties.pagesUri !== sessionInfos.pagesUri) {
                    scenarioBeforeChange.properties.pagesUri = sessionInfos.pagesUri;
                    gameModelSetted = true;
                }
                if (scenarioBeforeChange.properties.logID !== sessionInfos.logID) {
                    scenarioBeforeChange.properties.logID = sessionInfos.logID;
                    gameModelSetted = true;
                }
                if (gameModelSetted) {
                    $http.put(ServiceURL + "rest/Public/GameModel/" + scenarioBeforeChange.id, scenarioBeforeChange).success(function(data) {
                        deferred.resolve(Responses.success("GameModel updated", data));
                    }).error(function(data) {
                        deferred.resolve(Responses.danger("Error during gameModel update", false));
                    });
                } else {
                    deferred.resolve(Responses.info("Nothing to set in gameModel", scenarioBeforeChange));
                }
                return deferred.promise;
            },

            /* Update status of session (OPENED, LIVE, BIN, DELETE, SUPPRESSED) */
            setSessionStatus = function(sessionId, status) {
                var deferred = $q.defer();
                $http.put(ServiceURL + "rest/GameModel/Game/" + sessionId + "/status/" + status).success(function(data) {
                    deferred.resolve(data);
                }).error(function(data) {
                    deferred.resolve(false);
                });
                return deferred.promise;
            };


        /* Remove player form persistante datas and change cached datas (Used from trainer and player workspace) */
        model.removePlayerToSession = function(sessionId, playerId, teamId) {
            var deferred = $q.defer();
            session = sessions.findSession("LIVE", sessionId) || sessions.findSession("BIN", sessionId),
            team = undefined,
            player = undefined;
            if (session) {
                team = _.find(session.teams, function(t) {
                    return t.id == teamId;
                });
                if (team) {
                    player = _.find(team.players, function(p) {
                        return p.id == playerId;
                    });
                    if (player) {
                        $http.delete(ServiceURL + "rest/GameModel/Game/Team/" + player.teamId + "/Player/" + player.id).success(function(data) {
                            if(team.players.length < 2){
                                session.teams = _.without(session.teams, team);
                            }else{
                                team.players = _.without(team.players, player);
                            }
                            if(session.properties.freeForAll){
                                session.players = _.without(session.players, player);
                            }
                            deferred.resolve(Responses.success("Player has been removed from the session", player));
                        }).error(function(data) {
                            deferred.resolve(Responses.danger("Error during removing player of session", false));
                        });
                    } else {
                        deferred.resolve(Responses.danger("No player found", false));
                    }
                } else {
                    deferred.resolve(Responses.danger("No team found", false));
                }
            } else {
                deferred.resolve(Responses.danger("No team found", false));
            }
            return deferred.promise;
        };

        /* Get a session form token, undefined otherwise. */
        model.findSessionToJoin = function(token) {
            var deferred = $q.defer();
            $http.get(ServiceURL + "rest/GameModel/Game/FindByToken/" + token, {
                ignoreLoadingBar: true
            }).success(function(data) {
                if (data) {
                    deferred.resolve(Responses.success("Session find", data));
                } else {
                    deferred.resolve(Responses.danger("No Session find", false));
                }
            }).error(function(data) {
                deferred.resolve(Responses.danger("No session find", false));
            });
            return deferred.promise;
        };

        /* Ask for all played sessions. */
        model.getSessions = function(status) {
            var deferred = $q.defer();
            Auth.getAuthenticatedUser().then(function(user) {
                if (user != null) {
                    if (sessions.cache[status]) {
                        if (sessions.cache[status].loading) {
                            sessions.wait(status).then(function() {
                                deferred.resolve(Responses.success("Sessions find", sessions.cache[status].data));
                            });
                        } else {
                            deferred.resolve(Responses.success("Sessions find", sessions.cache[status].data));
                        }
                    } else {
                        sessions.cache[status] = {
                            data: null,
                            loading: true
                        };
                        cacheSessions(status).then(function(response) {
                            sessions.cache[status].loading = false;
                            deferred.resolve(Responses.success(response.message, sessions.cache[status].data));
                        });
                    }
                } else {
                    deferred.resolve(Responses.danger("You need to be logged", false));
                }
            });
            return deferred.promise;
        };

        /* Ask for one session. */
        model.getSession = function(status, id) {
            var deferred = $q.defer(),
                session = null;
            if (sessions.cache[status]) {
                if (sessions.cache[status].loading) {
                    sessions.wait(status).then(function() {
                        session = sessions.findSession(status, id);
                        if (session) {
                            deferred.resolve(Responses.success("Session find", session));
                        } else {
                            deferred.resolve(Responses.danger("No session find", false));
                        }
                    });
                } else {
                    session = sessions.findSession(status, id);
                    if (session) {
                        deferred.resolve(Responses.success("Session find", session));
                    } else {
                        deferred.resolve(Responses.danger("No session find", false));
                    }
                }
            } else {
                model.getSessions(status).then(function() {
                    session = sessions.findSession(status, id);
                    if (session) {
                        deferred.resolve(Responses.success("Session find", session));
                    } else {
                        deferred.resolve(Responses.danger("No session find", false));
                    }
                });
            }
            return deferred.promise;
        };

        model.clearCache = function() {
            sessions.cache = [];
        };

        /* Call the backend for new session values */
        model.refreshSession = function(status, sessionToRefresh) {
            var deferred = $q.defer(),
                url = "rest/GameModel/Game/" + sessionToRefresh.id + "?view=EditorExtended",
                cachedSession = null;
            $http
                .get(ServiceURL + url)
                .success(function(sessionRefreshed) {
                    uncacheSession(status, sessionToRefresh);
                    cacheSession(status, sessionRefreshed);
                    cachedSession = sessions.findSession(status, sessionRefreshed.id);
                    deferred.resolve(Responses.success("Session refreshed", cachedSession));
                }).error(function(data) {
                    deferred.resolve(Responses.danger("Whoops", false));
                });
            return deferred.promise;
        };

        /* Create a new session. */
        model.createSession = function(sessionName, scenarioId) {
            var deferred = $q.defer();
            Auth.getAuthenticatedUser().then(function(user) {
                if (user != null) {
                    /* Todo Check Values ? */
                    var newSession = {
                        "@class": "Game",
                        "gameModelId": scenarioId,
                        "access": "CLOSE",
                        "name": sessionName
                    };
                    $http.post(ServiceURL + "rest/GameModel/" + newSession.gameModelId + "/Game?view=EditorExtended", newSession).success(function(data) {
                        cacheSession("LIVE", data)
                        deferred.resolve(Responses.success("Session created", data));
                    }).error(function(data) {
                        deferred.resolve(Responses.danger("Error during session creation", data));
                    });
                } else {
                    deferred.resolve(Responses.danger("No user authenticate", false));
                }
            });
            return deferred.promise;
        };
        /* Edit the session infos (Name, comments, icon, token, individual/team type) */
        model.updateSession = function(session, infosToSet) {
            var deferred = $q.defer();
            if (session && infosToSet) {
                updateGameSession(infosToSet, session).then(function(responseGame) {
                    if (!responseGame.isErroneous()) {
                        updateGameModelSession(infosToSet, responseGame.data).then(function(responseGameModel) {
                            if (!responseGameModel.isErroneous()) {
                                deferred.resolve(Responses.success("Session up-to-date", responseGameModel.data));
                            } else {
                                deferred.resolve(responseGameModel);
                            }
                        });
                    } else {
                        deferred.resolve(responseGame);
                    }
                });
            } else {
                deferred.resolve(Responses.danger("No session to update", false));
            }
            return deferred.promise;
        };

        /* Update the comment of a session. */
        model.updateAccessSession = function(sessionToSet) {
            var deferred = $q.defer(),
                message = "Error during session name update",
                sessionBeforeChange = sessions.findSession("LIVE", sessionToSet.id);
            if (sessionBeforeChange != undefined) {
                if (sessionBeforeChange.access == "OPEN") {
                    sessionBeforeChange.access = "CLOSE";
                    message = "Session close";
                } else {
                    sessionBeforeChange.access = "OPEN";
                    message = "Session open";
                }
                $http.put(ServiceURL + "rest/GameModel/Game/" + sessionToSet.id, sessionBeforeChange, {
                    ignoreLoadingBar: true
                }).success(function(data) {
                    deferred.resolve(Responses.success(message, data));
                }).error(function(data) {
                    deferred.resolve(Responses.danger(message, false));
                });
            }
            return deferred.promise;
        };

        /* Add a new trainer to the session */
        model.addTrainerToSession = function(session, trainer) {
            var deferred = $q.defer();
            if (session) {
                var alreadyIn = false;
                session.trainers.forEach(function(elem) {
                    if (elem.id == trainer.id) {
                        alreadyIn = true;
                    }
                });
                if (!alreadyIn) {
                    $http.post(ServiceURL + "rest/Extended/User/addAccountPermission/Game:View,Edit:g" + session.id + "/" + trainer.id).success(function(data) {
                        session.trainers.push(trainer);
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
        model.removeTrainerToSession = function(session, trainerId) {
            var deferred = $q.defer();
            if (session) {
                trainer = _.find(session.trainers, function(t) {
                    return t.id == trainerId;
                });
                if (trainer) {
                    $http.delete(ServiceURL + "rest/Extended/User/DeleteAccountPermissionByInstanceAndAccount/g" + session.id + "/" + trainer.id).success(function(data) {
                        session.trainers = _.without(session.trainers, trainer);
                        deferred.resolve(Responses.success("Trainer removed", trainer));
                    }).error(function(data) {
                        deferred.resolve(Responses.danger("You can not remove this trainer", data));
                    });
                }
            } else {
                deferred.resolve(Response.danger("No access to this session", false));
            }
            return deferred.promise;
        };

        /* Edit session status from "LIVE" to "BIN" */
        model.archiveSession = function(sessionToArchive) {
            var deferred = $q.defer();
            if (sessionToArchive["@class"] === "Game") {
                setSessionStatus(sessionToArchive.id, "BIN").then(function(sessionArchived) {
                    if (sessionArchived) {
                        uncacheSession("LIVE", sessionToArchive);
                        cacheSession("BIN", sessionToArchive);
                        deferred.resolve(Responses.success("Session archived", sessionToArchive));
                    } else {
                        deferred.resolve(Responses.danger("Error during session archivage", false));
                    }
                });
            } else {
                deferred.resolve(Responses.danger("This is not a session", false));
            }
            return deferred.promise;
        }

        /* Edit session status from "BIN" to "LIVE" */
        model.unarchiveSession = function(sessionToUnarchive) {
            var deferred = $q.defer();
            if (sessionToUnarchive["@class"] === "Game") {
                setSessionStatus(sessionToUnarchive.id, "LIVE").then(function(sessionUnarchived) {
                    if (sessionUnarchived) {
                        uncacheSession("BIN", sessionToUnarchive);
                        cacheSession("LIVE", sessionToUnarchive);
                        deferred.resolve(Responses.success("Session unarchived", sessionToUnarchive));
                    } else {
                        deferred.resolve(Responses.danger("Error during session unsarchivage", false));
                    }
                });
            } else {
                deferred.resolve(Responses.danger("This is not a session", false));
            }
            return deferred.promise;
        }

        /* Count all sessions with "BIN" status */
        model.countArchivedSessions = function() {
            var deferred = $q.defer();
            $http.get(ServiceURL + "rest/GameModel/Game/status/BIN/count").success(function(data) {
                deferred.resolve(Responses.success("Number of archived sessions", data));
            });
            return deferred.promise;
        }

        /* Delete an archived session, passing this session in parameter. */
        model.deleteArchivedSession = function(sessionToDelete) {
            var deferred = $q.defer();
            if (sessionToDelete["@class"] === "Game") {
                setSessionStatus(sessionToDelete.id, "DELETE").then(function(data) {
                    if (data) {
                        uncacheSession("BIN", sessionToDelete);
                        deferred.resolve(Responses.success("Session suppressed", sessionToDelete));
                    } else {
                        deferred.resolve(Responses.danger("Error during session suppression", false));
                    }
                });
            } else {
                deferred.resolve(Responses.danger("This is not a session", false));
            }
            return deferred.promise;
        }
    });