angular.module('autologin', [
    'wegas.models.sessions'
])
.config(function ($stateProvider) {
    $stateProvider
        .state('wegas.autologin', {
            url: 'play/:token',
            views: {
                'main@': {
                    controller: 'AutologinCtrl as autologinCtrl',
                    templateUrl: 'app/autologin/autologin.tmpl.html'
                }
            }
        })
    ;
})
.controller('AutologinCtrl', function AutologinCtrl(Auth, Flash, $scope, $state, $stateParams, SessionsModel) {
    var ctrl = this,
        errorRedirect = function(response){
            response.flash();
            $state.go("wegas");
        },
        joinIndividualSession = function(session){
            SessionsModel.joinIndividualSession($stateParams.token).then(function(response){
                if(!response.isErroneous()){
                    window.location.href = ServiceURL + "game-play.html?gameId=" + session.id;
                }else{
                    errorRedirect(response);
                }
            });
        };
    SessionsModel.findSessionToJoin($stateParams.token).then(function(responseToken){
        if(!responseToken.isErroneous()){
            Auth.getAuthenticatedUser().then(function(user){
                if(user){
                    var session = responseToken.data;
                    SessionsModel.getSession("played", session.id).then(function(responsePlayedSession){
                        if(!responsePlayedSession.isErroneous()){
                            window.location.href = ServiceURL + "game-play.html?gameId=" + session.id;
                        } else {
                            if(session.properties.freeForAll){
                                joinIndividualSession(session);
                            } else {
                                $state.go("wegas.private.player.join", {'token': $stateParams.token});                    
                            }
                        }
                    });
                } else {
                    var session = responseToken.data;
                    Auth.loginAsGuest().then(function(responseAuth){
                        if(!responseAuth.isErroneous()){
                            if(session.properties.freeForAll){
                                joinIndividualSession(session);
                            } else {
                                $state.go("wegas.private.player.join", {'token': $stateParams.token});                    
                            }
                        } else {
                            errorRedirect(responseToken);
                        }
                    });
                }
            });            
        } else {
            errorRedirect(responseToken);
        }
    });
});