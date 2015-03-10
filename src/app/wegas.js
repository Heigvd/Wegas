'use strict';
var ServiceURL = "http://localhost:8080/Wegas/"
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