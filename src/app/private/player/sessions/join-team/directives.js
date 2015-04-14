angular.module('private.player.session.join.directives', [])
.directive('playerSessionJoinIndex', function(){
    return {
        templateUrl: 'app/private/player/sessions/join-team/directives.tmpl/index.html',
        scope:{
            close: "&"
        },
        controller: 'PlayerSessionJoinController as playerSessionJoinCtrl'
    };
}).controller('PlayerSessionJoinController', function PlayerSessionJoinController($rootScope, $scope, $stateParams, SessionsModel, Flash){
    /* Assure access to ctrl. */
    var ctrl = this;

    /* Container for datas */
    ctrl.sessionToJoin = {};
    ctrl.newTeam = {
        name: "",
        alreadyUsed: false
    };

    ctrl.checkNameUsability = function(){
        var alreadyUsed = false;
        if(ctrl.sessionToJoin.teams){
            ctrl.sessionToJoin.teams.forEach(function(team){
                if(team.name == ctrl.newTeam.name){
                    alreadyUsed = true;
                }
            });
        }
        ctrl.newTeam.alreadyUsed = alreadyUsed;
    };

    /* Method used to create new team and join this new team in the session. */
    ctrl.createAndJoinTeam = function(){
        if(!ctrl.newTeam.alreadyUsed){
            if(ctrl.sessionToJoin.access != "CLOSE"){
                SessionsModel.createTeam(ctrl.sessionToJoin, ctrl.newTeam.name).then(function(responseCreate){
                    responseCreate.flash();
                    if(!responseCreate.isErroneous()){
                        SessionsModel.joinTeam(ctrl.sessionToJoin.id, responseCreate.data.id).then(function(responseJoin){
                            responseJoin.flash();
                            if(!responseJoin.isErroneous()){
                                $rootScope.$emit('newSession', true);
                                $scope.close();
                            }
                        });
                    }
                });
            }else{
                Flash.danger("Session closed");
            }
        }else{
            Flash.danger("Team name already used");
        }
    };

    /* Method used to join existing team in the session. */
    ctrl.joinTeam = function(teamId){
        if(ctrl.sessionToJoin.access != "CLOSE"){
            SessionsModel.joinTeam(ctrl.sessionToJoin.id, teamId).then(function(response){
                response.flash();
                if(!response.isErroneous()){
                    $rootScope.$emit('newSession', true);
                    $scope.close();
                }
            });
        }else{
            Flash.danger("Session closed");
        }
    };

    /* Initialize datas */
    SessionsModel.findSessionToJoin($stateParams.token).then(function(response){
        if(response.isErroneous()){
            $scope.close();
        }else{
            if(!response.data.properties.freeForAll){
                ctrl.sessionToJoin = response.data;
            }else{
                $scope.close();
            }
        }
    });
})
.directive('playerSessionTeamsList', function() {
  return {
    templateUrl: 'app/private/player/sessions/join-team/directives.tmpl/teams-list.html',
    scope: {
        teams : "=",
        joinTeam : "="
    }
  };
})
.directive('playerSessionAddTeam', function(){
    return {
        templateUrl: 'app/private/player/sessions/join-team/directives.tmpl/add-team.html',
        scope: {
            newTeam: "=",
            createAndJoinTeam: "&",
            checkNameUsability: "&"   
        },
        link: function(scope, elem, attrs){
            scope.$watch(function(){return scope.newTeam.name;}, function(newVal){
                scope.checkNameUsability();
            });
        }
    };
});