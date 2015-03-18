angular.module('wegas.service.auth', [
    'wegas.models.sessions'
    ])
    .service('Auth', function ($http, $q) {
        var service = this,
            authenticatedUser = null,
            rights = null;

        service.getAuthenticatedUser = function(){
            var deferred = $q.defer();
            if(authenticatedUser != null){
                deferred.resolve(authenticatedUser);
            }else{
                $http.get(ServiceURL + "rest/User/Current").success(function(data){
                    authenticatedUser = {
                        id: data.id,
                        email: data.accounts.email,
                        username: data.accounts.username,
                        firstname: data.accounts.firstname,
                        lastname: data.accounts.lastname,
                        isTrainer: false,
                        isScenarist: false
                    };
                    $http.get(ServiceURL + "rest/Extended/User/" + authenticatedUser.id).success(function(data){
                        rights = data.accounts[0].roles;
                        rights.forEach(function(elem){
                            switch(elem.name){
                                case "Trainer":
                                    authenticatedUser.isTrainer = true;
                                    break;
                                case "Scenarist":
                                    authenticatedUser.isScenarist = true;
                                    break;
                            }
                        });
                        deferred.resolve(authenticatedUser);
                    });
                }).error(function(data){
                    authenticatedUser = null;
                    deferred.resolve(authenticatedUser);
                });
            }
            return deferred.promise;
        };

        service.login = function(login, password){
            var deferred = $q.defer();
            var AuthenticationInformation = {"@class":"AuthenticationInformation","login":login,"password":password,"remember":true}
            $http.post(ServiceURL + "rest/User/Authenticate", AuthenticationInformation).success(function(data){
                deferred.resolve(true);
                service.getAuthenticatedUser();
            }).error(function(data){
                deferred.resolve(false);
            });
            return deferred.promise;
        };
        
        service.logout = function(){
            var deferred = $q.defer();
            $http.get(ServiceURL + "logout").success(function(data){
                authenticatedUser = null;
                deferred.resolve(true);
            });
            return deferred.promise;
        };

        service.signup = function (email, password) {
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
        };

        service.remindPassword = function (email) {
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
        };
    })
;
