angular.module('private', [
   'private.player',
   'private.trainer',
   'private.scenarist'
])
.config(function ($stateProvider) {
    $stateProvider
        .state('wegas.private', {
            url: '',
            abstract:true,
            views: {
                'main@': {
                    controller: 'PrivateCtrl as privateCtrl',
                    templateUrl: 'app/private/private.tmpl.html'
                }
            }
        })
    ;
})
.controller('PrivateCtrl', function PrivateCtrl($state) {
    var privateCtrl = this;
    console.log("Chargement private view");    
});