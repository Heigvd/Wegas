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
    formatPlayers = function(data){
        data.forEach(function(session){
            if(!session.properties.freeForAll){
                var teams = session.teams;
                teams.forEach(function(team){
                    if(team["@class"] == "DebugTeam"){
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
        });
        return data;
    },

    /* Call the REST service for getting managed sessions. */
    cacheManagedSessions = function () {
        var deferred = $q.defer();
        console.log("Load HTTP");
        $http.get(ServiceURL + "rest/GameModel/Game?view=EditorExtended").success(function(data){
            data = formatPlayers(data);
            managedSessions = data;
            console.log("Data loadded");
            deferred.resolve(managedSessions);
        }).error(function(data){
            managedSessions = [];
            deferred.resolve(managedSessions);
        });
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
        var deferred = $q.defer(),
            session;
        if(managedSessionsLoading){
            waitForManagedSessions().then(function(){
                session = findSession(managedSessions, id);
                deferred.resolve(session);
            });
        }else{
            if(managedSessions == null) {
                model.getManagedSessions().then(function(){
                    session = findSession(managedSessions, id);
                    deferred.resolve(managedSessions);
                });
            }else{
                session = findSession(managedSessions, id);
                deferred.resolve(session);
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
                        $http.get(ServiceURL + "rest/GameModel/Game/JoinGame/"+ token).success(function(data){
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

    /* Remove data from sessions caches */
    model.clearCache = function(){
        managedSessions = null;
        playedSessions = null;
    };
})
;
