angular
.module('private.scenarist.history', [
    'private.scenarist.history.directives'
    ])
.config(function ($stateProvider) {
    $stateProvider
    .state('wegas.private.scenarist.history', {
        url: '/:scenarioId/history',
        views: {
            'modal@wegas.private': {
                controller: 'ScenaristHistory',
            }
        }
    });
})
.controller("ScenaristHistory", function ScenaristHistory($animate, $state, ModalService){

    ModalService.showModal({
        templateUrl: 'app/private/scenarist/history/history.tmpl.html',
        controller: "ModalsController as modalsCtrl"
    }).then(function(modal) {
        var box = $(".modal"),
            shadow = $(".shadow");

        $('body').addClass('modal-displayed');
        $animate.addClass(box, "modal--open");
        $animate.addClass(shadow, "shadow--show");

        modal.close.then(function(result) {
            $('body').removeClass('modal-displayed');
            $state.go("^");
        });
    });

})

// .controller('HistoryCtrl', function HistoryCtrl($state, Auth, ViewInfos, $scope) {
    // var historyCtrl = this;
    // Auth.getAuthenticatedUser().then(function(user){
    //     if(user != null){
    //         ViewInfos.editName("Scenarist workspace");
    //     }
    // });
// });