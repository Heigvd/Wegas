'use strict';
var ServiceURL =  "/api/" // "http://localhost:8080/Wegas/"; // "/api/"; 
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