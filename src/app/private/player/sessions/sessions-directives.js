angular.module('private.player.sessions.directives', [])
.directive('playerSessionsIndex', function(){
    return {
        templateUrl: 'app/private/player/sessions/sessions-directives.tmpl/sessions-index.tmpl.html',
        controller : 'PlayerSessionsIndexController as playerSessionsIndexCtrl'
    };
}).controller("PlayerSessionsIndexController", function PlayerSessionsIndexController(SessionsModel){
    var ctrl = this;
    ctrl.sessions = [];
    ctrl.searchTeam = "";
    ctrl.sessionJoinable = false;
    ctrl.sessionToJoin = {};

    SessionsModel.getPlayedSessions().then(function(sessions){
        ctrl.sessions = sessions;
    });

    ctrl.updateSessions = function(){
        SessionsModel.getPlayedSessions().then(function(sessions){
            ctrl.sessions = sessions;
        });
    };

    ctrl.changeSessionToJoin = function(newSession){
        ctrl.sessionJoinable = true;
        ctrl.sessionToJoin = newSession;
    };

    ctrl.updateSearchTeam = function(newName){
        ctrl.searchTeam = newName;
    };

    ctrl.joinTeam = function(teamId){
        SessionsModel.joinTeam(ctrl.sessionToJoin.id, teamId).then(function(sessionUpdated){
            if(sessionUpdated){
                ctrl.sessionToJoin = sessionUpdated;
            }
        });

    };
})
.directive('playerSessionJoin', function($state, ScenariosModel, SessionsModel) {
  return {
    templateUrl: 'app/private/player/sessions/sessions-directives.tmpl/session-join.tmpl.html',
    scope: false,
    require: "^playerSessionsIndex",
    link : function(scope, element, attrs, parentCtrl){
        scope.sessionToJoin = {
            token : "",
            joinable: false
        };

        var valideToken = function(session){
            if($("#session-token").hasClass("input--state-danger")){
                $("#session-token").removeClass("input--state-danger");
            }
            $("#session-token").addClass("input--state-success").attr("disabled", "disabled");
            scope.sessionToJoin.joinable = true;
            parentCtrl.changeSessionToJoin(session);

            scope.teamToSelect = {
                name : ""
            }

            scope.$watch(function(){
                return scope.teamToSelect.name
            }, function(newName, oldName){
                parentCtrl.updateSearchTeam(newName)
            });
        };

        var invalideToken = function(){
            $("#session-token").addClass("input--state-danger");
        };

        scope.joinSession = function(){
            SessionsModel.findSessionToJoin(scope.sessionToJoin.token).then(function(session){
                if(session){
                    if(session.properties.freeForAll){
                        SessionsModel.joinSession(scope.sessionToJoin.token).then(function(data){
                            scope.sessionToJoin.token = "";
                            parentCtrl.updateSessions;
                        });
                    }else{
                        valideToken(session);
                    }
                }else{
                    invalideToken();
                }
            });
        };
    }
  };
})
.directive('playerSessionsList', function() {
  return {
    templateUrl: 'app/private/player/sessions/sessions-directives.tmpl/sessions-list.tmpl.html',
    scope: false,
    require: "^playerSessionsIndex",
    link : function(scope, element, attrs, parentCtrl){
        scope.$watch(function(){
            return parentCtrl.sessions
        }, function(newSessions, oldSessions){
            scope.sessions = newSessions;
        });
    }
  };
})
.directive('playerSessionTeams', function() {
  return {
    templateUrl: 'app/private/player/sessions/sessions-directives.tmpl/session-teams.tmpl.html',
    scope: {
        sessionToJoin : "=",
        searchTeam : "="
    },
    require: "^playerSessionsIndex",
    link : function(scope, element, attrs, parentCtrl){
        scope.joinTeam = function(teamId){
            console.log("join team");
            console.log(teamId);
            parentCtrl.joinTeam(teamId);
        }

    }
  };
})
;