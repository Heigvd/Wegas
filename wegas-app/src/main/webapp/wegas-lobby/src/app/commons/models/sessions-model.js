angular.module('wegas.models.sessions', [])
    .service('SessionsModel', function($http, $q, $interval, Auth, Responses) {
        /* Namespace for model accessibility. */
        var model = this,

            /* Paths to access to each type of sessions */
            paths = {
                managed: function() {
                    var deferred = $q.defer();
                    deferred.resolve(ServiceURL + "rest/GameModel/Game?view=EditorExtended");
                    return deferred.promise;
                },
                played: function() {
                    var deferred = $q.defer();
                    Auth.getAuthenticatedUser().then(function(user) {
                        deferred.resolve(ServiceURL + "rest/RegisteredGames/" + user.id);
                    });
                    return deferred.promise;
                },
                archived: function() {
                    var deferred = $q.defer();
                    deferred.resolve(ServiceURL + "rest/GameModel/Game/status/BIN?view=EditorExtended");
                    return deferred.promise;
                }
            },

            /* Cache for data */
            sessions = {
                cache: [],
                findSession: function(sessionsListName, id, withTrainers) {
                    var deferred = $q.defer();
                    if (sessions.cache[sessionsListName]) {
                        if (withTrainers) {
                            cacheTrainersToSession(sessionsListName, id).then(function(session) {
                                if (session) {
                                    deferred.resolve(session);
                                } else {
                                    deferred.resolve(undefined);
                                }
                            });
                        } else {
                            deferred.resolve(_.find(sessions.cache[sessionsListName].data, function(s) {
                                return s.id == id;
                            }));
                        }
                    } else {
                        deferred.resolve(undefined);
                    }
                    return deferred.promise;
                },
                stopWaiting: function(waitFunction) {
                    $interval.cancel(waitFunction);
                },
                wait: function(sessionsListName) {
                    var deferred = $q.defer(),
                        waitSessions = $interval(function() {
                            if (!sessions.cache[sessionsListName].loading) {
                                sessions.stopWaiting(waitSessions);
                                deferred.resolve(true)
                            }
                        }, 500);
                    return deferred.promise;
                }
            },

            /*  ---------------------------------
    PRIVATE FUNCTIONS
    --------------------------------- */

            /* Format players in a list, individualy or grouped by team. */
            formatPlayers = function(session) {
                if (!session.properties.freeForAll) {
                    var teams = session.teams;
                    teams.forEach(function(team) {
                        if (team["@class"] == "DebugTeam") {
                            session.teams = _.without(session.teams, _.findWhere(session.teams, {
                                id: team.id
                            }));
                        }
                    });
                } else {
                    var teams = session.teams,
                        players = [];
                    teams.forEach(function(team) {
                        if (team["@class"] != "DebugTeam") {
                            team.players.forEach(function(player) {
                                players.push(player);
                            });
                        }
                    });
                    session.players = players;
                    delete session.teams;
                }
                return session;
            },

            /* Cache all sessions in a list */
            cacheSessions = function(sessionsListName) {
                var deferred = $q.defer();
                if (sessions.cache[sessionsListName] && paths[sessionsListName]) {
                    paths[sessionsListName]().then(function(path) {
                        $http.get(path).success(function(data) {
                            data.forEach(function(session) {
                                session = formatPlayers(session);
                            });
                            sessions.cache[sessionsListName].data = data;
                            deferred.resolve(sessions.cache[sessionsListName]);
                        }).error(function(data) {
                            sessions.cache[sessionsListName].data = [];
                            deferred.resolve(sessions.cache[sessionsListName]);
                        });
                    });
                } else {
                    sessions.cache[sessionsListName] = [];
                    deferred.resolve(sessions.cache[sessionsListName]);
                }
                return deferred.promise;
            },

            /* Cache a session, passing a session list and the session to add in parameter */
            cacheSession = function(sessionList, session, alreadyFormatted) {
                if (sessionList && session) {
                    if (!alreadyFormatted) {
                        session = formatPlayers(session);
                    }
                    if (!_.find(sessionList, session)) {
                        sessionList.push(session);
                    }
                }
                return sessionList;
            },

            /* Uncache a session, passing a session list and the session to remove in parameter */
            uncacheSession = function(sessionList, session) {
                var sessionToUncache = _.find(sessionList, session);
                if (sessionToUncache) {
                    sessionList = _.without(sessionList, session);
                }
                return sessionList;
            },

            /* Add trainers to a session in cache. */
            cacheTrainersToSession = function(sessionsListName, id) {
                var deferred = $q.defer();
                sessions.findSession(sessionsListName, id).then(function(session) {
                    if (session) {
                        $http.get(ServiceURL + "rest/Extended/User/FindAccountPermissionByInstance/g" + session.id).success(function(data) {
                            session.trainers = [];

                            _(data).each(function(account, i) {
                                var permissions = [],
                                    pattern = new RegExp("^Game:(.*):g" + id + "$");

                                // For each permission of each account...
                                _(account.permissions).each(function(permission, j) {
                                    // Is permission linked with current game ?
                                    if (pattern.test(permission.value)) {
                                        var localPermission = permission.value.match(pattern)[1].split(",");
                                        permissions = permissions.merge(localPermission)
                                    }
                                });
                                if (permissions.indexOf("View") >= 0 && permissions.indexOf("Edit") >= 0) {
                                    session.trainers.push(account);
                                }
                            });
                            // session.trainers = data;
                            deferred.resolve(session);
                        }).error(function(data) {
                            deferred.resolve(false);
                        });
                    } else {
                        deferred.resolve(false);
                    }
                });
                return deferred.promise;
            },

            /* Cache a player in a cached session */
            cachePlayer = function(session, player) {
                if (session && player) {
                    if (!session.properties.freeForAll) {
                        var team = _.find(session.teams, function(t) {
                            return t.id == player.teamId
                        });
                        if (team) {
                            team.players.push(player);
                        }
                    } else {
                        session.players.push(player);
                    }
                }
                return session;
            },

            /* Uncache a player or a team from a cached session  */
            uncachePlayer = function(session, player) {
                if (session && player) {
                    if (!session.properties.freeForAll) {
                        var team = _.find(session.teams, function(t) {
                            return t.id == player.teamId
                        });
                        if (team) {
                            if (team.players.length < 2) {
                                session.teams = _.without(session.teams, team);
                            } else {
                                team.players = _.without(team.players, player);
                            }
                        }
                    } else {
                        if (_.find(session.players, player)) {
                            session.players = _.without(session.players, player);
                        }
                    }
                }
                return session;
            },

            /* Cache a team in a cached session */
            cacheTeam = function(session, team) {
                if (session && team) {
                    if (!session.properties.freeForAll) {
                        session.teams.push(team)
                    }
                }
                return session;
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
            },

            /* Remove player from persistante datas */
            removePlayer = function(player) {
                var deferred = $q.defer();
                if (player.teamId && player.id) {
                    $http.delete(ServiceURL + "rest/GameModel/Game/Team/" + player.teamId + "/Player/" + player.id).success(function(data) {
                        deferred.resolve(player);
                    }).error(function(data) {
                        deferred.resolve(false);
                    });
                } else {
                    deferred.resolve(false);
                }
                return deferred.promise;
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

                if (scenarioBeforeChange.properties.iconUri !== ("ICON_" + sessionInfos.color + "_" + sessionInfos.icon)) {
                    sessionBeforeChange.properties.iconUri = "ICON_" + sessionInfos.color + "_" + sessionInfos.icon;
                    scenarioBeforeChange.properties.iconUri = "ICON_" + sessionInfos.color + "_" + sessionInfos.icon;
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
            };

        /*  ---------------------------------
    COMMON SERVICES
    --------------------------------- */

        /* Ask for all played sessions. */
        model.getSessions = function(sessionsListName) {
            var random = Math.random();
            var deferred = $q.defer();
            Auth.getAuthenticatedUser().then(function(user) {
                if (user != null) {
                    if (sessions.cache[sessionsListName]) {
                        if (sessions.cache[sessionsListName].loading) {
                            sessions.wait(sessionsListName).then(function() {
                                deferred.resolve(Responses.success("Sessions find", sessions.cache[sessionsListName].data));
                            });
                        } else {
                            deferred.resolve(Responses.success("Sessions find", sessions.cache[sessionsListName].data));
                        }
                    } else {
                        sessions.cache[sessionsListName] = {
                            data: null,
                            loading: true
                        };
                        cacheSessions(sessionsListName).then(function() {
                            sessions.cache[sessionsListName].loading = false;
                            deferred.resolve(Responses.success("Sessions find", sessions.cache[sessionsListName].data));
                        });
                    }
                } else {
                    deferred.resolve(Responses.danger("You need to be logged", false));
                }
            });
            return deferred.promise;
        };

        /* Ask for one managed session. */
        model.getSession = function(sessionsListName, id, withTrainers) {
            var deferred = $q.defer();
            if (sessions.cache[sessionsListName]) {
                if (sessions.cache[sessionsListName].loading) {
                    sessions.wait(sessionsListName).then(function() {
                        sessions.findSession(sessionsListName, id, withTrainers).then(function(session) {
                            if (session) {
                                deferred.resolve(Responses.success("Session find", session));
                            } else {
                                deferred.resolve(Responses.danger("No session find", false));
                            }
                        });;
                    });
                } else {
                    sessions.findSession(sessionsListName, id, withTrainers).then(function(session) {
                        if (session) {
                            deferred.resolve(Responses.success("Session find", session));
                        } else {
                            deferred.resolve(Responses.danger("No session find", false));
                        }
                    });
                }
            } else {
                model.getSessions(sessionsListName).then(function() {
                    sessions.findSession(sessionsListName, id, withTrainers).then(function(session) {
                        if (session) {
                            deferred.resolve(Responses.success("Session find", session));
                        } else {
                            deferred.resolve(Responses.danger("No session find", false));
                        }
                    });
                });
            }
            return deferred.promise;
        };

        /* Clear cache of all list sessions. */
        model.clearCache = function() {
            sessions.cache = [];
        };

        model.refreshSession = function(listname, session) {
            var deferred = $q.defer();

            var url = "rest/GameModel/Game/" + session.id + "?view=EditorExtended";
            $http
                .get(ServiceURL + url)
                .success(function(data) {
                    // Removing old session
                    sessions.cache[listname].data = uncacheSession(sessions.cache[listname].data, session);
                    // Creating new one
                    sessions.cache[listname].data = cacheSession(sessions.cache[listname].data, data, false);

                    sessions.findSession(listname, data.id, true).then(function(response) {
                        deferred.resolve(Responses.success("Session refreshed", response));
                    });

                }).error(function(data) {
                    deferred.resolve(Responses.danger("Whoops", false));
                });
            return deferred.promise;
        };

        /* Remove player form persistante datas and change cached datas (Used from trainer and player workspace) */
        model.removePlayerToSession = function(sessionId, playerId, teamId) {
            var deferred = $q.defer();
            sessions.findSession("managed", sessionId).then(function(managedSession) {
                sessions.findSession("played", sessionId).then(function(playedSession) {
                    var session = managedSession || playedSession,
                        team = undefined,
                        player = undefined;
                    if (session) {
                        if (!session.properties.freeForAll) {
                            team = _.find(session.teams, function(t) {
                                return t.id == teamId;
                            });
                            if (team) {
                                player = _.find(team.players, function(p) {
                                    return p.id == playerId;
                                });
                                if (player) {
                                    removePlayer(player).then(function(leavingPlayer) {
                                        if (leavingPlayer) {
                                            managedSession = managedSession ? uncachePlayer(managedSession, leavingPlayer) : managedSession;
                                            sessions.cache.played.data = playedSession ? uncacheSession(sessions.cache.played.data, playedSession) : sessions.cache.played.data;
                                            deferred.resolve(Responses.success("Player has leaved the session", leavingPlayer));
                                        } else {
                                            deferred.resolve(Responses.danger("Error during player leaving session", false));
                                        }
                                    });
                                } else {
                                    deferred.resolve(Responses.danger("No player found", false));
                                }
                            } else {
                                deferred.resolve(Responses.danger("No team found", false));
                            }
                        } else {
                            player = _.find(session.players, function(p) {
                                return p.id == playerId;
                            });
                            if (player) {
                                removePlayer(player).then(function(leavingPlayer) {
                                    if (leavingPlayer) {
                                        managedSession = managedSession ? uncachePlayer(managedSession, leavingPlayer) : managedSession;
                                        sessions.cache.played.data = playedSession ? uncacheSession(sessions.cache.played.data, playedSession) : sessions.cache.played.data;
                                        deferred.resolve(Responses.success("Player has leaved the session", leavingPlayer));

                                    } else {
                                        deferred.resolve(Responses.danger("Error during player leaving session", false));
                                    }
                                });
                            } else {
                                deferred.resolve(Responses.danger("No player found", false));
                            }
                        }
                    } else {
                        deferred.resolve(Responses.danger("You have no accesss to this session", false));
                    }
                });
            });

            return deferred.promise;
        };

        /*  ---------------------------------
    SESSIONS SERVICES - TRAINER SIDE
    --------------------------------- */

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
                        sessions.cache.managed.data = cacheSession(sessions.cache.managed.data, data)
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

        model.updateSession = function(id, infosToSet) {
            var deferred = $q.defer(),
                checkToken = /^[A-Za-z0-9\-]+$/;
            if (id && infosToSet) {
                sessions.findSession("managed", id).then(function(sessionBeforeChange) {
                    if (sessionBeforeChange) {
                        if (infosToSet.token.match(checkToken)) {
                            updateGameSession(infosToSet, sessionBeforeChange).then(function(responseGame) {
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
                            deferred.resolve(Responses.danger("Invalid character in token, only alphanumeric character allowed.", false));
                        }
                    } else {
                        deferred.resolve(Responses.danger("No session to update", false));
                    }
                });
            } else {
                deferred.resolve(Responses.danger("No session to update", false));
            }
            return deferred.promise;
        };

        /* Update a name of a session. */
        model.updateNameSession = function(sessionToSet) {
            var deferred = $q.defer();
            sessions.findSession("managed", sessionToSet.id).then(function(sessionBeforeChange) {
                if (sessionBeforeChange) {
                    sessionBeforeChange.name = sessionToSet.name;
                    $http.put(ServiceURL + "rest/GameModel/Game/" + sessionToSet.id, sessionBeforeChange).success(function(data) {
                        deferred.resolve(Responses.success("Session name updated", data));
                    }).error(function(data) {
                        deferred.resolve(Responses.danger("Error during session name update", false));
                    });
                }
            });
            return deferred.promise;
        };

        /* Update the comment of a session. */
        model.updateCommentsSession = function(sessionToSet) {
            var deferred = $q.defer();
            sessions.findSession("managed", sessionToSet.id).then(function(sessionBeforeChange) {
                if (sessionBeforeChange != undefined) {
                    scenarioBeforeChange = sessionBeforeChange.gameModel;
                    scenarioBeforeChange.comments = sessionToSet.comments;
                    $http.put(ServiceURL + "rest/Public/GameModel/" + scenarioBeforeChange.id, scenarioBeforeChange).success(function(data) {
                        deferred.resolve(Responses.success("Session comments updated", data));
                    }).error(function(data) {
                        deferred.resolve(Responses.danger("Error during session comments update", false));
                    });
                }
            });
            return deferred.promise;
        };

        /* Update the comment of a session. */
        model.updateAccessSession = function(sessionToSet) {
            var deferred = $q.defer(),
                message = "Error during session name update";
            sessions.findSession("managed", sessionToSet.id).then(function(sessionBeforeChange) {
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
            });
            return deferred.promise;
        };

        /* Add a new trainer to the session */
        model.addTrainerToSession = function(sessionId, trainer) {
            var deferred = $q.defer();
            sessions.findSession("managed", sessionId).then(function(session) {
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
            });
            return deferred.promise;
        };

        /* Remove a trainer from a session in cached sessions et persistant datas */
        model.removeTrainerToSession = function(sessionId, trainerId) {
            var deferred = $q.defer();
            sessions.findSession("managed", sessionId).then(function(session) {
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
                    deferred.resolve(Response.danger("You have no accesss to this session", false));
                }
            });
            return deferred.promise;
        };

        /*  ---------------------------------
            SESSIONS SERVICES - PLAYER SIDE
            --------------------------------- */

        /* Get a session form token, undefined otherwise. */
        model.findSessionToJoin = function(token) {
            var deferred = $q.defer();
            $http.get(ServiceURL + "rest/GameModel/Game/FindByToken/" + token, {
                ignoreLoadingBar: true
            }).success(function(data) {
                if (data) {
                    data = formatPlayers(data)
                    deferred.resolve(Responses.success("Session find", data));
                } else {
                    deferred.resolve(Responses.danger("No Session find", false));
                }
            }).error(function(data) {
                deferred.resolve(Responses.danger("No session find", false));
            });
            return deferred.promise;
        };

        /* Join an individual session for current player */
        model.joinIndividualSession = function(token) {
            var deferred = $q.defer();
            Auth.getAuthenticatedUser().then(function(user) {
                if (user != null) {
                    var cachedSession = null;
                    if(!sessions.cache.played){
                        sessions.cache.played = {
                            data: [],
                            loading: false
                        };
                    }else{
                        cachedSession = _.find(sessions.cache.played.data, function(s) {
                            return s.token == token;
                        });
                    }
                    if (cachedSession) {
                        deferred.resolve(Responses.info("You have already join this session", false));
                    } else {
                        $http.get(ServiceURL + "rest/GameModel/Game/JoinGame/" + token + "?view=Extended").success(function(data) {
                            var team = _.find(data[1].teams, function(t) {
                                return t.id == data[0].id;
                            });
                            if (team) {
                                var player = _.find(team.players, function(p) {
                                    return (p.userId == null && p.teamId == null);
                                });
                                if (player) {
                                    player.teamId = data[0].id;
                                    player.userId = user.id;
                                    sessions.cache.played.data = cacheSession(sessions.cache.played.data, data[1]);
                                    if (user.isTrainer) {
                                        sessions.findSession("managed", data[1].id).then(function(managedSession) {
                                            if (managedSession) {
                                                managedSession = cachePlayer(managedSession, player);
                                            }
                                            deferred.resolve(Responses.success("You have join the session", data[1]));
                                        });
                                    } else {
                                        deferred.resolve(Responses.success("You have join the session", data[1]));
                                    }
                                } else {
                                    deferred.resolve(Responses.danger("Error during creating player", false));
                                }
                            } else {
                                deferred.resolve(Responses.danger("Error during creating solo-team", false));
                            }
                        }).error(function(data) {
                            deferred.resolve(Responses.danger("Error during joining session", false));
                        });
                    }
                } else {
                    deferred.resolve(Responses.danger("You need to be logged", false));
                }
            });
            return deferred.promise;
        }

        /* Join a team for current player */
        model.joinTeam = function(sessionId, teamId) {
            var deferred = $q.defer();
            Auth.getAuthenticatedUser().then(function(user) {
                if (user != null) {
                    sessions.findSession("played", sessionId).then(function(cachedSession) {
                        if (cachedSession) {
                            deferred.resolve(Responses.info("You have already join this session", false));
                        } else {
                            $http.get(ServiceURL + "rest/GameModel/Game/JoinTeam/" + teamId).success(function(session) {
                                var team = _.find(session.teams, function(t) {
                                    return t.id == teamId;
                                });
                                if (team) {
                                    var player = _.find(team.players, function(p) {
                                        return (p.teamId == null && p.userId == null);
                                    });
                                    if (player) {
                                        player.teamId = teamId;
                                        player.userId = user.id;
                                        sessions.cache.played.data = cacheSession(sessions.cache.played.data, session, true);
                                        if (user.isTrainer || user.isScenarist || user.isAdmin) {
                                            sessions.findSession("managed", session.id).then(function(managedSession) {
                                                if (managedSession) {
                                                    managedSession = cachePlayer(managedSession, player);
                                                }
                                                deferred.resolve(Responses.success("You have join the session", session));
                                            });
                                        } else {
                                            deferred.resolve(Responses.success("You have join the session", session));
                                        }
                                    } else {
                                        deferred.resolve(Responses.danger("Error during creating player", false));
                                    }
                                } else {
                                    deferred.resolve(Responses.danger("Error during joining team", false));
                                }
                            }).error(function(data) {
                                deferred.resolve(Responses.danger("Error during joining session", false));
                            });
                        }
                    });
                } else {
                    deferred.resolve(Responses.danger("You need to be logged", false));
                }
            });
            return deferred.promise;
        };

        /* Join a team for current player */
        model.createTeam = function(session, teamName) {
            var deferred = $q.defer(),
                newTeam = {
                    "@class": "Team",
                    "gameId": session.id,
                    "name": "",
                    "players": []
                };
            Auth.getAuthenticatedUser().then(function(u) {
                if (u != null) {
                    if (session.access == "OPEN") {
                        sessions.findSession("played", session.id).then(function(cachedSession) {
                            if (cachedSession) {
                                deferred.resolve(Responses.info("You have already join this session", false));
                            } else {
                                newTeam.name = teamName;
                                $http.post(ServiceURL + "rest/GameModel/Game/" + session.id + "/Team", newTeam).success(function(team) {
                                    session = cacheTeam(session, team);
                                    if (u.isTrainer || u.isScenarist || u.isAdmin) {
                                        sessions.findSession("managed", session.id).then(function(managedSession) {
                                            if (managedSession) {
                                                managedSession = cacheTeam(managedSession, team);
                                            }
                                            deferred.resolve(Responses.success("Team created", team));
                                        });
                                    } else {
                                        deferred.resolve(Responses.success("Team created", team));
                                    }
                                }).error(function(data) {
                                    deferred.resolve(Responses.danger("Error during team creation", false));
                                });
                            }
                        });
                    } else {
                        deferred.resolve(Responses.danger("Session is closed", false));
                    }
                } else {
                    deferred.resolve(Responses.danger("You need to be logged", false));
                }
            });
            return deferred.promise;
        };

        /* Leave a session for current player */
        model.leaveSession = function(sessionId) {
            var deferred = $q.defer(),
                player = undefined;
            Auth.getAuthenticatedUser().then(function(u) {
                if (u != null) {
                    sessions.findSession("played", sessionId).then(function(cachedSession) {
                        if (!cachedSession) {
                            deferred.resolve(Responses.danger("No session found", false));
                        } else {
                            if (cachedSession.properties.freeForAll) {
                                player = _.find(cachedSession.players, function(p) {
                                    return p.userId == u.id;
                                });
                                if (player) {
                                    model.removePlayerToSession(sessionId, player.id, player.teamId).then(function(response) {
                                        if (response.data) {
                                            sessions.cache.played.data = _.without(sessions.cache.played.data, cachedSession);
                                            deferred.resolve(Responses.success("Player has leaved the session", response.data));
                                        } else {
                                            deferred.resolve(Responses.danger("Error during player leaved the session", false));
                                        }
                                    });
                                } else {
                                    deferred.resolve(Responses.danger("No player found", false));
                                }
                            } else {
                                var team = _.find(cachedSession.teams, function(t) {
                                    player = _.find(t.players, function(p) {
                                        return p.userId == u.id;
                                    });
                                    return player ? (player.userId == u.id) : false;
                                });
                                if (team && player) {
                                    model.removePlayerToSession(sessionId, player.id, player.teamId).then(function(response) {
                                        if (response.data) {
                                            sessions.cache.played.data = _.without(sessions.cache.played.data, cachedSession);
                                            deferred.resolve(Responses.success("Player has leaved the session", response.data));
                                        } else {
                                            deferred.resolve(Responses.danger("Error during player leaved the session", false));
                                        }
                                    });
                                } else {
                                    player = undefined;
                                    deferred.resolve(Responses.danger("No player found", false));
                                }
                            }
                        }
                    });
                } else {
                    deferred.resolve(Responses.danger("You need to be logged", false));
                }
            });
            return deferred.promise;
        };

        model.archiveSession = function(sessionToArchive) {
            var deferred = $q.defer();
            if (sessionToArchive["@class"] === "Game") {
                setSessionStatus(sessionToArchive.id, "BIN").then(function(sessionArchived) {
                    if (sessionArchived) {
                        sessions.cache.managed.data = uncacheSession(sessions.cache.managed.data, sessionToArchive);
                        sessions.cache.archived.data = cacheSession(sessions.cache.archived.data, sessionToArchive, 1);
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

        /*  ---------------------------------
    ARCHIVED SESSIONS SERVICES
    --------------------------------- */

        model.unarchiveSession = function(sessionToUnarchive) {
            var deferred = $q.defer();
            if (sessionToUnarchive["@class"] === "Game") {
                setSessionStatus(sessionToUnarchive.id, "LIVE").then(function(sessionUnarchived) {
                    if (sessionUnarchived) {
                        sessions.cache.archived.data = uncacheSession(sessions.cache.archived.data, sessionToUnarchive);
                        sessions.cache.managed.data = cacheSession(sessions.cache.managed.data, sessionToUnarchive, 1);
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

        /* Delete all archived sessions. */
        model.deleteArchivedSessions = function() {
            var deferred = $q.defer();
            if (sessions.cache.archived.data.length > 0) {
                $http.delete(ServiceURL + "rest/GameModel/Game").success(function(data) {
                    if (data) {
                        sessions.cache.archived.data = [];
                        deferred.resolve(Responses.success("All archives deleted", true));
                    }
                }).error(function(data) {
                    deferred.resolve(Responses.danger("Error during archives suppression", false));
                });
            } else {
                deferred.resolve(Responses.info("No session archived", true));
            }
            return deferred.promise;
        }

        /* Delete an archived session, passing this session in parameter. */
        model.deleteArchivedSession = function(sessionToDelete) {
            var deferred = $q.defer();
            if (sessionToDelete["@class"] === "Game") {
                setSessionStatus(sessionToDelete.id, "DELETE").then(function(data) {
                    if (data) {
                        sessions.cache.archived.data = uncacheSession(sessions.cache.archived.data, sessionToDelete);
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