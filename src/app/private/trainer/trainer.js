angular.module('private.trainer', [
    'private.trainer.sessions'
])
.config(function ($stateProvider) {
    $stateProvider
        .state('wegas.private.trainer', {
            url: 'trainer',
            views: {
                'workspace': {
                    controller: 'TrainerCtrl as trainerCtrl',
                    templateUrl: 'app/private/trainer/sessions/sessions.tmpl.html'
                }
            }
        })
    ;
})
.controller('TrainerCtrl', function TrainerCtrl($state, Auth, ViewInfos) {
    var trainerCtrl = this;
    Auth.getAuthenticatedUser().then(function(user){
        if(user != null){
            if(!user.isTrainer){
                $state.go("wegas.private.player");
            }
            ViewInfos.editName("Trainer workspace");
        }
    });
});