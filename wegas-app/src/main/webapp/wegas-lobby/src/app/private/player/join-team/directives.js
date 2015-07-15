angular.module('private.player.join.directives', [])
.directive('playerSessionJoinIndex', function(){
    return {
        templateUrl: 'app/private/player/join-team/directives.tmpl/index.html',
        scope:{
            close: "&"
        },
        controller: 'PlayerSessionJoinController as playerSessionJoinCtrl'
    };
}).controller('PlayerSessionJoinController', function PlayerSessionJoinController($rootScope, $scope, $stateParams, $translate, $interval, SessionsModel, TeamsModel, Flash){
    /* Assure access to ctrl. */
    var ctrl = this,
        refresher = null,
        findSessionToJoin = function(){
            SessionsModel.findSessionToJoin($stateParams.token).then(function(response){
                if(response.isErroneous()){
                    $interval.cancel(refresher);
                    $scope.close();
                }else{
                    if(response.data.access != "CLOSE"){
                        if(!response.data.properties.freeForAll){
                            ctrl.sessionToJoin = response.data;
                        }else{
                            $interval.cancel(refresher);
                            $scope.close();
                        }
                    }else{
                        $translate('COMMONS-SESSIONS-CLOSE-FLASH-ERROR').then(function (message) {
                            Flash.danger(message);
                        });
                    }
                }
            });
        };

    ctrl.MAX_DISPLAYED_CHARS = MAX_DISPLAYED_CHARS;
    
    /* Container for datas */
    ctrl.sessionToJoin = null;
    ctrl.newTeam = {
        name: "",
        alreadyUsed: false
    };

    ctrl.checkNameUsability = function(){
        var alreadyUsed = false;
        if(ctrl.sessionToJoin !== null){
            if(ctrl.sessionToJoin.teams){
                ctrl.sessionToJoin.teams.forEach(function(team){
                    if(team.name == ctrl.newTeam.name){
                        alreadyUsed = true;
                    }
                });
            }
            ctrl.newTeam.alreadyUsed = alreadyUsed;
        }
    };

    /* Method used to create new team and join this new team in the session. */
    ctrl.createTeam = function(){
        if(!ctrl.newTeam.alreadyUsed){
            if(ctrl.newTeam.name != ""){
                if(ctrl.sessionToJoin.access != "CLOSE"){
                    $interval.cancel(refresher);
                    TeamsModel.createTeam(ctrl.sessionToJoin, ctrl.newTeam.name).then(function(responseCreate){
                        if(!responseCreate.isErroneous()){
                            ctrl.newTeam = false;
                            refresher = $interval(function() {
                                findSessionToJoin();
                            }, 1000);
                        }else{
                            responseCreate.flash();
                        }
                    });
                }else{
                    $translate('COMMONS-SESSIONS-CLOSE-FLASH-ERROR').then(function (message) {
                        Flash.danger(message);
                    });
                }
            }
        }
    };

    /* Method used to join existing team in the session. */
    ctrl.joinTeam = function(teamId){
        TeamsModel.joinTeam(ctrl.sessionToJoin, teamId).then(function(response){
            if(!response.isErroneous()){
                $interval.cancel(refresher);
                $rootScope.$emit('newTeam', true);
                $scope.close();
            }else{
                response.flash();
            }
        });
    };

    /* Initialize datas */
    findSessionToJoin();
    refresher = $interval(function() {
        findSessionToJoin();
    }, 1000);
})
.directive('playerSessionTeamsList', function() {
  return {
    templateUrl: 'app/private/player/join-team/directives.tmpl/teams-list.html',
    scope: {
        teams : "=",
        joinTeam : "=",
        newTeam : "="
    }
  };
})
.directive('playerSessionAddTeam', function(){
    return {
        templateUrl: 'app/private/player/join-team/directives.tmpl/add-team.html',
        scope: {
            newTeam: "=",
            createTeam: "&",
            checkNameUsability: "&"   
        },
        link: function(scope, elem, attrs){
            scope.$watch(function(){return scope.newTeam.name;}, function(newVal){
                scope.checkNameUsability();
            });
        }
    };
})
.directive('playerSessionTeam', function(WegasTranslations){
    return {
        templateUrl: 'app/private/player/join-team/directives.tmpl/team-card.html',
        scope: {
            team: "=",
            joinTeam: "="
        },
        link: function(scope, elem, attrs){
            scope.showPlayers = false;
            scope.MAX_DISPLAYED_CHARS = MAX_DISPLAYED_CHARS;
            
            scope.hideToggle = {toggle: WegasTranslations.hideToggle['SHOW'][localStorage.getObject("wegas-config@public").language]};
            scope.tooglePlayersVisibility = function(){
                scope.showPlayers = !scope.showPlayers;
                if(scope.showPlayers){
                    scope.hideToggle = {toggle: WegasTranslations.hideToggle['HIDE'][localStorage.getObject("wegas-config@public").language]};
                }else{
                    scope.hideToggle = {toggle: WegasTranslations.hideToggle['SHOW'][localStorage.getObject("wegas-config@public").language]};
                }
            }
        }
    };
});