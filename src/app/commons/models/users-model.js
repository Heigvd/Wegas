'use strict';
angular.module('wegas.models.users', [])
    .service('UsersModel', function ($http, $q) {
        var model = this,
            users,
            authenticatedUser = null;

        model.getUsers = function() {
            return "Here is all users";
        };

        model.isLogged = function(){
            var deferred = $q.defer();
            $http.get(ServiceURL + "rest/User/LoggedIn").success(function(data){
                deferred.resolve(data);
            });
            return deferred.promise;
        };
        model.getAuthenticatedUser = function(){
            var deferred = $q.defer();
            if(authenticatedUser != null){
                deferred.resolve(authenticatedUser);
            }else{
                $http.get(ServiceURL + "rest/User/Current").success(function(data){
                    authenticatedUser = data;
                    deferred.resolve(data);
                }).error(function(data){
                    authenticatedUser = null;
                    deferred.resolve(authenticatedUser);
                });
            }
            return deferred.promise;
        };

        model.login = function(login, password){
            var deferred = $q.defer();
            var AuthenticationInformation = {"@class":"AuthenticationInformation","login":login,"password":password,"remember":true}
            $http.post(ServiceURL + "rest/User/Authenticate", AuthenticationInformation).success(function(data){
                deferred.resolve(true);
                model.getauthenticatedUser();
            }).error(function(data){
                deferred.resolve(false);
            });
            return deferred.promise;
        };
        
        model.logout = function(){
            var deferred = $q.defer();
            $http.get(ServiceURL + "logout").success(function(data){
                authenticatedUser = null;
                deferred.resolve(true);
            });
            return deferred.promise;
        };

        model.signup = function (email, password) {
            var obj = {
                "@class"    : "JpaAccount",
                "email"     : email,
                "password"  : password
            }
            var deferred = $q.defer();
            $http.post(ServiceURL + "rest/User/Signup",obj)
            .success(function (data){
                deferred.resolve(true);
            })
            .error(function (data) {
                deferred.resolve(data);
            });
            return deferred.promise;
        }

        model.remindPassword = function (email) {
            var obj = {
                "email" : email
            };
            var deferred = $q.defer();

            $http.post(ServiceURL + "rest/User/SendNewPassword",obj)
            .success(function (data){
                deferred.resolve(true);
            })
            .error(function (data) {
                deferred.resolve(data);
            });

            return deferred.promise;
        }
    })
;
