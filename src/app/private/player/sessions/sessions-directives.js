angular.module('private.player.sessions.directives', [])
.directive('playerSessionsIndex', function(){
    return {
        templateUrl: 'app/private/player/sessions/sessions-directives.tmpl/sessions-index.tmpl.html',
        controller : 'PlayerSessionsController as playerSessionsCtrl'
    };
}).controller("PlayerSessionsController", function PlayerSessionsIndexController($rootScope, $state, SessionsModel, Flash){
    /* Assure access to ctrl. */
    var ctrl = this,

    /* Method used to update sessions. */
    updateSessions = function(){
        SessionsModel.getPlayedSessions().then(function(response){
            if(response.data){
                var sessions = response.data;
                ctrl.sessions = sessions;
            }else{
                ctrl.sessions = [];
            }
        });
    };

    /* Container for datas. */
    ctrl.sessions = [];

    /* Method used to check token for adding a session. */ 
    ctrl.checkToken = function(token){
        SessionsModel.findSessionToJoin(token).then(function(findResponse){
            if(findResponse.data){
                var session = findResponse.data;
                if(session.properties.freeForAll){
                    SessionsModel.joinIndividualSession(token).then(function(joinResponse){
                        if(joinResponse.data){
                            updateSessions();
                        }
                        Flash(joinResponse.level, joinResponse.message);
                    });
                }else{
                    $state.go('wegas.private.player.sessions.join', {token: session.token});                        
                }
            }else{
                Flash(findResponse.level, findResponse.message);
            }
        });
    };
    /*  */
    ctrl.leaveSession = function(sessionId){
        SessionsModel.leaveSession(sessionId).then(function(response){
            Flash(response.level, response.message);
            if(response.data){
                updateSessions();
            }
        });
    }

    /* Listen for new session */
    $rootScope.$on('newSession', function(e, hasNewData){
        if(hasNewData){
            updateSessions();
        }
    });

    /* Initialize datas */
    updateSessions();
})
.directive('playerSessionJoinForm', function() {
  return {
    templateUrl: 'app/private/player/sessions/sessions-directives.tmpl/session-join-form.tmpl.html',
    scope: {
        checkToken: "=" 
    },
    link : function(scope, element, attrs){
        // Link the token input
        scope.sessionToJoin = {
            token : ""
        };
        
        // Use checkToken from index to join a new session. 
        scope.joinSession = function(){
            scope.checkToken(scope.sessionToJoin.token);
        };
    }
  };
})
.directive('playerSessionsList', function() {
  return {
    templateUrl: 'app/private/player/sessions/sessions-directives.tmpl/sessions-list.tmpl.html',
    scope: {
        sessions : "=",
        leave: "="
    }
  };
})
;