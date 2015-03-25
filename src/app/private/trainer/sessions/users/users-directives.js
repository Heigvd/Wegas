angular.module('private.trainer.sessions.users.directives', [
])
.directive('trainerSessionsUsersIndex', function(){
	return {
    	templateUrl: 'app/private/trainer/sessions/users/users-directives.tmpl/users-index.tmpl.html',
    	controller : "TrainerSessionsUsersIndexCtrl as usersIndexCtrl"
  	};
}).controller("TrainerSessionsUsersIndexCtrl", function TrainerSessionsUsersIndexCtrl($stateParams, SessionsModel){
	var ctrl = this;
    ctrl.session = {};

    SessionsModel.getManagedSession($stateParams.id).then(function(session){
        ctrl.session = session;
        console.log(session);
    });
    ctrl.updateSession = function(){
        SessionsModel.getManagedSession($stateParams.id).then(function(session){
            ctrl.session = session;
        });
    };
});