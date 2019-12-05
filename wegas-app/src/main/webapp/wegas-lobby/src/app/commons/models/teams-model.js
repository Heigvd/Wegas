angular.module('wegas.models.teams', [])
    .service('TeamsModel', function($http, $q, $interval, $translate, Auth, Responses) {
        "use strict";
        /* Namespace for model accessibility. */
        var model = this,
            ServiceURL = window.ServiceURL,
            /* Cache for data */
            teams = {
                cache: null,
                findTeam: function(id) {
                    if (teams.cache && teams.cache.data) {
                        return _.find(teams.cache.data, function(t) {
                            return t.id === +id;
                        });
                    } else {
                        return;
                    }
                },
                findTeamBySessionId: function(sessionId) {
                    return _.find(teams.cache.data, function(t) {
                        return t.gameId === sessionId;
                    });
                },
                stopWaiting: function(waitFunction) {
                    $interval.cancel(waitFunction);
                },
                wait: function() {
                    var deferred = $q.defer(),
                        waitTeams = $interval(function() {
                            if (!teams.cache.loading) {
                                teams.stopWaiting(waitTeams);
                                deferred.resolve(true);
                            }
                        }, 500);
                    return deferred.promise;
                }
            },
            /* Cache all teams in a list */
            cacheTeams = function() {
                var deferred = $q.defer();
                if (teams.cache !== null) {
                    $http.get(ServiceURL + "rest/Editor/User/Current/Team").success(function(data) {
                        teams.cache.data = data || [];
                        deferred.resolve(teams.cache.data);
                    }).error(function(data) {
                        teams.cache.data = [];
                        deferred.resolve(teams.cache.data);
                    });
                } else {
                    teams.cache.data = [];
                    deferred.resolve(teams.cache.data);
                }
                return deferred.promise;
            },
            /* Cache a team in the cached teams */
            cacheTeam = function(teamToCache) {
                var i, j, k, localTeam, localPlayer, remotePlayer;
                if (teamToCache) {
                    if (teams.cache) {
                        localTeam = teams.cache.data.find(function(item) {
                            return item.id === teamToCache.id;
                        });
                        if (localTeam) {
                            for (j in teamToCache.players) {
                                if (teamToCache.players.hasOwnProperty(j)) {
                                    remotePlayer = teamToCache.players[j];
                                    k = localTeam.players.findIndex(function(item) {
                                        return item.id === remotePlayer.id;
                                    });
                                    if (k >= 0) {
                                        localPlayer = localTeam.players[k];
                                        if (localPlayer.version < remotePlayer.version) {
                                            localTeam.players.splice(k, 1, remotePlayer);
                                        }
                                    }
                                }
                            }
                        } else {
                            teams.cache.data.push(teamToCache);
                        }
                    } else {
                        teams.cache = {data: [teamToCache]};
                    }


                    for (j in teamToCache.players) {
                        if (teamToCache.players.hasOwnProperty(j)) {
                            remotePlayer = teamToCache.players[j];
                            remotePlayer.queueSizeTime = (new Date()).getTime();
                        }
                    }
                }
            },
            /* Uncache a team in the cached teams */
            uncacheTeam = function(team) {
                if (team) {
                    var teamToRemove = teams.findTeam(team.id);
                    if (teamToRemove) {
                        teams.cache.data = _.without(teams.cache.data, teamToRemove);
                    }
                }
            };

        model.clearCache = function() {
            teams.cache = null;
        };

        model.cacheTeam = cacheTeam;

        /* Initialize an empty cache for a new player (right after signup) */
        /* NB: does not work with upgraded Guest accounts !!
         model.initCacheForNewPlayer = function() {
         teams.cache = {
         data: null,
         loading: false
         };
         teams.cache.data = [];
         }
         */

        /* Ask for all teams for current user. */
        model.getTeams = function() {
            var deferred = $q.defer();
            Auth.getAuthenticatedUser().then(function(user) {
                if (user) {
                    if (teams.cache) {
                        if (teams.cache.loading) {
                            teams.wait().then(function() {
                                $translate('COMMONS-TEAMS-FIND-FLASH-SUCCESS').then(function(message) {
                                    deferred.resolve(Responses.success(message, teams.cache.data));
                                });
                            });
                        } else {
                            $translate('COMMONS-TEAMS-FIND-FLASH-SUCCESS').then(function(message) {
                                deferred.resolve(Responses.success(message, teams.cache.data));
                            });
                        }
                    } else {
                        teams.cache = {
                            data: null,
                            loading: true
                        };
                        cacheTeams().then(function() {
                            teams.cache.loading = false;
                            $translate('COMMONS-TEAMS-FIND-FLASH-SUCCESS').then(function(message) {
                                deferred.resolve(Responses.success(message, teams.cache.data));
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

        model.refreshTeam = function(teamToRefresh) {
            var deferred = $q.defer(),
                url = "rest/Extended/User/Current/Team/" + teamToRefresh.id,
                teamRefreshed = false;
            $http
                .get(ServiceURL + url)
                .success(function(data) {
                    uncacheTeam(teamToRefresh);
                    cacheTeam(data);
                    teamRefreshed = teams.findTeam(data.id);
                    $translate('COMMONS-TEAMS-RELOAD-FLASH-SUCCESS').then(function(message) {
                        deferred.resolve(Responses.success(message, teamRefreshed));
                    });
                }).error(function(data) {
                $translate('COMMONS-TEAMS-RELOAD-FLASH-ERROR').then(function(message) {
                    deferred.resolve(Responses.error(message, teamRefreshed));
                });
            });
            return deferred.promise;
        };

        /* Ask for one team joined. */
        model.getTeam = function(id) {
            var deferred = $q.defer(),
                team = null;
            if (teams.cache) {
                if (teams.cache.loading) {
                    teams.wait().then(function() {
                        team = teams.findTeam(id);
                        if (team) {
                            $translate('COMMONS-TEAMS-GET-FLASH-SUCCESS').then(function(message) {
                                deferred.resolve(Responses.success(message, team));
                            });
                        } else {
                            $translate('COMMONS-TEAMS-GET-FLASH-ERROR').then(function(message) {
                                deferred.resolve(Responses.danger(message, false));
                            });
                        }
                    });
                } else {
                    team = teams.findTeam(id);
                    if (team) {
                        $translate('COMMONS-TEAMS-GET-FLASH-SUCCESS').then(function(message) {
                            deferred.resolve(Responses.success(message, team));
                        });
                    } else {
                        $translate('COMMONS-TEAMS-GET-FLASH-ERROR').then(function(message) {
                            deferred.resolve(Responses.danger(message, false));
                        });
                    }
                }
            } else {
                model.getTeams().then(function() {
                    team = teams.findTeam(id);
                    if (team) {
                        $translate('COMMONS-TEAMS-GET-FLASH-SUCCESS').then(function(message) {
                            deferred.resolve(Responses.success(message, team));
                        });
                    } else {
                        $translate('COMMONS-TEAMS-GET-FLASH-ERROR').then(function(message) {
                            deferred.resolve(Responses.danger(message, false));
                        });
                    }
                });
            }
            return deferred.promise;
        };

        /* Ask for one team joined. */
        model.getTeamBySessionId = function(sessionId) {
            var deferred = $q.defer(),
                team = null;
            if (teams.cache) {
                if (teams.cache.loading) {
                    teams.wait().then(function() {
                        team = teams.findTeamBySessionId(sessionId);
                        if (team) {
                            $translate('COMMONS-TEAMS-GET-FLASH-SUCCESS').then(function(message) {
                                deferred.resolve(Responses.success(message, team));
                            });
                        } else {
                            $translate('COMMONS-TEAMS-GET-FLASH-ERROR').then(function(message) {
                                deferred.resolve(Responses.danger(message, false));
                            });
                        }
                    });
                } else {
                    team = teams.findTeamBySessionId(sessionId);
                    if (team) {
                        $translate('COMMONS-TEAMS-GET-FLASH-SUCCESS').then(function(message) {
                            deferred.resolve(Responses.success(message, team));
                        });
                    } else {
                        $translate('COMMONS-TEAMS-GET-FLASH-ERROR').then(function(message) {
                            deferred.resolve(Responses.danger(message, false));
                        });
                    }
                }
            } else {
                model.getTeams().then(function() {
                    team = teams.findTeamBySessionId(sessionId);
                    if (team) {
                        $translate('COMMONS-TEAMS-GET-FLASH-SUCCESS').then(function(message) {
                            deferred.resolve(Responses.success(message, team));
                        });
                    } else {
                        $translate('COMMONS-TEAMS-GET-FLASH-ERROR').then(function(message) {
                            deferred.resolve(Responses.danger(message, false));
                        });
                    }
                });
            }
            return deferred.promise;
        };

        /* Create a team, the current player passing the name */
        model.createTeam = function(session, teamName, teamSize) {
            var deferred = $q.defer(),
                newTeam = {
                    "@class": "Team",
                    "gameId": session.id,
                    "name": "",
                    "declaredSize": "",
                    "players": []
                };
            Auth.getAuthenticatedUser().then(function(user) {
                if (user) {
                    if (session.access === "OPEN") {
                        var existingTeam = false;
                        session.teams.forEach(function(team) {
                            if (team.name === teamName) {
                                existingTeam = true;
                            }
                        });
                        if (existingTeam) {
                            $translate('COMMONS-TEAMS-CREATE-EXISTING-TEAM-FLASH-INFO').then(function(message) {
                                deferred.resolve(Responses.info(message, false));
                            });
                        } else {
                            newTeam.name = teamName;
                            newTeam.declaredSize = +teamSize;
                            $http.post(ServiceURL + "rest/GameModel/Game/" + session.id + "/Team", newTeam).success(
                                function(team) {
                                    $translate('COMMONS-TEAMS-CREATE-FLASH-SUCCESS').then(function(message) {
                                        deferred.resolve(Responses.success(message, team));
                                    });
                                }).error(function(data) {
                                $translate('COMMONS-TEAMS-CREATE-FLASH-ERROR').then(function(message) {
                                    deferred.resolve(Responses.danger(message, false));
                                });
                            });
                        }
                    } else {
                        $translate('COMMONS-SESSIONS-CLOSE-FLASH-ERROR').then(function(message) {
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

        /* Join a team for current player */
        model.joinTeam = function(sessionToJoin, teamId) {
            var deferred = $q.defer();
            Auth.getAuthenticatedUser().then(function(user) {
                if (user !== null) {
                    if (sessionToJoin.access === "CLOSE") {
                        $translate('COMMONS-SESSIONS-CLOSE-FLASH-ERROR').then(function(message) {
                            deferred.resolve(Responses.danger(message, false));
                        });
                    } else {
                        var cachedTeam = teams.findTeam(teamId);
                        if (cachedTeam) {
                            $translate('COMMONS-TEAMS-ALREADY-JOIN-FLASH-INFO').then(function(message) {
                                deferred.resolve(Responses.info(message, false));
                            });
                        } else {
                            $http.post(ServiceURL + "rest/Extended/GameModel/Game/Team/" + teamId + "/Player", {}, {
                                "headers": {
                                    "managed-mode": "true"
                                }
                            }).success(
                                function(data) {
                                    var i, team;
                                    for (i = 0; i < data.updatedEntities.length; i += 1) {
                                        if (data.updatedEntities[i]["@class"] === "Team") {
                                            team = data.updatedEntities[i];
                                            break;
                                        }
                                    }

                                    if (team) {
                                        cacheTeam(team);
                                        $translate('COMMONS-TEAMS-JOIN-FLASH-SUCCESS').then(function(message) {
                                            deferred.resolve(Responses.success(message, team));
                                        });
                                    } else {
                                        $translate('COMMONS-TEAMS-JOIN-FLASH-ERROR').then(function(message) {
                                            deferred.resolve(Responses.danger(message, false));
                                        });
                                    }
                                }).error(function(data) {
                                $translate('COMMONS-TEAMS-JOIN-FLASH-ERROR').then(function(message) {
                                    deferred.resolve(Responses.danger(message, false));
                                });
                            });
                        }
                    }
                } else {
                    $translate('COMMONS-AUTH-CURRENT-FLASH-ERROR').then(function(message) {
                        deferred.resolve(Responses.danger(message, false));
                    });
                }
            });
            return deferred.promise;
        };

        /* Join an individual session for current player */
        model.joinIndividually = function(sessionToJoin) {
            var deferred = $q.defer();
            Auth.getAuthenticatedUser().then(function(user) {
                if (user !== null) {
                    if (sessionToJoin.access === "CLOSE") {
                        $translate('COMMONS-SESSIONS-CLOSE-FLASH-ERROR').then(function(message) {
                            deferred.resolve(Responses.danger(message, false));
                        });
                    } else {
                        if (teams.cache === null) {
                            teams.cache = {
                                data: [],
                                loading: false
                            };
                        }
                        var alreadyJoined = false;
                        sessionToJoin.teams.forEach(function(teamJoinable) {
                            teams.cache.data.forEach(function(teamJoined) {
                                if (+teamJoinable.id === +teamJoined.id) {
                                    alreadyJoined = true;
                                }
                            });
                        });
                        if (alreadyJoined) {
                            $translate('COMMONS-TEAMS-ALREADY-JOIN-FLASH-INFO').then(function(message) {
                                deferred.resolve(Responses.info(message, false));
                            });
                        } else {
                            $http.post(ServiceURL + "rest/Extended/GameModel/Game/" + sessionToJoin.id +
                                "/Player", {}, {
                                "headers": {
                                    "managed-mode": "true"
                                }
                            }).success(function(data) {
                                var i, team;
                                for (i = 0; i < data.updatedEntities.length; i += 1) {
                                    if (data.updatedEntities[i]["@class"] === "Team") {
                                        team = data.updatedEntities[i];
                                        break;
                                    }
                                }
                                if (team) {
                                    cacheTeam(team);
                                    $translate('COMMONS-TEAMS-JOIN-INDIVIDUALLY-FLASH-SUCCESS').then(function(message) {
                                        deferred.resolve(Responses.success(message, team));
                                    });
                                } else {
                                    $translate('COMMONS-TEAMS-JOIN-FLASH-ERROR').then(function(message) {
                                        deferred.resolve(Responses.danger(message, false));
                                    });
                                }
                            }).error(function(data) {
                                $translate('COMMONS-TEAMS-JOIN-INDIVIDUALLY-FLASH-ERROR').then(function(message) {
                                    deferred.resolve(Responses.danger(message, false));
                                });
                            });
                        }
                    }
                } else {
                    $translate('COMMONS-AUTH-CURRENT-FLASH-ERROR').then(function(message) {
                        deferred.resolve(Responses.danger(message, false));
                    });
                }
            });
            return deferred.promise;
        };

        model.joinRetry = function(teamId) {
            var deferred = $q.defer(),
                player;
            Auth.getAuthenticatedUser().then(function(user) {
                if (user) {
                    var cachedTeam = teams.findTeam(teamId);
                    if (!cachedTeam) {
                        $translate('COMMONS-TEAMS-NO-TEAM-FLASH-ERROR').then(function(message) {
                            deferred.resolve(Responses.danger(message, false));
                        });
                    } else {
                        player = _.find(cachedTeam.players, function(p) {
                            return +p.userId === +user.id;
                        });
                        if (player) {
                            $http.put(ServiceURL + "rest/GameModel/Game/Team/" + player.teamId + "/Player/" +
                                player.id + "/RetryJoin", {
                                    "headers": {
                                        "managed-mode": "true"
                                    }
                                }).success(function(data) {
                                $translate('COMMONS-TEAMS-JOIN-FLASH-SUCCESS').then(function(message) {
                                    deferred.resolve(Responses.success(message, teams.cache.data));
                                });
                            }).error(function(data) {
                                if (data && data.message) {
                                    deferred.resolve(Responses.danger(data.message, false));
                                } else {
                                    $translate('COMMONS-TEAMS-JOIN-FLASH-ERROR').then(function(message) {
                                        deferred.resolve(Responses.danger(message, false));
                                    });
                                }
                            });
                        } else {
                            $translate('COMMONS-TEAMS-NO-PLAYER-FLASH-ERROR').then(function(message) {
                                deferred.resolve(Responses.danger(message, false));
                            });
                        }
                    }
                } else {
                    $translate('COMMONS-AUTH-CURRENT-FLASH-ERROR').then(function(message) {
                        deferred.resolve(Responses.danger(message, false));
                    });
                }
            });
            return deferred.promise;
        };

        /* Leave a team for current player */
        model.leaveTeam = function(teamId) {
            var deferred = $q.defer(),
                player;
            Auth.getAuthenticatedUser().then(function(user) {
                if (user) {
                    var cachedTeam = teams.findTeam(teamId);
                    if (!cachedTeam) {
                        $translate('COMMONS-TEAMS-NO-TEAM-FLASH-ERROR').then(function(message) {
                            deferred.resolve(Responses.danger(message, false));
                        });
                    } else {
                        player = _.find(cachedTeam.players, function(p) {
                            return +p.userId === +user.id;
                        });
                        if (player) {
                            $http.delete(ServiceURL + "rest/GameModel/Game/Team/" + player.teamId + "/Player/" +
                                player.id, {
                                    "headers": {
                                        "managed-mode": "true"
                                    }
                                }).success(function(data) {
                                uncacheTeam(cachedTeam);
                                $translate('COMMONS-TEAMS-LEAVE-FLASH-SUCCESS').then(function(message) {
                                    deferred.resolve(Responses.success(message, teams.cache.data));
                                });
                            }).error(function(data) {
                                $translate('COMMONS-TEAMS-LEAVE-FLASH-ERROR').then(function(message) {
                                    deferred.resolve(Responses.danger(message, false));
                                });
                            });
                        } else {
                            $translate('COMMONS-TEAMS-NO-PLAYER-FLASH-ERROR').then(function(message) {
                                deferred.resolve(Responses.danger(message, false));
                            });
                        }
                    }
                } else {
                    $translate('COMMONS-AUTH-CURRENT-FLASH-ERROR').then(function(message) {
                        deferred.resolve(Responses.danger(message, false));
                    });
                }
            });
            return deferred.promise;
        };
    });
