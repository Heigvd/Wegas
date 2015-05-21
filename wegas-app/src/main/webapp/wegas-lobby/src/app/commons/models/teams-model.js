angular.module('wegas.models.teams', [])
    .service('TeamsModel', function($http, $q, $interval, Auth, Responses) {
        /* Namespace for model accessibility. */
        var model = this,
            /* Cache for data */
            teams = {
                cache: null,
                findTeam: function(id) {
                    return _.find(teams.cache.data, function(t) {
                        return t.id == id;
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
                                deferred.resolve(true)
                            }
                        }, 500);
                    return deferred.promise;
                }
            },
            /* Cache all teams in a list */
            cacheTeams = function() {
                var deferred = $q.defer();
                if (teams.cache !== null) {
                    $http.get(ServiceURL + "rest/Extended/User/Current/Team").success(function(data) {
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
                if (teamToCache) {
                    teams.cache.data.push(teamToCache);
                }
            },

            /* Uncache a team in the cached teams */
            uncacheTeam = function(team) {
                if (team) {
                	teamToRemove = teams.findTeam(team.id);
                	if(teamToRemove){
	                    teams.cache.data = _.without(teams.cache.data, teamToRemove);
                	}
                }
            };

        /* Ask for all teams for current user. */
        model.getTeams = function() {
            var deferred = $q.defer();
            Auth.getAuthenticatedUser().then(function(user) {
                if (user != null) {
                    if (teams.cache != null) {
                        if (teams.cache.loading) {
                            teams.wait().then(function() {
                                deferred.resolve(Responses.success("Team found", teams.cache.data));
                            });
                        } else {
                            deferred.resolve(Responses.success("Teams found", teams.cache.data));
                        }
                    } else {
                        teams.cache = {
                            data: null,
                            loading: true
                        };
                        cacheTeams().then(function() {
                            teams.cache.loading = false;
                            deferred.resolve(Responses.success("Teams found", teams.cache.data));
                        });
                    }
                } else {
                    deferred.resolve(Responses.danger("You need to be logged", false));
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
                    deferred.resolve(Responses.success("Team refreshed", teamRefreshed));
                }).error(function(data) {
                    deferred.resolve(Responses.danger("Whoops", teamRefreshed));
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
                            deferred.resolve(Responses.success("Team find", team));
                        } else {
                            deferred.resolve(Responses.danger("No team find", false));
                        }
                	});
                } else {
                    team = teams.findTeam(id);
                    if (team) {
                        deferred.resolve(Responses.success("Team find", team));
                    } else {
                        deferred.resolve(Responses.danger("No team find", false));
                    }
                }
            } else {
                model.getTeams(teamsListName).then(function() {
                    team = teams.findTeam(id);
                    if (team) {
                        deferred.resolve(Responses.success("Team find", team));
                    } else {
                        deferred.resolve(Responses.danger("No team find", false));
                    }
                });
            }
            return deferred.promise;
        };

        /* Create a team, the current player passing the name */
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
                        var cachedTeam = _.find(teams.cache.data, function(t) {
                            return t.name == teamName;
                        });
                        if (cachedTeam) {
                            deferred.resolve(Responses.info("You have already join this team", false));
                        } else {
                            newTeam.name = teamName;
                            $http.post(ServiceURL + "rest/GameModel/Game/" + session.id + "/Team", newTeam).success(function(team) {
                                deferred.resolve(Responses.success("Team created", team));
                            }).error(function(data) {
                                deferred.resolve(Responses.danger("Error during team creation", false));
                            });
                        }
                    } else {
                        deferred.resolve(Responses.danger("Session is closed", false));
                    }
                } else {
                    deferred.resolve(Responses.danger("You need to be logged", false));
                }
            });
            return deferred.promise;
        };

        /* Join a team for current player */
        model.joinTeam = function(sessionToJoin, teamId) {
            var deferred = $q.defer();
            Auth.getAuthenticatedUser().then(function(user) {
                if (user != null) {
                	if(sessionToJoin.access == "CLOSE"){
                        deferred.resolve(Responses.error("Session closed", false));
                	}else{
	                    var cachedTeam = teams.findTeam(teamId);
	                    if (cachedTeam) {
	                        deferred.resolve(Responses.info("You have already join this team", false));
	                    } else { 					
	                        $http.post(ServiceURL + "rest/Extended/GameModel/Game/Team/" + teamId + "/Player").success(function(team) {
	                            if (team) {
                                    cacheTeam(team);
	                                deferred.resolve(Responses.success("You have join the team", team));
	                            } else {
	                                deferred.resolve(Responses.danger("Error during joining team", false));
	                            }
	                        }).error(function(data) {
	                            deferred.resolve(Responses.danger("Error during joining team", false));
	                        });
	                    }
                    }
                } else {
                    deferred.resolve(Responses.danger("You need to be logged", false));
                }
            });
            return deferred.promise;
        };

        /* Join an individual session for current player */
        model.joinIndividually = function(sessionToJoin) {
            var deferred = $q.defer();
            Auth.getAuthenticatedUser().then(function(user) {
            	if(user !== null){
            		if(sessionToJoin.access == "CLOSE"){
                        deferred.resolve(Responses.error("Session closed", false));
                	}else{
		            	var alreadyJoined = false;
		            	sessionToJoin.teams.forEach(function(teamJoinable){
		            		teams.cache.data.forEach(function(teamJoined){
    		            		if(teamJoinable.id == teamJoined.id){
    		            			alreadyJoined = true;
    		            		}
                            });
		            	});
		                if (alreadyJoined) {
		                    deferred.resolve(Responses.info("You have already join this session", false));
		                } else {
		                    $http.post(ServiceURL + "rest/Extended/GameModel/Game/" + sessionToJoin.id + "/Player").success(function(individualTeamJoined) {
	                            cacheTeam(individualTeamJoined);
		                        deferred.resolve(Responses.success("Session joined", individualTeamJoined));
		                    }).error(function(data) {
		                        deferred.resolve(Responses.danger("Error during joining session", false));
		                    });
		                }
		            }
                } else {
                    deferred.resolve(Responses.danger("You need to be logged", false));
                }
            });
            return deferred.promise;
        };


        /* Leave a team for current player */
        model.leaveTeam = function(teamId) {
            var deferred = $q.defer(),
                player = undefined;
            Auth.getAuthenticatedUser().then(function(u) {
                if (u != null) {
                    var cachedTeam = teams.findTeam(teamId);
                    if (!cachedTeam) {
                        deferred.resolve(Responses.danger("No team to leave", false));
                    } else {
                        player = _.find(cachedTeam.players, function(p) {
                            return p.userId == u.id;
                        });
                        if (player) {
                            $http.delete(ServiceURL + "rest/GameModel/Game/Team/" + player.teamId + "/Player/" + player.id).success(function(data) {
                                uncacheTeam(cachedTeam);
                                deferred.resolve(Responses.success("Player has leaved the team", teams.cache.data));
                            }).error(function(data) {
                                deferred.resolve(Responses.danger("Error during player leaving team", false));
                            });
                        } else {
                            deferred.resolve(Responses.danger("No player found in the team", false));
                        }
                    }
                } else {
                    deferred.resolve(Responses.danger("You need to be logged", false));
                }
            });
            return deferred.promise;
        };
    });