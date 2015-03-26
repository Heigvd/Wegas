angular.module('private.trainer.sessions.users', [
    'private.trainer.sessions.users.directives'
])
.config(function ($stateProvider) {
    $stateProvider
        .state('wegas.private.trainer.sessions.users', {
            url: '/:id/users',
            views: {
                'modal@wegas.private':{
                    controller: 'TrainerSessionsUsers as trainerSessionsUsers',
                    templateUrl: 'app/private/trainer/sessions/users/users.tmpl.html'
                }
            }
        })
    ;
}).controller("TrainerSessionsUsers", function TrainerSessionsUsers($state){
    var trainerSessionsUsers = this;
    trainerSessionsUsers.openModal = "open";
    trainerSessionsUsers.hideModal = function(){
        trainerSessionsUsers.openModal = "close";
    };
    trainerSessionsUsers.moveToSessionsList = function(){
        $state.go("wegas.private.trainer.sessions");
    };
});