angular.module('private.player.join.directives', [])
    .directive('playerSessionJoinIndex', function() {
        "use strict";
        return {
            templateUrl: 'app/private/player/join-team/directives.tmpl/index.html',
            scope: {
                close: "&"
            },
            controller: 'PlayerSessionJoinController as playerSessionJoinCtrl'
        };
    }).controller('PlayerSessionJoinController',
    function PlayerSessionJoinController($q, $rootScope, $scope, $controller, $stateParams, $translate, $interval, SessionsModel,
        TeamsModel, Flash) {
        /* Assure access to ctrl. */
        "use strict";
        var ctrl = this,
            REFRESH_DELAY = 5000,
            refresher = null,
            // make sure player controller exists since playerController listen to pusher
            playerController = $controller('PlayerController', {$scope: $scope}),
            findSessionToJoin = function() {
                SessionsModel.findSessionToJoin($stateParams.token).then(function(response) {
                    if (response.isErroneous()) {
                        $interval.cancel(refresher);
                        $scope.close();
                    } else {
                        if (response.data.access !== "CLOSE") {
                            if (!response.data.properties.freeForAll) {
                                ctrl.sessionToJoin = response.data;
                            } else {
                                $interval.cancel(refresher);
                                $scope.close();
                            }
                        } else {
                            $translate('COMMONS-SESSIONS-CLOSE-FLASH-ERROR').then(function(message) {
                                Flash.danger(message);
                            });
                        }
                    }
                });
            };

        /* Container for datas */
        ctrl.sessionToJoin = null;
        ctrl.newTeam = {
            name: "",
            size: "0", // Required for displaying the default label
            alreadyUsed: false,
            validSize: false
        };

        ctrl.checkSize = function() {
            ctrl.newTeam.validSize = ctrl.newTeam.size !== "0";
        };

        ctrl.checkNameUsability = function() {
            var alreadyUsed = false;
            if (ctrl.sessionToJoin !== null) {
                if (ctrl.sessionToJoin.teams) {
                    ctrl.sessionToJoin.teams.forEach(function(team) {
                        if (team.name === ctrl.newTeam.name) {
                            alreadyUsed = true;
                        }
                    });
                }
                ctrl.newTeam.alreadyUsed = alreadyUsed;
            }
        };

        /* Method used to create new team and join this new team in the session. */
        ctrl.createTeam = function() {
            var deferred = $q.defer();
            if (!ctrl.newTeam.alreadyUsed) {
                if (ctrl.newTeam.name !== "" && ctrl.newTeam.size != 0) {
                    if (ctrl.sessionToJoin.access !== "CLOSE") {
                        $interval.cancel(refresher);
                        TeamsModel.createTeam(ctrl.sessionToJoin, ctrl.newTeam.name, ctrl.newTeam.size).then(function(responseCreate) {
                            if (!responseCreate.isErroneous()) {
                                ctrl.newTeam = false;
                                findSessionToJoin();
                                refresher = $interval(function() {
                                    findSessionToJoin();
                                }, REFRESH_DELAY);
                                return deferred.resolve(true);
                            } else {
                                responseCreate.flash();
                                return deferred.resolve(false);
                            }
                        });
                    } else {
                        $translate('COMMONS-SESSIONS-CLOSE-FLASH-ERROR').then(function(message) {
                            Flash.danger(message);
                            return deferred.resolve(false);
                        });
                    }
                } else {
                    return deferred.resolve(false);
                }
            } else {
                return deferred.resolve(false);
            }
            return deferred.promise;
        };

        /* Method used to join existing team in the session. */
        ctrl.joinTeam = function(teamId) {
            var deferred = $q.defer();
            TeamsModel.joinTeam(ctrl.sessionToJoin, teamId).then(function(response) {
                if (!response.isErroneous()) {
                    $interval.cancel(refresher);
                    $rootScope.$emit('newTeam', true);
                    $scope.close();
                    deferred.resolve(true);
                } else {
                    response.flash();
                    deferred.resolve(false);
                }
            });
            return deferred.promise;
        };

        /* Initialize datas */
        findSessionToJoin();
        refresher = $interval(function() {
            findSessionToJoin();
        }, REFRESH_DELAY);
    })
    .directive('playerSessionTeamsList', function() {
        "use strict";
        return {
            templateUrl: 'app/private/player/join-team/directives.tmpl/teams-list.html',
            scope: {
                teams: "=",
                joinTeam: "=",
                newTeam: "="
            }
        };
    })
    .directive('playerSessionAddTeam', function($translate, Flash) {
        "use strict";
        return {
            templateUrl: 'app/private/player/join-team/directives.tmpl/add-team.html',
            scope: {
                newTeam: "=",
                createTeam: "&",
                checkNameUsability: "&",
                checkSize: "&"
            },
            link: function(scope, elem, attrs) {
                scope.$watch(function() {
                    return scope.newTeam.name;
                }, function(newVal) {
                    scope.checkNameUsability();
                });
                scope.$watch(function() {
                    return scope.newTeam.size;
                }, function(newVal) {
                    scope.checkSize();
                });

                scope.create = function() {
                    var button = $(elem).find(".button--create-team");
                    if (!button.hasClass("button--disable")) {
                        button.addClass("button--disable button--spinner button--rotate");
                        scope.createTeam().then(function() {
                            button.removeClass("button--disable button--spinner button--rotate");
                        });
                    } else {
                        // The name or the size have not been specified by the user:
                        if (scope.newTeam.name === "" || scope.newTeam.alreadyUsed) {
                            $translate('PLAYER-MODALE-JOIN-TEAM-CREATE-INPUT-MESSAGE').then(function(message) {
                                Flash.danger(message);
                            });
                        } else if (!scope.newTeam.validSize) {
                            $translate('PLAYER-MODALE-JOIN-TEAM-CREATE-SIZE-MESSAGE').then(function(message) {
                                Flash.danger(message);
                            });
                        }
                    }
                };
            }
        };
    })
    .directive('playerSessionTeam', function(WegasTranslations, $translate) {
        "use strict";
        return {
            templateUrl: 'app/private/player/join-team/directives.tmpl/team-card.html',
            scope: {
                team: "=",
                joinTeam: "="
            },
            link: function(scope, elem, attrs) {
                scope.showPlayers = false;
                scope.hideToggle = {
                    toggle: WegasTranslations.hideToggle.SHOW[$translate.use()]
                };
                scope.tooglePlayersVisibility = function() {
                    scope.showPlayers = !scope.showPlayers;
                    if (scope.showPlayers) {
                        scope.hideToggle = {
                            toggle: WegasTranslations.hideToggle.HIDE[$translate.use()]
                        };
                    } else {
                        scope.hideToggle = {
                            toggle: WegasTranslations.hideToggle.SHOW[$translate.use()]
                        };
                    }
                };
                scope.join = function(teamId) {
                    var button = $(elem).find(".button--join-team");
                    if (!button.hasClass("button--disable")) {
                        button.addClass("button--disable button--spinner button--rotate");
                        scope.joinTeam(teamId).then(function() {
                            button.removeClass("button--disable button--spinner button--rotate");
                        });
                    }
                };
            }
        };
    });
