angular.module('wegas.service.pusher', [])
    .service('WegasPusher', function($http, $q,  $pusher) {
        var service = this, pusher, channels = [];
        service.start = function(){
            var deferred = $q.defer();
            $http.get(ServiceURL + "rest/Pusher/ApplicationKey").success(function(key) {
                if(key){
                    var client = new Pusher(key);
                    pusher = $pusher(client);
                    $http.post(ServiceURL + "rest/Pusher/auth", {
                        "socket_id": client.connection.socket_id,
                        "channel_name": 'presence-global'
                    }).success(function(data) {
                        channels["presence-global"] = pusher.subscribe('presence-global');
                    });
                }
                deferred.resolve();
            });
            return deferred.promise;
        };
    });
