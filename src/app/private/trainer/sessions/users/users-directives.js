angular.module('private.trainer.sessions.users.directives', [
])
.directive('trainerSessionsUsersIndex', function(){
	return {
    	templateUrl: 'app/private/trainer/sessions/users/users-directives.tmpl/users-index.tmpl.html',
    	controller : "TrainerSessionsUsersIndexCtrl as usersIndexCtrl"
  	};
}).controller("TrainerSessionsUsersIndexCtrl", function TrainerSessionsUsersIndexCtrl($stateParams, SessionsModel){
	var ctrl = this;
    ctrl.session = {},
    ctrl.playersViewActived = true;
    SessionsModel.getManagedSession($stateParams.id).then(function(session){
        ctrl.session = session;
    });
    ctrl.updateSession = function(){
        SessionsModel.getManagedSession($stateParams.id).then(function(session){
            ctrl.session = session;
        });
    };
    ctrl.activePlayersView = function(){
        ctrl.playersViewActived = true;
    };

    ctrl.activeTrainersView = function(){
        ctrl.playersViewActived = false;
    };

}).directive('trainerSessionsUsersIndividualList', function() {
    return {
        templateUrl: 'app/private/trainer/sessions/users/users-directives.tmpl/users-individual-list.tmpl.html',
        restrict: 'A',
        require: "^trainerSessionsUsersIndex",
        scope: {
           players: '='
        },
        link : function(scope, element, attrs, parentCtrl){
            console.log("Implement actions on players");
        }
    }
})
.directive('trainerSessionsUsersTeamList', function() {
    return {
        templateUrl: 'app/private/trainer/sessions/users/users-directives.tmpl/users-team-list.tmpl.html',
        restrict: 'A',
        require: "^trainerSessionsUsersIndex",
        scope: {
           teams: '='
        },
        link : function(scope, element, attrs, parentCtrl){
            console.log("Implement actions on teams");
        }
    }
});