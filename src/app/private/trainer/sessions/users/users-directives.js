angular.module('private.trainer.sessions.users.directives', [
    'wegas.directives.search.users'
])
.directive('trainerSessionsUsersIndex', function(){
	return {
        scope : {
            close: "&"
        },
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

    ctrl.addTrainer = function(){
        // Not implemented
    }

})
.directive('trainerSessionsUsersTrainersList', function() {
    return {
        templateUrl: 'app/private/trainer/sessions/users/users-directives.tmpl/users-trainers-list.tmpl.html',
        restrict: 'A',
        require: "^trainerSessionsUsersIndex",
        scope: {
           trainers: '='
        },
        link : function(scope, element, attrs, parentCtrl){
            // Implement actions on trainers
        }
    }
})
.directive('trainerSessionsUsersIndividualList', function() {
    return {
        templateUrl: 'app/private/trainer/sessions/users/users-directives.tmpl/users-individual-list.tmpl.html',
        restrict: 'A',
        require: "^trainerSessionsUsersIndex",
        scope: {
           players: '='
        },
        link : function(scope, element, attrs, parentCtrl){
            // Implement actions on individual players 
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
        }
    }
});