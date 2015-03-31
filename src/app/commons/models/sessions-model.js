'use strict';
angular.module('wegas.models.sessions', [])
.service('SessionsModel', function ($http, $q, $interval, Auth) {
    /* Namespace for model accessibility. */
    var model = this,
    /* Caches for data */
    managedSessions = null,
    playedSessions = null;
    /* Tools to prevent asynchronous error. */
    managedSessionsLoading = false,
    waitManagedSessions = null,
    
    /* Return a session in a sessions cache. */
    findSession = function(sessions, id){
        return _.find(sessions, function (s) { return s.id == id; });
    },

    /* Format players in a list, individualy or grouped by team. */ 
    formatPlayers = function(session){
        if(!session.properties.freeForAll){
            var teams = session.teams;
            teams.forEach(function(team){
                if(team["@class"] == "DebugTeam" || team.players.length < 1){
                    session.teams = _.without(session.teams, _.findWhere(session.teams, {id: team.id}));
                }
            });
        }else{
            var teams = session.teams,
                players = [];
            teams.forEach(function(team){
                if(team["@class"] != "DebugTeam"){
                    team.players.forEach(function(player){
                        players.push(player);
                    });
                }
            });
            session.players = players;
            delete session.teams;
        }
        return session;
    },

    /* Call the REST service for getting managed sessions. */
    cacheManagedSessions = function () {
        var deferred = $q.defer();
        $http.get(ServiceURL + "rest/GameModel/Game?view=EditorExtended").success(function(data){
            data.forEach(function(session){
                session = formatPlayers(session)
            });
            managedSessions = data;
            deferred.resolve(managedSessions);
        }).error(function(data){
            managedSessions = [];
            deferred.resolve(managedSessions);
        });
        return deferred.promise;
    },
    
    /* Get all co-trainers for a managed session. */
    cacheTrainersForSession = function (id) {
        var deferred = $q.defer();
        session = findSession(managedSessions, id);
        if(session){
            if(session.trainers){
                deferred.resolve(session.trainers);
            }else{
                $http.get(ServiceURL + "rest/Extended/User/FindAccountPermissionByInstance/g" + session.id).success(function(data){
                    managedSessions[_.indexOf(managedSessions, session)].trainers = data;
                    deferred.resolve(data);
                }).error(function(data){
                    deferred.resolve(false);
                });
            }
        }else{
            deferred.resolve(false);
        }
        return deferred.promise;
    },

    /* Add trainers to a session in cache. */
    addTrainersToSession = function(id){
        var deferred = $q.defer(),
            session = findSession(managedSessions, id);
        if(session){
            if(session.trainers){
                deferred.resolve(session);
            }else{
                cacheTrainersForSession(session.id).then(function(data){
                    session = findSession(managedSessions, id);
                    deferred.resolve(session);
                });
            }
        }else{
            deferred.resolve(false);
        }
        return deferred.promise;
    },

    /* Stop waiting for simultanate sessions asking. */
    stopWaiting = function(waitFunction){
        $interval.cancel(waitFunction);
    },

    /* Do wait during data loading. */ 
    waitForManagedSessions = function(){
        var deferred = $q.defer();
        waitManagedSessions = $interval(function() {
            if(!managedSessionsLoading){
                stopWaiting(waitManagedSessions);
                deferred.resolve(true)
            }   
        }, 500);
        return deferred.promise;
    };

    /* Ask for all managed sessions. */
    model.getManagedSessions = function(){
        var deferred = $q.defer();
        if(managedSessionsLoading){
            waitForManagedSessions.then(function(){
                deferred.resolve(managedSessions);
            });
        }else{
            if(managedSessions != null){
                deferred.resolve(managedSessions);
            }else{
                managedSessionsLoading = true;
                cacheManagedSessions().then(function(){
                    deferred.resolve(managedSessions);
                    managedSessionsLoading = false;
                });
            }
        }
        return deferred.promise;
    };

    /* Ask for one managed session. */
    model.getManagedSession = function(id){
        var deferred = $q.defer();
        if(managedSessionsLoading){
            waitForManagedSessions().then(function(){
                addTrainersToSession(id).then(function(data){
                    deferred.resolve(data);
                });
            });
        }else{
            if(managedSessions == null) {
                model.getManagedSessions().then(function(){
                    addTrainersToSession(id).then(function(data){
                        deferred.resolve(data);
                    });
                });
            }else{
                addTrainersToSession(id).then(function(data){
                    deferred.resolve(data);
                });
            }
        }
        return deferred.promise;
    };

    /* Create a new session. */
    model.createManagedSession = function(sessionName, scenarioId){
        var deferred = $q.defer();
        Auth.getAuthenticatedUser().then(function(user){
            if(user != null) {
                /* Todo Check Values ? */
                var newSession = {
                    "@class": "Game",
                    "gameModelId": scenarioId,
                    "access": "ENROLMENTKEY",
                    "name": sessionName
                };
                $http.post(ServiceURL + "rest/GameModel/Game/"+ user.id, newSession).success(function(data){
                    console.log(data);
                    managedSessions.push(data);
                    deferred.resolve(data);
                }).error(function(data){
                    /* TODO - Improve error mgt */
                    deferred.resolve(null);
                });
            }else{
                deferred.resolve(null);
            }
        });
        return deferred.promise;
    };

    /* Update a name of a session. */ 
    model.updateNameSession = function(sessionToSet){
        var deferred = $q.defer();
        var sessionBeforeChange = findSession(managedSessions, sessionToSet.id);
        if(sessionBeforeChange != undefined){
            sessionBeforeChange.name = sessionToSet.name;
            $http.put(ServiceURL + "rest/GameModel/Game/"+ sessionToSet.id, sessionBeforeChange).success(function(data){
                deferred.resolve(data);
            }).error(function(data){
                deferred.resolve(data);
            });
        }
        return deferred.promise;
    };

    /* Update the comment of a session. */ 
    model.updateCommentsSession = function(sessionToSet){
        var deferred = $q.defer();
        var sessionBeforeChange = findSession(managedSessions, sessionToSet.id);
        if(sessionBeforeChange != undefined){
            scenarioBeforeChange = sessionBeforeChange.gameModel;
            scenarioBeforeChange.comments = sessionToSet.comments;
            $http.put(ServiceURL + "rest/Public/GameModel/"+ scenarioBeforeChange.id, scenarioBeforeChange).success(function(data){
                deferred.resolve(data);
            }).error(function(data){
                deferred.resolve(data);
            });
        }
        return deferred.promise;
    };

    /* Add a new trainer to the session */ 
    model.addTrainerToSession = function(sessionId, trainer){
        var deferred = $q.defer(),
            session = findSession(managedSessions, sessionId);
            if(session){
                var alreadyIn = false;
                session.trainers.forEach(function(elem){
                    if(elem.id == trainer.id){
                        alreadyIn = true;
                    }
                });
                if(!alreadyIn){
                    $http.post(ServiceURL + "rest/Extended/User/addAccountPermission/Game:View,Edit:g"+ session.id + "/" + trainer.id).success(function(data){
                        managedSessions[_.indexOf(managedSessions, session)].trainers.push(trainer);
                        deferred.resolve(trainer);
                    }).error(function(data){
                        deferred.resolve(data);
                    });
                }
            }else{
                deferred.resolve(false);
            }
        return deferred.promise;
    };

    /* Remove a trainer from a session */ 
    model.removeTrainerToSession = function(sessionId, trainerId){
        var deferred = $q.defer(),
            session = findSession(managedSessions, sessionId);
            if(session){
                trainer = _.find(session.trainers, function (t) { return t.id == trainerId; });
                if(trainer){
                    $http.delete(ServiceURL + "rest/Extended/User/DeleteAccountPermissionByInstanceAndAccount/g"+ session.id + "/" + trainer.id).success(function(data){
                        managedSessions[_.indexOf(managedSessions, session)].trainers = _.without(session.trainers, trainer);
                        deferred.resolve(trainer);
                    }).error(function(data){
                        deferred.resolve(data);
                    });
                }
            }else{
                deferred.resolve(false);
            }
        return deferred.promise;
    };

    /* Remove a trainer from a session */ 
    model.removePlayerToSession = function(sessionId, playerId, teamId){
        var deferred = $q.defer(),
            session = findSession(managedSessions, sessionId);
            if(session){
                if(!session.properties.freeForAll){
                    session.teams.forEach(function(team){
                        if(team.id == teamId){
                            team.players.forEach(function(player){
                                if(player.id == playerId){
                                    $http.delete(ServiceURL + "rest/GameModel/Game/Team/" + player.teamId + "/Player/" + player.id).success(function(data){
                                        team.players = _.without(team.players, player);
                                        deferred.resolve(player);                                       
                                    }).error(function(data){
                                        deferred.resolve(data);
                                    });
                                }
                            });
                        }
                    });
                }else{
                    player = _.find(session.players, function (t) { return t.id == playerId; });
                    if(player){
                        $http.delete(ServiceURL + "rest/GameModel/Game/Team/" + player.teamId + "/Player/" + player.id).success(function(data){
                            managedSessions[_.indexOf(managedSessions, session)].players = _.without(session.players, player);
                            deferred.resolve(player);
                        }).error(function(data){
                            deferred.resolve(data);
                        });
                    }
                }
            }else{
                deferred.resolve(false);
            }
        return deferred.promise;
    };

    /* Return all played sessions */
    model.getPlayedSessions = function () {
        var deferred = $q.defer();
        Auth.getAuthenticatedUser().then(function(user){
            if(user != null){
                if(playedSessions != null){
                    deferred.resolve(playedSessions);
                } else {
                    playedSessions = [];
                    $http.get(ServiceURL + "rest/RegisteredGames/"+ user.id).success(function(data){
                        playedSessions = data
                        deferred.resolve(playedSessions);
                    }).error(function(data){
                        playedSessions = [];
                        deferred.resolve(playedSessions);
                    });
                }
            } else {
                deferred.resolve(playedSessions);
            }
        });
        return deferred.promise;
    };

    /* Get a played session form id, undefined otherwise. */
    model.getPlayedSession = function(id){
        var deferred = $q.defer();
        if(playedSessions == null){
            model.getPlayedSessions().then(function(data){
                var session = findSession(playedSessions, id);
                deferred.resolve(session);
            });
        }else{
            var session = findSession(playedSessions, id);
            deferred.resolve(session);
        }
        return deferred.promise;
    };

    /* Get a session form token, undefined otherwise. */
    model.findSessionToJoin = function(token){
        var deferred = $q.defer();
        $http.get(ServiceURL + "rest/GameModel/Game/FindByToken/" + token).success(function(data){
            if(data){
                data = formatPlayers(data)
            }
            deferred.resolve(data);
        }).error(function(data){
            deferred.resolve(false);
        });
        return deferred.promise;
    };

    /* Join a session for current player */ 
    model.joinSession = function (token) {
        var deferred = $q.defer();
        Auth.getAuthenticatedUser().then(function(user) {
            if(user != null) {
                if(playedSessions == null) {
                    model.getPlayedSessions().then(function(data){
                        model.joinSession(token);
                    });
                } else {
                    model.getPlayedSessions().then(function(data){
                        $http.get(ServiceURL + "rest/GameModel/Game/JoinGame/"+ token + "?view=Extended").success(function(data){
                            playedSessions.push(data[0]);
                            deferred.resolve(playedSessions);
                        }).error(function(data){
                            deferred.resolve(playedSessions);
                        });
                    });
                }
            } else {
                deferred.resolve(playedSessions);
            }
        });
        return deferred.promise;
    }
    /* Join a team for current player */ 
    model.joinTeam = function (sessionId, teamId) {
        var deferred = $q.defer();
        Auth.getAuthenticatedUser().then(function(user) {
            if(user != null) {
                var cachedSession = findSession(playedSessions, sessionId);
                if(cachedSession){
                    deferred.resolve(false);
                }else{
                    $http.get(ServiceURL + "rest/GameModel/Game/JoinTeam/"+ teamId).success(function(session){
                        session = formatPlayers(session);
                        playedSessions.push(session);
                        deferred.resolve(session);
                    }).error(function(data){
                        deferred.resolve(data);
                    });
                }
            } else {
                deferred.resolve(false);
            }
        });
        return deferred.promise;
    }

    /* Remove data from sessions caches */
    model.clearCache = function(){
        managedSessions = null;
        playedSessions = null;
    };
})
;
