angular.module('private.trainer', [
    'private.trainer.directives',
    'private.trainer.archives',
    'private.trainer.users',
    'private.trainer.settings'
])
.config(function ($stateProvider) {
    $stateProvider
        .state('wegas.private.trainer', {
            url: 'trainer',
            views: {
                'workspace': {
                    controller: 'TrainerCtrl as trainerCtrl',
                    templateUrl: 'app/private/trainer/trainer.tmpl.html'
                }
            }
        })
    ;
})
.controller('TrainerCtrl', function TrainerCtrl($state, Auth, ViewInfos) {
    var trainerCtrl = this;
    Auth.getAuthenticatedUser().then(function(user){
        if(user != null){
            if(!user.isAdmin && !user.isScenarist && !user.isTrainer){
                $state.go("wegas.private.player");
            }
            ViewInfos.editName("Trainer workspace");
        }
    });
})
;