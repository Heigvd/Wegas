angular.module('private.trainer.users', [
    'private.trainer.users.directives'
])
.config(function ($stateProvider) {
    "use strict";
    $stateProvider
        .state('wegas.private.trainer.users', {
            url: '/:id/users',
            views: {
                'modal@wegas.private':{
                    controller: 'TrainerUsersController'
                }
            }
        })
    ;
}).controller("TrainerUsersController", function TrainerUsersController($state, WegasModalService, Auth){
    "use strict";
    Auth.getAuthenticatedUser().then(function(user) {
        if (user) {
            if (user.isAdmin || user.isScenarist || user.isTrainer) {
                WegasModalService.displayAModal({
                    templateUrl: 'app/private/trainer/users/users.tmpl.html',
                    controller: "ModalsController as modalsCtrl"
                }).then(function(modal) {
                    modal.close.then(function(result) {
                        $state.go("^");
                    });
                });
            }
        }
    });
});