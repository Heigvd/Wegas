/* global gameModel, self, Variable*/
var PactDashboard = (function() {

    var levelDisplay = function(value) {
        return (value/10).toFixed(1);
    };

    WegasDashboard.registerVariable("currentLevel", {
        transformer: levelDisplay,
        sortable: true
    });

    WegasDashboard.registerVariable("maxLevel", {
        transformer: levelDisplay,
        sortable: true
    });

    WegasDashboard.registerVariable("history", {});

    WegasDashboard.registerAction("sendTheory", function(team, payload) {
        new Y.Wegas.ImpactsTeamModal({
            "team": team,
            "customImpacts": [
                ["Envoyer de la théorie",
                    'PactHelper.sendMessage(${"type":"string", "label":"From"}, ${"type":"string", "label":"Subject"}, ${"type":"html", "label":"Body", "required":true}, []);']
            ],
            "showAdvancedImpacts": false
        }).render();
    }, {
        section: "impacts",
        hasGlobal: true,
        icon: "fa fa-book",
        label: "Envoyer de la théorie"
    });

})();
