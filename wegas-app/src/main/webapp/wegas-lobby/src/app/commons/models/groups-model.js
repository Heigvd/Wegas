'use strict';
angular.module('wegas.models.groups', [])
    .service('GroupsModel', function($http, $q, $interval, Responses, Auth) {
        var model = this,
            groups = null,
            loadingGroups = false,
            
            /* Cache a group, passing the group to add in parameter */
            cacheGroup = function(group) {
                if (group && groups) {
                    if (!_.find(groups, group)) {
                        groups.push(group);
                    }
                }
                return groups;
            },

            /* Uncache a group, passing a group to remove in parameter */
            uncacheGroup = function(group) {
                if (groups && group) {
                    groupToUncache = _.find(groups, function(g){ return g.id == group.id });
                    if (groupToUncache) {
                        groups = _.without(groups, groupToUncache);
                    }
                }
                return groups;
            },
            /* Cache all groups in a list */
            cacheGroups = function(){
                var deferred = $q.defer(),
                	url = "rest/Role";
                
                $http.get(ServiceURL + url, {
                    "headers": {
                        "managed-mode": "true"
                    }
                }).success(function(data) {
                    if (data.events !== undefined && data.events.length == 0) {
                        groups = data.entities;
                        deferred.resolve(Responses.success("Profile loaded", groups));
                    } else if (data.events !== undefined) {
                        deferred.resolve(Responses.danger(data.events[0].exceptions[0].message, false));
                    } else {
                        deferred.resolve(Responses.danger("Error during groups loading", false));
                    }
                }).error(function(data) {
                    if (data.events !== undefined && data.events.length > 0) {
                        deferred.resolve(Responses.danger(data.events[0].exceptions[0].message, false));
                    } else {
                        deferred.resolve(Responses.danger("Error during groups loading", false));
                    }
                });
                return deferred.promise;
            },
            findGroup =  function(id) {
                return _.find(groups, function(g) {
                    return g.id == id;
                });
            },
            stopWaiting = function(waitFunction) {
                $interval.cancel(waitFunction);
            },
            wait = function() {
                var deferred = $q.defer(),
                    waitGroups = $interval(function() {
                        if (!loadingGroups) {
                            stopWaiting(waitGroups);
                            deferred.resolve(true)
                        }
                    }, 500);
                return deferred.promise;
            };

        model.getGroups = function() {
            var deferred = $q.defer();
            Auth.getAuthenticatedUser().then(function(user) {
                if (user != null) {
                	if(user.isAdmin){
			            if (groups != null) {
			                deferred.resolve(Responses.success("Groups loaded", groups));		                
			            } else {
                            if(loadingGroups == true){
                                wait().then(function(){
                                    deferred.resolve(Responses.success("Groups loaded", groups));                       
                                });
                            }else{
                                loadingGroups = true;
                                cacheGroups().then(function(response){
                                    loadingGroups = false;
                                    deferred.resolve(response);                       
                                });
                            }
			            }    
		        	}else{
	                	deferred.resolve(Responses.success("You need to be admin", false));
		        	}
	            }else{
	                deferred.resolve(Responses.success("You need to be logged", false));
	            }
	        });
            return deferred.promise;
        };

        /* Ask for one managed session. */
        model.getGroup = function(id) {
            var deferred = $q.defer(),
                group = undefined;
            if (groups == null) {
                if (loadingGroups) {
                    wait().then(function() {
                        group = findGroup(id);
                        if (group) {
                            deferred.resolve(Responses.success("Group find", group));
                        } else {
                            deferred.resolve(Responses.danger("No group find", false));
                        }
                    });
                } else {
                    model.getGroups().then(function() {
                        group = findGroup(id);
                        if (group) {
                            deferred.resolve(Responses.success("Group find", group));
                        } else {
                            deferred.resolve(Responses.danger("No group find", false));
                        }
                    });
                }
            } else {
                group = findGroup(id);
                if (group) {
                    deferred.resolve(Responses.success("Group find", group));
                } else {
                    deferred.resolve(Responses.danger("No group find", false));
                }
            }
            return deferred.promise;
        };

        model.addGroup = function(name) {
            var deferred = $q.defer(),
                groupToAdd = {
                "id":"",
                "@class":"Role",
                "name":name,
                "permissions":[]
            };

            $http.post(ServiceURL + "rest/Role", groupToAdd, {
                "headers": {
                    "managed-mode": "true"
                }
            })
                .success(function(data) {
                    if (data.events !== undefined && data.events.length == 0) {
                        var newGroup = data.entities[0];
                        cacheGroup(newGroup);
                        deferred.resolve(Responses.success('New group', newGroup));
                    } else if (data.events !== undefined) {
                        deferred.resolve(Responses.danger(data.events[0].exceptions[0].message, false));
                    } else {
                        deferred.resolve(Responses.danger("Whoops...", false));
                    };
                }).error(function(data) {
                    if (data.events !== undefined && data.events.length > 0) {
                        deferred.resolve(Responses.danger(data.events[0].exceptions[0].message, false));
                    } else {
                        deferred.resolve(Responses.danger("Whoops...", false));
                    }
                });
            return deferred.promise;
        };

        model.updateGroup = function(group) {
            var deferred = $q.defer();

            var url = "rest/Role/" + group.id;
            $http
                .put(ServiceURL + url, group, {
                    "headers": {
                        "managed-mode": "true"
                    }
                })
                .success(function(data) {
                    if (data.events !== undefined && data.events.length == 0) {
                        groups = uncacheGroup(group);
                        groups = cacheGroup(group);
                        deferred.resolve(Responses.success("Group updated", data.entities));
                    } else if (data.events !== undefined) {
                        deferred.resolve(Responses.danger(data.events[0].exceptions[0].message, false));
                    } else {
                        deferred.resolve(Responses.danger("Whoops...", false));
                    }
                }).error(function(data) {
                    if (data.events !== undefined && data.events.length > 0) {
                        deferred.resolve(Responses.danger(data.events[0].exceptions[0].message, false));
                    } else {
                        deferred.resolve(Responses.danger("Whoops...", false));
                    }
                });
            return deferred.promise;
        }

        model.deleteGroup = function(group) {
            var deferred = $q.defer();

            var url = "rest/Role/" + group.id;

            $http
                .delete(ServiceURL + url, {
                    "headers": {
                        "managed-mode": "true"
                    }
                })
                .success(function(data) {
                    if (data.events !== undefined && data.events.length == 0) {
                        groups = uncacheGroup(group);
                        deferred.resolve(Responses.success("Group deleted", data.entities));
                    } else if (data.events !== undefined) {
                        deferred.resolve(Responses.danger(data.events[0].exceptions[0].message, false));
                    } else {
                        deferred.resolve(Responses.danger("Whoops...", false));
                    }
                }).error(function(data) {
                    if (data.events !== undefined && data.events.length > 0) {
                        deferred.resolve(Responses.danger(data.events[0].exceptions[0].message, false));
                    } else {
                        deferred.resolve(Responses.danger("Whoops...", false));
                    }
                });


            return deferred.promise;
        }




        
    });