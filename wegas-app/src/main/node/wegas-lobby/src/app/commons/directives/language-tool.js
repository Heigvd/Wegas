angular.module('wegas.directives.language.tool', [])      
    .directive('languageTool', function($translate, WegasTranslations) {
        "use strict";
            return {
                templateUrl: 'app/commons/directives/language-tool.tmpl.html',
                scope: {},
                link: function(scope, element, attrs){
                    var config = localStorage.getObject("wegas-config");
                    
                    scope.currentLanguage = config.commons.language;
                    scope.languages = WegasTranslations.languages;
                    
                    scope.changeLanguage = function(key){
                        config.commons.language = key;
                        scope.currentLanguage = key;
                        $translate.use(key);
                        $(element).find(".tool").toggleClass("tool--open");
                        localStorage.setObject("wegas-config", config);
                    };
                    
                    $(element).find(".button--language").on("click", function(e){
                        e.preventDefault();
                        e.stopPropagation();
                        $(element).find(".tool").toggleClass("tool--open");
                        $(".view.view--public-index").animate({ scrollTop: 1E10 }, "slow");
                    });
                }
            };
    });        
