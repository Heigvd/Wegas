var ServiceURL =  "/api/"
angular.module('Wegas', [
    'ui.router',
    'public',
    'private'
])
.config(function ($stateProvider, $urlRouterProvider) {
    $stateProvider
        .state('wegas', {
            url: '/',
            views: {
                'main@': {
                    controller: 'WegasMainCtrl as wegasMailCtrl',
                    templateUrl: 'app/app.tmpl.html'
                }
            }
        })
    ;
    $urlRouterProvider.otherwise('/');
}).controller('WegasMainCtrl', function WegasMainCtrl($state) {
    var wegasMailCtrl = this;
    console.log("Chargement main ctrl");    
    $state.go("wegas.public");
});
