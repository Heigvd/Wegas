'use strict';
angular.module('wegas.models.users', [])
    .service('UsersModel', function ($http) {
        var model = this,
            users,
            authenticateUser;
        model.getUser = function() {
            return "Here is all users for a trainer";
        };
        model.isLogged = function(){
            var isLogged = false;
            $http.get("http://localhost:8080/Wegas/rest/User/LoggedIn").success(function(data){
                isLogged = data;
                console.log("isLogged : " + data);
            });
            return isLogged;
        };
        model.login = function(){
            authenticateUser = {id:6, login:"Raph", isPlayer:true, isTrainer:true, isScenarist:false};
        	return true;
        };
        model.getAuthenticateUser = function(){
            return authenticateUser;
        };
    })
;
