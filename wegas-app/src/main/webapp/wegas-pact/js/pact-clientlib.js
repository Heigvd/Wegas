(function () {
    "use strict";

    Y.namespace("Wegas.Config").Dashboards = {
        overview: "WegasDashboard.getOverview();"
    };

    var varLabel = function(name) {
        return I18n.t(Y.Wegas.Facade.Variable.cache.find("name", name).get("label"));
    };

    // NB: This is a server-side function !
    // Enable entering game levels as 1.1 and convert them to internal representation, i.e. 11.
    var adjustLevel = function(val) {
        if (val >= 1.1 && val <= 9.9) {
            return val * 10;
        } else {
            ErrorManager.throwWarn("Une valeur entre 1.1 et 9.9 est attendue.");
        }
    };

    Y.namespace("Wegas.Config").CustomImpacts = function() {
        return [
            ["Modifier une variable de jeu",
                "var adjustLevel=" + adjustLevel + ";" +
                'Variable.find(gameModel, "maxLevel").setValue(self, adjustLevel(${"type":"number", "label":"' +
                varLabel("maxLevel") + '", "description":"Entrer une valeur numérique telle que 1.1"}));']
        ];
    };

    /*
    Y.namespace("Wegas.Config").ExtraTabs = [
        {
            label: "Game options",
            children: [{
                type: "PageLoader",
                pageLoaderId: "properties",
                defaultPageId: 15 // Numéro de page
            }]
        }
    ];
    */

})();

