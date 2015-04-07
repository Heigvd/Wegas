angular.module('private.player.sessions.directives', [])
.directive('playerSessionsIndex', function(){
    return {
        templateUrl: 'app/private/player/sessions/sessions-directives.tmpl/sessions-index.tmpl.html',
        controller : 'PlayerSessionsController as playerSessionsCtrl'
    };
}).controller("PlayerSessionsController", function PlayerSessionsIndexController($rootScope, $state, SessionsModel){
    /* Assure access to ctrl. */
    var ctrl = this,

    /* Method used to update sessions. */
    updateSessions = function(){
        SessionsModel.getPlayedSessions().then(function(sessions){
            ctrl.sessions = sessions;
        });
    };

    /* Container for datas. */
    ctrl.sessions = [];

    /* Method used to check token for adding a session. */ 
    ctrl.checkToken = function(token){
        SessionsModel.findSessionToJoin(token).then(function(session){
            if(session){
                if(session.properties.freeForAll){
                    SessionsModel.joinIndividualSession(token).then(function(data){
                        if(data){
                            updateSessions();
                        }
                    });
                }else{
                    $state.go('wegas.private.player.sessions.join', {token: session.token});                        
                }
            }
        });
    };
    /*  */
    ctrl.leaveSession = function(sessionId){
        SessionsModel.leaveSession(sessionId).then(function(data){
            if(data){
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
    SessionsModel.getPlayedSessions().then(function(sessions){
        ctrl.sessions = sessions;
    });
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