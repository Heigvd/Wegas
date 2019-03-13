/* global gameModel, self, Variable*/
var PactDashboard = (function() {

    // This is client-side code !
    var levelDisplay = function(value) {
        return (value/10).toFixed(1);
    };

    WegasDashboard.registerVariable("currentLevel", {
        transformer: levelDisplay,
        label: 'Niveau actuel',
        sortable: true
    });

    WegasDashboard.registerVariable("maxLevel", {
        transformer: levelDisplay,
        label: 'Max atteint',
        sortable: true
    });

    WegasDashboard.registerVariable("levelLimit", {
        transformer: levelDisplay,
        label: 'Niveau autorisé',
        sortable: true
    });

    // This is self-contained client-side code !
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

        var counters = obj.object,
            res = '<table class="dashboard-internal-table">',
            level = [0,0,0];

        for (var key in counters) {
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
            res += '<td class="result-gray">' + counters[level[2]].successful + '</td>';
        }
        if (level[1] === 0) {
            res += '<td>-</td>';
        } else {
            res += '<td class="result-gray">' + counters[level[1]].successful + '</td>';
        }
        if (level[0] === 0) {
            res += '<td>-</td>';
        } else {
            res += '<td class="result-gray">' + counters[level[0]].successful + '</td>';
        }

        return res + '</tr></table>';
    };

    // This is self-contained client-side code !
    var countersSort = function(a, b, desc) {

        function getMaxLevel(playerCounters) {
            var max = 0;
            for (var key in playerCounters) {
                if (key > max){
                    max = key;
                }
            }
            return max;
        }

        // Returns infinity if the user has not yet begun the game or the current level:
        function errorRatio(playerCounters, level) {
            if (level === 0) return Infinity;
            var errs = playerCounters[level].exceptions + playerCounters[level].incomplete,
                total = playerCounters[level].submissions;
            return errs/total;
        }

        function errors(playerCounters, level) {
            if (level === 0) return Infinity;
            return playerCounters[level].exceptions + playerCounters[level].incomplete;
        }

        // Return the most advanced player of a and b (?)
        var countersA = a.get("counters").object,
            countersB = b.get("counters").object,
            levelA = getMaxLevel(countersA),
            levelB = getMaxLevel(countersB),
            errRA, errRB, errsA, errsB, res;

        // Return 1 if A needs more urgent help than B, otherwise -1 (or 0 if their needs are equal).
        // First look at their advancement levels:
        if (levelA < levelB) {
            res = 1;
        } else if (levelA === levelB) { // If advancement levels are equal, consider their error ratios :
            errRA = errorRatio(countersA, levelA);
            errRB = errorRatio(countersB, levelB);
            if (errRA > errRB) {
                res = 1;
            } else if (errRA === errRB) { // If error ratios are equal, consider the absolute number of errors
                errsA = errors(countersA, levelA);
                errsB = errors(countersB, levelB);
                if (errsA > errsB) {
                    res = 1;
                } else if (errsA === errsB) {
                    res = 0;
                } else {
                    res = -1;
                }
            } else {
                res = -1;
            }
        } else {
            res = -1;
        }

        return desc ? -res : res;

    };


    WegasDashboard.registerVariable("counters", {
        transformer: countersDisplay,
        sortable: true,
        sortFn: countersSort,
        label: 'Évol. niveaux: n-2, n-1, n',
    });

    WegasDashboard.registerVariable("history", {
        label: 'Historique',
    });

    WegasDashboard.registerAction("sendTheory", function(team, payload) {
        new Y.Wegas.ImpactsTeamModal({
            "team": team,
            "customImpacts": [
                ["Envoyer de la théorie",
                    'PactHelper.sendMessage(${"type":"string", "view": {"label":"De la part de"}}, ${"type":"string", "view": {"label":"Sujet"}}, ${"type":"string", "view": {"label":"Message", "type": "html", "required":true}}, []);']
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
