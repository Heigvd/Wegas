'use strict';

angular.module('Wegas', [
    'ui.router',
    'users'
])
.config(function ($stateProvider, $urlRouterProvider) {
    $stateProvider
        .state('wegas', {
            url: '',
            abstract: true
        })
    ;
    $urlRouterProvider.otherwise('/');
})
;