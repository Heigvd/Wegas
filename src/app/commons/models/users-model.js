'use strict';
angular.module('wegas.models.users', [])
    .service('UsersModel', function ($http, $q) {
        var model = this,
            users,
            authenticateUser = null;

        model.getUser = function() {
            return "Here is all users";
        };
        model.isLogged = function(){
            var deferred = $q.defer();
            $http.get(ServiceURL + "rest/User/LoggedIn").success(function(data){
                deferred.resolve(data);
            });
            return deferred.promise;

        };
        model.login = function(){
            authenticateUser = {id:6, login:"Raph", isPlayer:true, isTrainer:true, isScenarist:false};
        	return true;
        };
        model.getAuthenticateUser = function(){
            var deferred = $q.defer();
            if(authenticateUser != null){
                deferred.resolve(authenticateUser);
            }else{
                $http.get(ServiceURL + "rest/User/Current").success(function(data){
                    authenticateUser = data;
                    deferred.resolve(data);
                });
            }
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
