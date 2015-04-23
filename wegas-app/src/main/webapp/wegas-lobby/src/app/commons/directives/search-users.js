angular.module('wegas.directives.search.users', [
    'ngSanitize',
    'wegas.behaviours.autocomplete',
    'MassAutoComplete'
])
.directive('searchUsers', function($sce, UsersModel) {
    return {
        templateUrl: 'app/commons/directives/search-users.tmpl.html',
        scope: {
            callback: "=",
            placeholder: "@",
            inputStyle: "@",
            restrictRoles: "="
        },
        link: function(scope, element, attrs) {
            function suggest_obj(term) {
                return UsersModel.autocomplete(term, scope.restrictRoles).then(function(matches) {
                    var results = [];

                    function highlight(str, term) {
                        var highlight_regex = new RegExp('(' + term + ')', 'gi');
                        return str.replace(highlight_regex,
                            '<strong>$1</strong>');
                    };

                    for (var i = 0; i < matches.length; i++) {
                        var user = matches[i];
                        results.push({
                            value: user.name + '('+user.email+')',
                            obj: user,
                            label:
                            '<div class="row">' +
                            ' <div class="col-xs-6">' +
                            '  ' + highlight(user.name, term) +
                            ' </div>' +
                            ' <div class="col-xs-6 text-right">' +
                            highlight(user.email, term) +
                            ' </div>' +
                            '</div>'

                        });
                    }
                    return results;
                });
            }
            function selectUser(selected) {
              scope.callback(selected.obj);
              scope.dirty.value = "";
            };
            scope.autocomplete_options = {
                suggest: suggest_obj,
                on_select: selectUser
            };
        }
    };
})
;