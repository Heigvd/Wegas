'use strict';
angular.module('wegas.models.sessions', [])
.service('SessionsModel', function ($http, $q, $interval, Auth, Responses) {
    /* Namespace for model accessibility. */
    var model = this,

    /* Caches for data */
    managedSessions = null,
    playedSessions = null,

    /* Tools to prevent asynchronous error. */
    managedSessionsLoading = false,
    waitManagedSessions = null,
    playedSessionsLoading = false,
    waitPlayedSessions = null,
    
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

    /* Call the REST service for getting managed sessions. */
    cachePlayedSessions = function (userId) {
        var deferred = $q.defer();
        $http.get(ServiceURL + "rest/RegisteredGames/"+ userId).success(function(data){
            data.forEach(function(session){
                session = formatPlayers(session);
            });
            playedSessions = data;
            deferred.resolve(playedSessions);
        }).error(function(data){
            playedSessions = [];
            deferred.resolve(playedSessions);
        });
        return deferred.promise;
    },
    
    /* Get all co-trainers for a managed session. */
    cacheTrainersForSession = function (id) {
        var deferred = $q.defer(),
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
    },

    /* Do wait during data loading. */ 
    waitForPlayedSessions = function(){
        var deferred = $q.defer();
        waitPlayedSessions = $interval(function() {
            if(!playedSessionsLoading){
                stopWaiting(waitPlayedSessions);
                deferred.resolve(true)
            }   
        }, 500);
        return deferred.promise;
    },

    /* Uncache a player or a team from a cached session  */
    uncachePlayer = function(session, player){
        if(session && player){
            if(!session.properties.freeForAll){
                var team = _.find(session.teams, function(t){return t.id = player.teamId});
                if(team){
                    if(team.players.length < 2){
                        session.teams = _.without(session.teams, team);
                    }else{
                        team.players = _.without(team.players, player);
                    }
                }
            }else{
                if(_.find(session.players, player)){
                    session.players = _.without(session.players, player);
                }
            } 
        }  
        return session;
    }, 

    /* Cache a player in a cached session */
    cachePlayer = function(session, player){
        if(session && player){
            if(!session.properties.freeForAll){
                var team = _.find(session.teams, function(t){return t.id = player.teamId});
                if(team){
                    team.players.push(player);
                }
            }else{
                session.players.push(player);
            } 
        }  
        return session;
    }, 

    /* Cache a team in a cached session */
    cacheTeam = function(session, team){
        if(session && team){
            if(!session.properties.freeForAll){
                session.teams.push(team)
            }
        }  
        return session;
    }, 

    cacheSession = function(sessionList, session){
        if(sessionList && session){
            if(!_.find(sessionList, session)){
                sessionList.push(session);
            }
        }  
        return sessionList;
    },

    uncacheSession = function(sessionList, session){
        var sessionToUncache = _.find(sessionList, session);
        if(sessionToUncache){
            sessionList = _.without(sessionList, session);
        }
        return sessionList;
    },
    
    /* Remove player from persistante datas */
    removePlayer = function(player){
        var deferred = $q.defer();
        if(player.teamId && player.id){

            $http.delete(ServiceURL + "rest/GameModel/Game/Team/" + player.teamId + "/Player/" + player.id).success(function(data){
                deferred.resolve(player);     
            }).error(function(data){
                deferred.resolve(false);
            });
        }else{
            deferred.resolve(false);
        }
        return deferred.promise;
    };

    /* Ask for all managed sessions. */
    model.getManagedSessions = function(){
        var deferred = $q.defer();
        if(managedSessionsLoading){
            waitForManagedSessions.then(function(){
                deferred.resolve(Responses.success("Managed sessions find", managedSessions));
            });
        }else{
            if(managedSessions != null){
                deferred.resolve(Responses.success("Managed sessions find", managedSessions));
            }else{
                managedSessionsLoading = true;
                cacheManagedSessions().then(function(){
                    deferred.resolve(Responses.success("Managed sessions find", managedSessions));
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
                addTrainersToSession(id).then(function(session){
                    if(session){ 
                        deferred.resolve(Responses.success("Session find", session));
                    }else{
                        deferred.resolve(Responses.error("No session find", false));
                    }
                });
            });
        }else{
            if(managedSessions == null) {
                model.getManagedSessions().then(function(){
                    addTrainersToSession(id).then(function(session){
                        if(session){
                            deferred.resolve(Responses.success("Session find", session));
                        }else{
                            deferred.resolve(Responses.error("No session find", false));
                        }
                    });
                });
            }else{
                addTrainersToSession(id).then(function(session){
                    if(session){
                        deferred.resolve(Responses.success("Session find", session));
                    }else{
                        deferred.resolve(Responses.error("No session find", false));
                    }
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
                $http.post(ServiceURL + "rest/GameModel/Game/"+ user.id + "?view=EditorExtended" , newSession).success(function(data){
                    managedSessions.push(data);
                    deferred.resolve(Responses.success("Session created", data));
                }).error(function(data){
                    deferred.resolve(Responses.error("Error during session creation", data));
                });
            }else{
                deferred.resolve(Responses.error("No user authenticate", false));
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
                deferred.resolve(Responses.success("Session name updated", data));
            }).error(function(data){
                deferred.resolve(Responses.error("Error during session name update", false));
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
                deferred.resolve(Responses.success("Session comments updated", data));
            }).error(function(data){
                deferred.resolve(Responses.error("Error during session comments update", false));
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
                    deferred.resolve(Responses.success("Trainer added", trainer));
                }).error(function(data){
                    deferred.resolve(Responses.error("Error for adding trainer", false));
                });
            }else{
                deferred.resolve(Responses.info("This user is already a trainer for this session", false));
            }
        }else{
            deferred.resolve(Responses.error("No access to this session", false));
        }
        return deferred.promise;
    };

    /* Remove a trainer from a session in cached sessions et persistant datas */ 
    model.removeTrainerToSession = function(sessionId, trainerId){
        var deferred = $q.defer(),
            session = findSession(managedSessions, sessionId);
            if(session){
                trainer = _.find(session.trainers, function (t) { return t.id == trainerId; });
                if(trainer){
                    $http.delete(ServiceURL + "rest/Extended/User/DeleteAccountPermissionByInstanceAndAccount/g"+ session.id + "/" + trainer.id).success(function(data){
                        managedSessions[_.indexOf(managedSessions, session)].trainers = _.without(session.trainers, trainer);
                        deferred.resolve(Responses.success("Trainer removed", trainer));
                    }).error(function(data){
                        deferred.resolve(Responses.error("You can not remove this trainer", data));
                    });
                }
            }else{
                deferred.resolve(Response.error("You have no accesss to this session", false));
            }
        return deferred.promise;
    };

    /* Remove player form persistante datas and change cached datas (Used from trainer and player workspace) */
    model.removePlayerToSession = function(sessionId, playerId, teamId){
        var deferred = $q.defer(),
            managedSession = findSession(managedSessions, sessionId),
            playedSession = findSession(playedSessions, sessionId),
            session = managedSession || playedSession,
            team = undefined, player = undefined;
        if(session){
            if(!session.properties.freeForAll){
                team = _.find(session.teams, function (t) { return t.id == teamId; });
                if(team){
                    player = _.find(team.players, function (p) { return p.id == playerId; });
                    if(player){
                        removePlayer(player).then(function(leavingPlayer){
                            if(leavingPlayer){
                                managedSession = managedSession ? uncachePlayer(managedSession, leavingPlayer) : managedSession;
                                playedSessions = playedSession ? uncacheSession(playedSessions, playedSession) : playedSessions;
                                deferred.resolve(Responses.success("Player has leaved the session", leavingPlayer));
                            }else{
                                deferred.resolve(Responses.error("Error during player leaving session", false));
                            }
                        });
                    }else{
                        deferred.resolve(Responses.error("No player found", false));
                    }
                }else{
                    deferred.resolve(Responses.error("No team found", false));
                }
            }else{
                player = _.find(session.players, function (p) { return p.id == playerId; });
                if(player){
                    removePlayer(player).then(function(leavingPlayer){
                        if(leavingPlayer){
                            managedSession = managedSession ? uncachePlayer(managedSession, leavingPlayer) : managedSession;
                            playedSessions = playedSession ? uncacheSession(playedSessions, playedSession) : playedSessions;
                            deferred.resolve(Responses.success("Player has leaved the session", leavingPlayer));

                        }else{
                            deferred.resolve(Responses.error("Error during player leaving session", false));
                        }
                    });
                }else{
                    deferred.resolve(Responses.error("No player found", false));
                }
            }
        }else{
            deferred.resolve(Responses.error("You have no accesss to this session", false));
        }
        return deferred.promise;
    };

    /* Ask for all played sessions. */
    model.getPlayedSessions = function(){
        var deferred = $q.defer();
        Auth.getAuthenticatedUser().then(function(user){
            if(user != null){
                if(playedSessionsLoading){
                    waitForPlayedSessions().then(function(){
                        deferred.resolve(Responses.success("Played sessions find", playedSessions));
                    });
                }else{
                    if(playedSessions != null){
                        deferred.resolve(Responses.success("Played sessions find", playedSessions));
                    }else{
                        playedSessionsLoading = true;
                        cachePlayedSessions(user.id).then(function(){
                            deferred.resolve(Responses.success("Played sessions find", playedSessions));
                            playedSessionsLoading = false;
                        });
                    }
                }
            }else{
                deferred.resolve(Responses.error("You need to be logged", false));
            }
        });
        return deferred.promise;
    };

     /* Ask for one managed session. */
    model.getPlayedSession = function(id){
        var deferred = $q.defer(),
            session = null;
        if(playedSessionsLoading){
            waitForPlayedSessions().then(function(){
                session = findSession(playedSessions, id);
                if(session){
                    deferred.resolve(Responses.success("Session find", session));
                }else{
                    deferred.resolve(Responses.error("No session find", false));
                }
            });
        }else{
            if(playedSessions == null) {
                model.getPlayedSessions().then(function(){
                    session = findSession(playedSessions, id);
                    if(session){
                        deferred.resolve(Responses.success("Session find", session));
                    }else{
                        deferred.resolve(Responses.error("No session find", false));
                    }
                });
            }else{
                session = findSession(playedSessions, id);
                if(session){
                    deferred.resolve(Responses.success("Session find", session));
                }else{
                    deferred.resolve(Responses.error("No session find", false));
                }
            }
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
            deferred.resolve(Responses.success("Session find", data));
        }).error(function(data){
            deferred.resolve(Responses.error("No session find", false));
        });
        return deferred.promise;
    };

    /* Join an individual session for current player */ 
    model.joinIndividualSession = function (token) {
        var deferred = $q.defer();
        Auth.getAuthenticatedUser().then(function(user) {
            if(user != null) {
                var cachedSession = _.find(playedSessions, function (s) { return s.token == token; });
                if(cachedSession){
                    deferred.resolve(Responses.info("You have already join this session", false));
                }else{
                    model.getPlayedSessions().then(function(data){
                        $http.get(ServiceURL + "rest/GameModel/Game/JoinGame/"+ token + "?view=Extended").success(function(data){                            
                            var team = _.find(data[1].teams, function (t) { return t.id == data[0].id; });
                            if(team){
                                var player = _.find(team.players, function (p) { return (p.userId == null && p.teamId == null); });
                                if(player){
                                    player.teamId = data[0].id;
                                    player.userId = user.id;     
                                    var session = formatPlayers(data[1]);
                                    playedSessions = cacheSession(playedSessions, session);
                                    if(user.isTrainer){
                                        var managedSession = _.find(managedSessions, function (s) { return s.id == session.id; });
                                        if(managedSession){
                                            managedSession = cachePlayer(managedSession, player);
                                        }
                                    }
                                    deferred.resolve(Responses.success("You have join the session", cachedSession));
                                }else{
                                    deferred.resolve(Responses.error("Error during creating player", false));
                                }
                            }else{
                                deferred.resolve(Responses.error("Error during creating solo-team", false));
                            }
                        }).error(function(data){
                            deferred.resolve(Responses.error("Error during joining session", false));
                        });
                    });
                }
            } else {
                deferred.resolve(Responses.error("You need to be logged", false));
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
                    deferred.resolve(Responses.info("You have already join this session", false));
                }else{
                    $http.get(ServiceURL + "rest/GameModel/Game/JoinTeam/"+ teamId).success(function(session){
                        var team = _.find(session.teams, function (t) { return t.id == teamId; });
                        if(team){
                            var player = _.find(team.players, function (p) { return (p.teamId == null && p.userId == null); });
                            if(player){
                                player.teamId = teamId;
                                player.userId = user.id;                            
                                session = cachePlayer(session, player);
                                playedSessions = cacheSession(playedSessions, session);
                                if(user.isTrainer || user.isScenarist || user.isAdmin){
                                    var managedSession = _.find(managedSessions, function (s) { return s.id == session.id; });
                                    if(managedSession){
                                        managedSession = cachePlayer(managedSession, player);
                                    }
                                }
                                deferred.resolve(Responses.success("You have join the session", session));
                            }else{
                                deferred.resolve(Responses.error("Error during creating player", false));
                            }
                        }else{
                            deferred.resolve(Responses.error("Error during joining team", false));
                        }
                    }).error(function(data){
                        deferred.resolve(Responses.error("Error during joining session", false));
                    });
                }
            } else {
                deferred.resolve(Responses.error("You need to be logged", false));
            }
        });
        return deferred.promise;
    };

    /* Join a team for current player */ 
    model.createTeam = function (session, teamName) {
        var deferred = $q.defer(),
            cachedSession = findSession(playedSessions, session.id),
            newTeam = {
                "@class": "Team",
                "gameId": session.id,
                "name":"",
                "players": []
            };
        Auth.getAuthenticatedUser().then(function(u) {
            if(u != null) {
                if(cachedSession){
                    deferred.resolve(Responses.info("You have already join this session", false));
                }else{
                    newTeam.name = teamName;
                    $http.post(ServiceURL + "rest/GameModel/Game/" + session.id + "/Team", newTeam).success(function(team){
                        if(team){
                            cachedSession = cacheTeam(cachedSession, team);
                            if(u.isTrainer || u.isScenarist || u.isAdmin){
                                var managedSession = findSession(managedSessions, session.id);
                                if(managedSession){
                                    managedSession = cacheTeam(managedSession, team);
                                }
                            }
                        }
                        deferred.resolve(Responses.success("Team created", team));
                    }).error(function(data){
                        deferred.resolve(Responses.error("Error during team creation", false));
                    });
                }
            } else {
                deferred.resolve(Responses.error("You need to be logged", false));
            }
        });
        return deferred.promise;
    };

    /* Leave a session for current player */ 
    model.leaveSession = function (sessionId) {
        var deferred = $q.defer(),
            cachedSession = findSession(playedSessions, sessionId),
            player = undefined;
        Auth.getAuthenticatedUser().then(function(u) {
            if(u != null) {
                if(!cachedSession){
                    deferred.resolve(Responses.error("No session found", false));
                }else{
                    if(cachedSession.properties.freeForAll){
                        player = _.find(cachedSession.players, function (p) {return p.userId == u.id; });
                        if(player){
                            model.removePlayerToSession(sessionId, player.id, player.teamId).then(function(response){
                                if(response.data){
                                    playedSessions = _.without(playedSessions, cachedSession);
                                    deferred.resolve(Responses.success("Player has leaved the session", response.data));
                                }else{
                                    deferred.resolve(Responses.error("Error during player leaved the session", false));
                                }
                            });
                        }else{
                            deferred.resolve(Responses.error("No player found", false));
                        }
                    }else{
                        var team = _.find(cachedSession.teams, function (t) { 
                            player = _.find(t.players, function (p) { return p.userId == u.id; });
                            return player ? (player.userId == u.id) : false; 
                        });
                        if(team && player){
                            model.removePlayerToSession(sessionId, player.id, player.teamId).then(function(response){
                                if(response.data){
                                    playedSessions = _.without(playedSessions, cachedSession);
                                    deferred.resolve(Responses.success("Player has leaved the session", response.data));
                                }else{
                                    deferred.resolve(Responses.error("Error during player leaved the session", false));
                                }
                            });
                        }else{
                            player = undefined;
                            deferred.resolve(Responses.error("No player found", false));
                        }
                    }
                }
            } else {
                deferred.resolve(Responses.error("You need to be logged", false));
            }
        });
        return deferred.promise;
    };
})
;
