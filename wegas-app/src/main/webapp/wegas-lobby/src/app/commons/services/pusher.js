angular.module('wegas.service.pusher', [])
    .service('WegasPusher', function($http, $q,  $pusher) {
        var service = this, pusher, channels = [];
        service.start = function(){
            var deferred = $q.defer();
            $http.get(ServiceURL + "rest/Pusher/ApplicationKey").success(function(data) {
                if(data){
                    var client = new Pusher(data);
                    pusher = $pusher(client);
                    channels["presence-global"] = pusher.subscribe('presence-global');
                }
                deferred.resolve();
            });
            return deferred.promise;
        };
    });
