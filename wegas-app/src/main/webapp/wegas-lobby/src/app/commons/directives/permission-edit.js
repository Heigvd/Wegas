/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2015 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
angular.module("wegas.directive.permission.edit", [])
    .directive('permissionEdit', function(SessionsModel, ScenariosModel) {
        "use strict";
debugger;
        var DANGER_BG_CLASS = "bg-danger";
        var PERMISSIONS = {
            GameModel: ["*", "Edit", "Instantiate", "Duplicate", "View"],
            Game: ["*", "Edit", "View"],
            User: ["*"]
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

        function parsePerm(permString) {
            var match = permString.match(PERM_STRING_REGEX)
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
            link: function(scope, elem) {
                scope.availablePermissions = PERMISSIONS.GameModel;
                scope.perm = {
                    permissions: [],
                    id: "",
                    type: "GameModel"
                };
                scope.update = function(val) {
                    elem.children().removeClass(DANGER_BG_CLASS);
                    scope.availablePermissions = PERMISSIONS[val.type];
                    _.remove(val.permissions, function(elem) {
                        return scope.availablePermissions.indexOf(elem) < 0;
                    });
                    try {
                        scope.permission.value = genPerm(val);
                        parsePerm(scope.permission.value);
                    } catch (e) {
                        elem.children().addClass(DANGER_BG_CLASS);
                    }

                };
                scope.togglePerm = function(perm) {
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
                scope.$watchCollection('perm', function(value) {
                    scope.update(value);
                });
                    scope.perm = parsePerm(scope.permission.value);
            }
        };
    });
