angular.module('wegas.directives.search.users', [
    'ngSanitize',
    'wegas.behaviours.autocomplete',
    'MassAutoComplete'
])
    .directive('searchUsers', function($sce, UsersModel) {
        "use strict";
        return {
            templateUrl: 'app/commons/directives/search-users.tmpl.html',
            scope: {
                callback: "=",
                placeholder: "@",
                inputStyle: "@",
                restrictRoles: "=",
                exclude: "="
            },
            link: function(scope, element, attrs) {
                function suggestObj(term) {
                    var pt = this;
                    pt.exclude = scope.exclude;
                    return UsersModel.autocomplete(term, scope.restrictRoles).then(function(matches) {
                        var results = [],
                            excludes = pt.exclude;

                        function highlight(str, term) {
                            if (!str)
                                return "";
                            var highlightRegex = new RegExp('(' + term + ')', 'gi');
                            return str.replace(highlightRegex,
                                '<strong>$1</strong>');
                        }

                        function alreadyMember(userId) {
                            if (!excludes)
                                return false;
                            if (typeof excludes === "function")
                                excludes = excludes();

                            for (var i = 0; i < excludes.length; i++) {
                                if (userId == excludes[i].id)
                                    return true;
                            }
                            return false;
                        }

                        for (var i = 0; i < matches.length; i++) {
                            var user = matches[i];
                            if (!alreadyMember(user.id)) {
                                results.push({
                                    value: user.name + '(' + user.email + ')',
                                    obj: user,
                                    label:
                                        '<div class="flex-row">' +
                                        ' <div class="flex-col-grow">' +
                                        '  ' + highlight(user.name, term) + ' &nbsp;(' +
                                        highlight(user.username, term) + ')' +
                                        ' </div>' +
                                        ' <div class="flex-col">••••@' +
                                        highlight(user.emailDomain, term) +
                                        ' </div>' +
                                        '</div>'

                                });
                            }
                        }
                        return results;
                    });
                }
                function selectUser(selected) {
                    scope.callback(selected.obj);
                    scope.dirty.value = "";
                }
                scope.autocomplete_options = {
                    suggest: suggestObj,
                    on_select: selectUser
                };
            }
        };
    })
    ;
