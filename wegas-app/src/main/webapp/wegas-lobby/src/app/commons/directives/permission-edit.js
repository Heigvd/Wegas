/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021  School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
/*global _*/
angular.module("wegas.directive.permission.edit", [])
    .directive('permissionEdit', function ($q, SessionsModel, ScenariosModel, $filter) {
            "use strict";

            var DANGER_BG_CLASS = "bg-danger";
            var PERMISSIONS = {
                GameModel: [{
                    value: "*",
                    label: "All permissions"
                }, {
                    value: "Edit",
                    label: "Edit"
                }, {
                    value: "Instantiate",
                    label: "Instantiate"
                }, {
                    value: "Duplicate",
                    label: "Copy"
                }, {
                    value: "View",
                    label: "View"
                }],
                Game: [{
                    value: "*",
                    label: "All permissions"
                }, {
                    value: "Edit",
                    label: "Edit"
                }, {
                    value: "View",
                    label: "View"
                }, {
                    value: "Token",
                    label: "Token"
                }],
                User: [{
                    value: "*",
                    label: "All permissions"
                }]
            };
            var PERM_STRING_REGEX = /^(Game|GameModel|User):(.+):(?:(g|gm)(\d+)|(\*))$/;
            var TYPE_TO_KEY = Object.create(null, {
                GameModel: {
                    value: "gm",
                    enumerable: true
                },
                Game: {
                    value: "g",
                    enumerable: true
                },
                User: {
                    value: undefined,
                    enumerable: true
                }
            });
            var STATUS = ["LIVE", "BIN", "DELETE"];
            var ALL_OPTION = {
                name: "* ALL *",
                id: "*"
            };
            var OPTION_STORE = {};

            function getOptions(forType) {
                if (!OPTION_STORE[forType]) {
                    if (forType === "GameModel") {
                        OPTION_STORE[forType] = $q.all(_.map(STATUS, function (status) {
                            return ScenariosModel.getScenarios(status);
                        }))
                            .then(function (arr) {
                                var opt_all = [ALL_OPTION],
                                    opt = [];
                                _.forEach(arr, function (el) {
                                    opt = opt.concat(el.data);
                                });
                                return opt_all.concat($filter('orderBy')(opt, 'name'));
                            });
                    } else if (forType === "Game") {
                        OPTION_STORE[forType] = $q.all(_.map(STATUS, function (status) {
                            return SessionsModel.getSessions(status);
                        }))
                            .then(function (arr) {
                                var opt = [ALL_OPTION];
                                _.forEach(arr, function (el) {
                                    opt = opt.concat(el.data);
                                });
                                return opt;
                            });
                    }
                }
                return OPTION_STORE[forType];
            }

            function parsePerm(permString) {
                var match = permString.match(PERM_STRING_REGEX);
                if (!match || (TYPE_TO_KEY[match[1]] !== match[3] && !match[5])) {
                    throw new Error("Invalid permission string: " + permString);
                }
                return {
                    type: match[1],
                    permissions: match[2].split(","),
                    id: match[4] || "*"
                };
            }

            function genPerm(obj) {
                if (!(obj.type in TYPE_TO_KEY)) {
                    throw new Error("Invalid type: " + obj.type);
                }
                return obj.type + ":" + obj.permissions.join(",") + ":" +
                    (obj.id === "*" ? "*" : (TYPE_TO_KEY[obj.type] || "") + obj.id);
            }

            return {
                templateUrl: 'app/commons/directives/permission-edit.tmpl.html',
                restrict: 'E',
                link: function (scope, elem) {
                    scope.availablePermissions = PERMISSIONS.GameModel;
                    scope.options = [];
                    scope.perm = {
                        permissions: [],
                        id: "",
                        type: "GameModel"
                    };
                    try {
                        scope.perm = parsePerm(scope.permission.value);
                    } catch (e) {
                        //ERROR stays unmodified
                    }
                    getOptions(scope.perm.type).then(function (opt) {
                        scope.options = opt;
                    });
                    scope.update = function (val) {
                        var permString;
                        var availabaleValues;
                        elem.children().removeClass(DANGER_BG_CLASS);
                        scope.availablePermissions = PERMISSIONS[val.type];
                        availabaleValues = _.map(scope.availablePermissions, "value");
                        _.remove(val.permissions, function (elem) {
                            return availabaleValues.indexOf(elem) < 0;
                        });
                        try {
                            permString = genPerm(val);
                            parsePerm(permString);
                            scope.permission.value = permString;
                        } catch (e) {
                            elem.children().addClass(DANGER_BG_CLASS);
                        }

                    };
                    scope.togglePerm = function (perm) {
                        var permissions = scope.perm.permissions;
                        var idx = permissions.indexOf(perm);
                        if (idx > -1) {
                            permissions.splice(idx, 1);
                        } else {
                            permissions.push(perm);
                        }
                        if (permissions.indexOf("*") > -1) { //Remove all in case "*" is selected
                            permissions.length = 0;
                            permissions.push("*");
                        }
                        scope.update(scope.perm);
                    };
                    /* Update available id options base on type (Game / GameModel / User) */
                    scope.$watchCollection('perm', function (value, oldValue) {
                        scope.update(value);
                        if (value.perm !== oldValue.perm) {
                            getOptions(v).then(function (opt) {
                                scope.options = opt;
                            });
                        }
                    });

                }

            };
        }
    );
