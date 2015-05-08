angular.module('private.trainer.users', [
    'private.trainer.users.directives'
])
.config(function ($stateProvider) {
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
}).controller("TrainerUsersController", function TrainerUsersController($animate, $state, ModalService, Auth){
    Auth.getAuthenticatedUser().then(function(user) {
        if (user != null) {
            if (user.isAdmin || user.isScenarist || user.isTrainer) {
                ModalService.showModal({
                    templateUrl: 'app/private/trainer/users/users.tmpl.html',
                    controller: "ModalsController as modalsCtrl"
                }).then(function(modal) {
                    var box = $(".modal"),
                        shadow = $(".shadow");
                    $animate.addClass(box, "modal--open");
                    $animate.addClass(shadow, "shadow--show");

                    modal.close.then(function(result) {
                        $state.go("^");
                    });
                });
            }
        }
    });
});