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

    var countersDisplay = function(obj) {

        function colored(nbErrs, nbTotal) {
            if (nbTotal === 0) return 'n/a';
            var ratio = nbErrs/nbTotal;
            if (nbErrs <= 1 || ratio <= 0.2) {
                // Green:
                return "<span class='result-green'>" + nbErrs + "</span>";
            } else if (ratio <= 0.4 && ratio > 0.2) {
                // Orange:
                return "<span class='result-orange'>" + nbErrs  + "</span>";
            } else {
                // Red:
                return "<span class='result-red'>" + nbErrs  + "</span>";
            }
        }

        var counters = {},
            props,
            res = '<table class="dashboard-internal-table">',
            level = [0,0,0],
            n = 0;
        try {
            props = JSON.parse(obj.body);
        } catch(e) {
            return e;
        }
        for (var key in props) {
            try {
                counters[key] = JSON.parse(props[key]);
            } catch(e) {
                counters[key] = props[key];
            }
            // Sort keys (game levels) :
            if (key > level[0]){
                level[2] = level[1];
                level[1] = level[0];
                level[0] = key;
            } else if (key > level[1]) {
                level[2] = level[1];
                level[1] = key;
            } else if (key > level[2]) {
                level[2] = key;
            }
            n++;
        }

        // Display line of exceptions :
        res += '<tr><td>Exceptions:</td>';
        if (level[2] === 0) {
            res += '<td>-</td>';
        } else {
            res += '<td>' + colored(counters[level[2]].exceptions, counters[level[2]].submissions) + '</td>';
        }
        if (level[1] === 0) {
            res += '<td>-</td>';
        } else {
            res += '<td>' + colored(counters[level[1]].exceptions, counters[level[1]].submissions) + '</td>';
        }
        if (level[0] === 0) {
            res += '<td>-</td>';
        } else {
            res += '<td>' + colored(counters[level[0]].exceptions, counters[level[0]].submissions) + '</td>';
        }

        res += '</tr><tr><td>Incomplets:</td>';

        // Display line of incomplete executions :
        if (level[2] === 0) {
            res += '<td>-</td>';
        } else {
            res += '<td>' + colored(counters[level[2]].incomplete, counters[level[2]].submissions) + '</td>';
        }
        if (level[1] === 0) {
            res += '<td>-</td>';
        } else {
            res += '<td>' + colored(counters[level[1]].incomplete, counters[level[1]].submissions) + '</td>';
        }
        if (level[0] === 0) {
            res += '<td>-</td>';
        } else {
            res += '<td>' + colored(counters[level[0]].incomplete, counters[level[0]].submissions) + '</td>';
        }

        res += '</tr><tr><td>Réussis:</td>';

        // Display line of successful executions :
        if (level[2] === 0) {
            res += '<td>-</td>';
        } else {
            res += '<td>' + counters[level[2]].successful + '</td>';
        }
        if (level[1] === 0) {
            res += '<td>-</td>';
        } else {
            res += '<td>' + counters[level[1]].successful + '</td>';
        }
        if (level[0] === 0) {
            res += '<td>-</td>';
        } else {
            res += '<td>' + counters[level[0]].successful + '</td>';
        }

        return res + '</tr></table>';
    };


    WegasDashboard.registerVariable("counters", {
        transformer: countersDisplay,
        label: 'Évol. niveaux: n-2, n-1, n',
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
