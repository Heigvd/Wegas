angular.module('wegas.models.sessions', [])
    .service('SessionsModel', function($http, $q, $interval, $translate, WegasTranslations, Auth, Responses) {
        /* Namespace for model accessibility. */
        "use strict";
        var model = this,
            ServiceURL = window.ServiceURL,
            sessions = {
                cache: [],
                getPath: function(status) {
                    return ServiceURL + "rest/Lobby/GameModel/Game/status/" + status;
                },
                findSession: function(status, id) {
                    return _.find(sessions.cache[status].data, function(s) {
                        return +s.id === +id;
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
                                deferred.resolve(true);
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
                        if (data.events !== undefined && data.events.length === 0) {
                            sessions.cache[status].data = data.updatedEntities;
                            $translate('COMMONS-SESSIONS-FIND-FLASH-SUCCESS').then(function(message) {
                                deferred.resolve(Responses.success(message, sessions.cache[status]));
                            });
                        } else if (data.events !== undefined) {
                            sessions.cache[status].data = [];
                            console.log("WEGAS LOBBY : Error while loading sessions : ");
                            console.log(Responses.danger(data.events[0].exceptions));
                            $translate('COMMONS-SESSIONS-FIND-FLASH-ERROR').then(function(message) {
                                deferred.resolve(Responses.danger(message, false));
                            });
                        } else {
                            sessions.cache[status].data = [];
                            $translate('COMMONS-SESSIONS-FIND-FLASH-ERROR').then(function(message) {
                                deferred.resolve(Responses.danger(message, false));
                            });
                        }
                    }).error(function(data) {
                        sessions.cache[status].data = [];
                        if (data.events !== undefined && data.events.length > 0) {
                            console.log("WEGAS LOBBY : Error while loading sessions : ");
                            console.log(Responses.danger(data.events[0].exceptions));
                            $translate('COMMONS-SESSIONS-FIND-FLASH-ERROR').then(function(message) {
                                deferred.resolve(Responses.danger(message, false));
                            });
                        } else {
                            $translate('COMMONS-SESSIONS-FIND-FLASH-ERROR').then(function(message) {
                                deferred.resolve(Responses.danger(message, false));
                            });
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
            updateGameLanguages = function(sessionInfos, sessionBeforeChange) {
                var deferred = $q.defer(),
                    newLanguages = sessionInfos.languages,
                    oldLanguages = sessionBeforeChange.gameModel.languages,
                    n = Math.min(newLanguages.length, oldLanguages.length),
                    i, toSave = [];

                for (i = 0; i < n; i++) {
                    if (newLanguages[i].active !== oldLanguages[i].active) {
                        toSave.push(newLanguages[i]);
                    }
                }
                if (toSave.length > 0) {
                    $http.put(ServiceURL + "rest/GameModel/I18n/Langs", toSave).success(function(data) {
                        var i, j;
                        for (i = 0; i < data.length; i++) {
                            for (j = 0; j < sessionBeforeChange.gameModel.languages.length; j++) {
                                if (data[i].id === sessionBeforeChange.gameModel.languages[j].id) {
                                    sessionBeforeChange.gameModel.languages[j].active = data[i].active;
                                }
                            }
                        }
                        deferred.resolve(sessionBeforeChange);
                    }).error(function(WegasException) {
                        deferred.reject(WegasException);
                    });
                } else {
                    deferred.resolve(sessionBeforeChange);
                }
                return deferred.promise;
            },
            updateGameSession = function(sessionInfos, sessionBeforeChange) {
                var deferred = $q.defer(),
                    k, gameToSave = {},
                    gameSetted = false;
                for (k in sessionBeforeChange) {
                    if (sessionBeforeChange.hasOwnProperty(k)) {
                        gameToSave[k] = sessionBeforeChange[k];
                    }
                }

                if (gameToSave.name !== sessionInfos.name) {
                    gameToSave.name = sessionInfos.name;
                    gameSetted = true;
                }
                if (gameToSave.token !== sessionInfos.token) {
                    gameToSave.token = sessionInfos.token;
                    gameSetted = true;
                }
                if (gameSetted) {
                    $http.put(ServiceURL + "rest/GameModel/Game/" + sessionBeforeChange.id, gameToSave).success(function(data) {
                        sessionBeforeChange.name = data.name;
                        sessionBeforeChange.token = data.token;
                        deferred.resolve(sessionBeforeChange);
                    }).error(function(WegasException) {
                        deferred.reject(WegasException);
                    });
                } else {
                    deferred.resolve(sessionBeforeChange);
                }
                return deferred.promise;
            },
            updateGameModelSession = function(sessionInfos, sessionBeforeChange) {
                var deferred = $q.defer(),
                    gameModelSetted = false,
                    scenarioBeforeChange = sessionBeforeChange.gameModel,
                    properties = ["scriptUri", "clientScriptUri", "cssUri", "pagesUri", "logID", "guestAllowed"];
                if (scenarioBeforeChange.properties.freeForAll !== sessionInfos.individual) {
                    sessionBeforeChange.properties.freeForAll = sessionInfos.individual;
                    scenarioBeforeChange.properties.freeForAll = sessionInfos.individual;
                    gameModelSetted = true;
                }
                if (scenarioBeforeChange.comments !== sessionInfos.comments) {
                    scenarioBeforeChange.comments = sessionInfos.comments;
                    gameModelSetted = true;
                }
                _.each(properties, function(el, index) {
                    if (scenarioBeforeChange.properties[el] !== sessionInfos[el]) {
                        scenarioBeforeChange.properties[el] = sessionInfos[el];
                        gameModelSetted = true;
                    }
                });
                if (gameModelSetted) {
                    $http.put(ServiceURL + "rest/Public/GameModel/" + scenarioBeforeChange.id, scenarioBeforeChange).success(function(data) {
                        deferred.resolve(sessionBeforeChange);
                    }).error(function(data) {
                        deferred.resolve(false);
                    });
                } else {
                    deferred.resolve(sessionBeforeChange);
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

        /* Remove team form persistante datas and change cached datas (Used from trainer workspace) */
        model.removeTeamToSession = function(sessionId, teamId) {
            var deferred = $q.defer(),
                session = sessions.findSession("LIVE", sessionId) || sessions.findSession("BIN", sessionId),
                team;
            if (session) {
                team = _.find(session.teams, function(t) {
                    return +t.id === +teamId;
                });
                if (team) {
                    $http.delete(ServiceURL + "rest/GameModel/Game/Team/" + team.id, {
                        "headers": {
                            "managed-mode": "true"
                        }
                    }).success(function(data) {
                        session.teams = _.without(session.teams, team);
                        $translate('COMMONS-SESSIONS-TEAM-REMOVE-FLASH-SUCCESS').then(function(message) {
                            deferred.resolve(Responses.success(message, team));
                        });
                    }).error(function(data) {
                        $translate('COMMONS-SESSIONS-TEAM-REMOVE-FLASH-ERROR').then(function(message) {
                            deferred.resolve(Responses.danger(message, false));
                        });
                    });
                } else {
                    $translate('COMMONS-TEAMS-NO-TEAM-FLASH-ERROR').then(function(message) {
                        deferred.resolve(Responses.danger(message, false));
                    });
                }
            } else {
                $translate('COMMONS-TEAMS-NO-TEAM-FLASH-ERROR').then(function(message) {
                    deferred.resolve(Responses.danger(message, false));
                });
            }
            return deferred.promise;
        };

        /* Remove player form persistante datas and change cached datas (Used from trainer and player workspace) */
        model.removePlayerToSession = function(sessionId, playerId, teamId) {
            var deferred = $q.defer(),
                session = sessions.findSession("LIVE", sessionId) || sessions.findSession("BIN", sessionId),
                team,
                player;
            if (session) {
                team = _.find(session.teams, function(t) {
                    return +t.id === +teamId;
                });
                if (team) {
                    player = _.find(team.players, function(p) {
                        return +p.id === +playerId;
                    });
                    if (player) {
                        $http.delete(ServiceURL + "rest/GameModel/Game/Team/" + player.teamId + "/Player/" + player.id, {
                            "headers": {
                                "managed-mode": "true"
                            }
                        }).success(function(data) {
                            if (team.players.length < 2) {
                                session.teams = _.without(session.teams, team);
                            } else {
                                team.players = _.without(team.players, player);
                            }
                            if (session.properties.freeForAll) {
                                session.players = _.without(session.players, player);
                            }
                            $translate('COMMONS-SESSIONS-PLAYER-REMOVE-FLASH-SUCCESS').then(function(message) {
                                deferred.resolve(Responses.success(message, team));
                            });
                        }).error(function(data) {
                            $translate('COMMONS-SESSIONS-PLAYER-REMOVE-FLASH-ERROR').then(function(message) {
                                deferred.resolve(Responses.danger(message, false));
                            });
                        });
                    } else {
                        $translate('COMMONS-TEAMS-NO-PLAYER-FLASH-ERROR').then(function(message) {
                            deferred.resolve(Responses.danger(message, false));
                        });
                    }
                } else {
                    $translate('COMMONS-TEAMS-NO-TEAM-FLASH-ERROR').then(function(message) {
                        deferred.resolve(Responses.danger(message, false));
                    });
                }
            } else {
                $translate('COMMONS-TEAMS-NO-TEAM-FLASH-ERROR').then(function(message) {
                    deferred.resolve(Responses.danger(message, false));
                });
            }
            return deferred.promise;
        };

        /* Get a session form token, undefined otherwise. */
        model.findSessionToJoin = function(token) {
            var deferred = $q.defer();
            if (!token.match(/^([a-zA-Z0-9_-]|\.(?!\.))*$/)) {
                token = "";
            }
            $http.get(ServiceURL + "rest/Extended/GameModel/Game/FindByToken/" + token, {
                ignoreLoadingBar: true
            }).success(function(data) {
                if (data) {
                    $translate('COMMONS-SESSIONS-GET-FLASH-SUCCESS').then(function(message) {
                        deferred.resolve(Responses.success(message, data));
                    });
                } else {
                    $translate('COMMONS-SESSIONS-GET-FLASH-ERROR').then(function(message) {
                        deferred.resolve(Responses.danger(message, false));
                    });
                }
            }).error(function(data) {
                $translate('COMMONS-SESSIONS-GET-FLASH-ERROR').then(function(message) {
                    deferred.resolve(Responses.danger(message, false));
                });
            });
            return deferred.promise;
        };

        /* Ask for all played sessions. */
        model.getSessions = function(status) {
            var deferred = $q.defer();
            Auth.getAuthenticatedUser().then(function(user) {
                if (user) {
                    if (sessions.cache[status]) {
                        if (sessions.cache[status].loading) {
                            sessions.wait(status).then(function() {
                                $translate('COMMONS-SESSIONS-FIND-FLASH-SUCCESS').then(function(message) {
                                    deferred.resolve(Responses.success(message, sessions.cache[status].data));
                                });
                            });
                        } else {
                            $translate('COMMONS-SESSIONS-FIND-FLASH-SUCCESS').then(function(message) {
                                deferred.resolve(Responses.success(message, sessions.cache[status].data));
                            });
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
                    $translate('COMMONS-AUTH-CURRENT-FLASH-ERROR').then(function(message) {
                        deferred.resolve(Responses.danger(message, false));
                    });
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
                            $translate('COMMONS-SESSIONS-GET-FLASH-SUCCESS').then(function(message) {
                                deferred.resolve(Responses.success(message, session));
                            });
                        } else {
                            $translate('COMMONS-SESSIONS-GET-FLASH-ERROR').then(function(message) {
                                deferred.resolve(Responses.danger(message, false));
                            });
                        }
                    });
                } else {
                    session = sessions.findSession(status, id);
                    if (session) {
                        $translate('COMMONS-SESSIONS-GET-FLASH-SUCCESS').then(function(message) {
                            deferred.resolve(Responses.success(message, session));
                        });
                    } else {
                        $translate('COMMONS-SESSIONS-GET-FLASH-ERROR').then(function(message) {
                            deferred.resolve(Responses.danger(message, false));
                        });
                    }
                }
            } else {
                model.getSessions(status).then(function() {
                    session = sessions.findSession(status, id);
                    if (session) {
                        $translate('COMMONS-SESSIONS-GET-FLASH-SUCCESS').then(function(message) {
                            deferred.resolve(Responses.success(message, session));
                        });
                    } else {
                        $translate('COMMONS-SESSIONS-GET-FLASH-ERROR').then(function(message) {
                            deferred.resolve(Responses.danger(message, false));
                        });
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
                url = "rest/Editor/GameModel/Game/" + sessionToRefresh.id, // Editor view to include teams
                cachedSession = null;
            $http
                .get(ServiceURL + url)
                .success(function(sessionRefreshed) {
                    if (sessionRefreshed && sessionRefreshed.teams) {
                        sessionRefreshed.teams.forEach(function(team) {
                            if (team["@class"] === "DebugTeam") {
                                sessionRefreshed.teams = _.without(sessionRefreshed.teams, team);
                            }
                        });
                    }
                    uncacheSession(status, sessionToRefresh);
                    cacheSession(status, sessionRefreshed);
                    cachedSession = sessions.findSession(status, sessionRefreshed.id);
                    $translate('COMMONS-SESSIONS-REFRESH-SUCCESS').then(function(message) {
                        deferred.resolve(Responses.success(message, cachedSession));
                    });
                }).error(function(data) {
                $translate('COMMONS-SESSIONS-REFRESH-ERROR').then(function(message) {
                    deferred.resolve(Responses.danger(message, false));
                });
            });
            return deferred.promise;
        };

        /* Create a new session. */
        model.createSession = function(sessionName, scenarioId) {
            var deferred = $q.defer();
            Auth.getAuthenticatedUser().then(function(user) {
                if (user !== null) {
                    /* Todo Check Values ? */
                    var newSession = {
                        "@class": "Game",
                        "gameModelId": scenarioId,
                        "access": "OPEN",
                        "name": sessionName
                    };
                    $http.post(ServiceURL + "rest/GameModel/" + newSession.gameModelId + "/Game?view=Lobby", newSession).success(function(data) {
                        cacheSession("LIVE", data);
                        $translate('COMMONS-SESSIONS-CREATE-SUCCESS').then(function(message) {
                            deferred.resolve(Responses.success(message, data));
                        });
                    }).error(function(data) {
                        $translate('COMMONS-SESSIONS-CREATE-ERROR').then(function(message) {
                            deferred.resolve(Responses.danger(message, false));
                        });
                    });
                } else {
                    $translate('COMMONS-AUTH-CURRENT-FLASH-ERROR').then(function(message) {
                        deferred.resolve(Responses.danger(message, false));
                    });
                }
            });
            return deferred.promise;
        };

        /* Edit the session infos (Name, comments, icon, token, individual/team type) */
        model.updateSession = function(session, infosToSet) {
            var deferred = $q.defer();
            if (session && infosToSet) {
                updateGameLanguages(infosToSet, session).then(function(session) {
                    updateGameSession(infosToSet, session).then(function(sessionSetted) {
                        updateGameModelSession(infosToSet, sessionSetted).then(function(sessionSetted2) {
                            if (sessionSetted2) {
                                $translate('COMMONS-SESSIONS-UPDATE-FLASH-SUCCESS').then(function(message) {
                                    deferred.resolve(Responses.success(message, sessionSetted2));
                                });
                            } else {
                                $translate('COMMONS-SESSIONS-UPDATE-FLASH-ERROR').then(function(message) {
                                    deferred.resolve(Responses.danger(message, false));
                                });
                            }
                        });
                    }, function(WegasException) {
                        var message = WegasException.messageId ? $translate.instant(WegasException.messageId) : WegasException.message;
                        deferred.resolve(Responses.danger(message, false));
                    });
                }, function(WegasException) {
                    var message = WegasException.messageId ? $translate.instant(WegasException.messageId) : WegasException.message;
                    deferred.resolve(Responses.danger(message, false));
                });
            } else {
                $translate('COMMONS-SESSIONS-UPDATE-NO-SESSION-FLASH-ERROR').then(function(message) {
                    deferred.resolve(Responses.danger(message, false));
                });
            }
            return deferred.promise;
        };

        /* Update the comment of a session. */
        model.updateAccessSession = function(sessionToSet) {
            var deferred = $q.defer(),
                sessionBeforeChange = sessions.findSession("LIVE", sessionToSet.id);
            if (sessionBeforeChange) {
                if (sessionBeforeChange.access === "OPEN") {
                    sessionBeforeChange.access = "CLOSE";
                } else {
                    sessionBeforeChange.access = "OPEN";
                }
                $http.put(ServiceURL + "rest/GameModel/Game/" + sessionToSet.id, sessionBeforeChange, {
                    ignoreLoadingBar: true
                }).success(function(data) {
                    $translate(
                        'COMMONS-SESSIONS-EDIT-ACCESS-SUCCESS',
                        {
                            access: WegasTranslations.access[sessionBeforeChange.access][$translate.use()]
                        }
                    ).then(function(message) {
                        deferred.resolve(Responses.success(message, data));
                    });
                }).error(function(data) {
                    $translate('COMMONS-SESSIONS-EDIT-ACCESS-ERROR').then(function(message) {
                        deferred.resolve(Responses.danger(message, false));
                    });
                });
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
                        $translate('COMMONS-SESSIONS-ARCHIVE-SUCCESS').then(function(message) {
                            deferred.resolve(Responses.success(message, sessionToArchive));
                        });
                    } else {
                        $translate('COMMONS-SESSIONS-ARCHIVE-ERROR').then(function(message) {
                            deferred.resolve(Responses.danger(message, false));
                        });
                    }
                });
            } else {
                $translate('COMMONS-SESSIONS-WRONG-OBJECT-ERROR').then(function(message) {
                    deferred.resolve(Responses.danger(message, false));
                });
            }
            return deferred.promise;
        };

        /* Edit session status from "BIN" to "LIVE" */
        model.unarchiveSession = function(sessionToUnarchive) {
            var deferred = $q.defer();
            if (sessionToUnarchive["@class"] === "Game") {
                setSessionStatus(sessionToUnarchive.id, "LIVE").then(function(sessionUnarchived) {
                    if (sessionUnarchived) {
                        uncacheSession("BIN", sessionToUnarchive);
                        cacheSession("LIVE", sessionToUnarchive);
                        $translate('COMMONS-SESSIONS-UNARCHIVE-SUCCESS').then(function(message) {
                            deferred.resolve(Responses.success(message, sessionToUnarchive));
                        });
                    } else {
                        $translate('COMMONS-SESSIONS-UNARCHIVE-ERROR').then(function(message) {
                            deferred.resolve(Responses.danger(message, false));
                        });
                    }
                });
            } else {
                $translate('COMMONS-SESSIONS-WRONG-OBJECT-ERROR').then(function(message) {
                    deferred.resolve(Responses.danger(message, false));
                });
            }
            return deferred.promise;
        };

        /* Count all sessions with "BIN" status */
        model.countArchivedSessions = function() {
            var deferred = $q.defer();
            $http.get(ServiceURL + "rest/GameModel/Game/status/BIN/count").success(function(data) {
                $translate('PRIVATE-ARCHIVES-COUNT').then(function(message) {
                    deferred.resolve(Responses.info(message, data));
                });
            });
            return deferred.promise;
        };

        /* Delete an archived session, passing this session in parameter. */
        model.deleteArchivedSession = function(sessionToDelete) {
            var deferred = $q.defer();
            if (sessionToDelete["@class"] === "Game") {
                setSessionStatus(sessionToDelete.id, "DELETE").then(function(data) {
                    if (data) {
                        uncacheSession("BIN", sessionToDelete);
                        $translate('COMMONS-SESSIONS-SUPPRESSION-SUCCESS').then(function(message) {
                            deferred.resolve(Responses.success(message, sessionToDelete));
                        });
                    } else {
                        $translate('COMMONS-SESSIONS-SUPPRESSION-ERROR').then(function(message) {
                            deferred.resolve(Responses.danger(message, false));
                        });
                    }
                });
            } else {
                $translate('COMMONS-SESSIONS-WRONG-OBJECT-ERROR').then(function(message) {
                    deferred.resolve(Responses.danger(message, false));
                });
            }
            return deferred.promise;
        };
    });
