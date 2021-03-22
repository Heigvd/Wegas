/* global gameModel, self, Variable*/
var PactDashboard = (function() {

    // This variable only exists in games made from dec. 2019:
    var sequenceVarExists = true;
    try {
        var test = Variable.find(gameModel, "sequence");
    } catch(e) {
        sequenceVarExists = false;
    }

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
        sortable: true,
        active: false
    });

    WegasDashboard.registerVariable("levelLimit", {
        transformer: levelDisplay,
        label: 'Niveau autorisé',
        sortable: true,
        active: false
    });

    // This is self-contained client-side code !
    var countersDisplayCurrent = function(obj) {

        function colored(nbErrs, nbTotal) {
            var ratio = nbTotal != 0 ? nbErrs/nbTotal : 0;
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
            level = obj.data ? obj.data.currentLevel : 99;

        // If player has just started a new level, but not yet submitted any code:
        if (!counters[level]) {
            counters[level] = {
                submissions: 0,
                successful: 0,
                incomplete: 0,
                exceptions: 0
            };
        }

        return  '<table class="dashboard-internal-table">' +
                '<tr><td>Exceptions:</td><td>' + colored(counters[level].exceptions, counters[level].submissions) + '</td></tr>' +
                '<tr><td>Incomplets:</td><td>' + colored(counters[level].incomplete, counters[level].submissions) + '</td></tr>' +
                '<tr><td>Réussis:</td><td class="result-gray">' + counters[level].successful + '</td></tr>' +
                '<tr class="result-total"><td>Total:</td><td class="result-gray">' + counters[level].submissions + '</td></tr>' +
                '</tr></table>';
    };


    // This is self-contained client-side code !
    var countersDisplayAll = function(obj) {

        function colored(nbErrs, nbTotal) {
            var ratio = nbTotal != 0 ? nbErrs/nbTotal : 0;
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
            level = obj.data ? obj.data.maxLevel : 99,
            sum = obj.sum = {
                submissions: 0,
                successful: 0,
                incomplete: 0,
                exceptions: 0
            };

        // If player has just started a new level, but not yet submitted any code:
        if (!counters[level]) {
            counters[level] = {
                submissions: 0,
                successful: 0,
                incomplete: 0,
                exceptions: 0
            };
        }

        // Compute sum of counters for all levels:
        for (var key in counters) {
            sum.submissions += counters[key].submissions;
            sum.successful += counters[key].successful;
            sum.incomplete += counters[key].incomplete;
            sum.exceptions += counters[key].exceptions;
        }

        return  '<table class="dashboard-internal-table">' +
                '<tr><td>Exceptions:</td><td>' + colored(sum.exceptions, sum.submissions) + '</td></tr>' +
                '<tr><td>Incomplets:</td><td>' + colored(sum.incomplete, sum.submissions) + '</td></tr>' +
                '<tr><td>Réussis:</td><td class="result-gray">' + sum.successful + '</td></tr>' +
                '<tr class="result-total"><td>Total:</td><td class="result-gray">' + sum.submissions + '</td></tr>' +
                '</tr></table>';
    };


    // This is self-contained client-side code !
    var countersSortCurrent = function(a, b, desc) {

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
            levelA = a.get("currentLevel"),
            levelB = b.get("currentLevel"),
            errRA, errRB, errsA, errsB, res;

        // Return 1 if A needs more urgent help than B, otherwise -1 (or 0 if their needs are equal).
        // We don't consider their respective advancement levels !
        // We first consider their error ratios :
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

        return desc ? -res : res;

    };




    // This is self-contained client-side code !
    var countersSortAll = function(a, b, desc) {

        function errorRatio(playerCounters) {
            var errs = playerCounters.exceptions + playerCounters.incomplete,
                total = playerCounters.submissions;
            return errs/total;
        }

        function errors(playerCounters) {
            return playerCounters.exceptions + playerCounters.incomplete;
        }

        // Return the most advanced player of a and b (?)
        var countersA = a.get("counters_all").sum,
            countersB = b.get("counters_all").sum,
            levelA = a.get("maxLevel"),
            levelB = b.get("maxLevel"),
            errRA, errRB, errsA, errsB, res;

        // Return 1 if A needs more urgent help than B, otherwise -1 (or 0 if their needs are equal).
        // First look at their advancement levels:
        if (levelA < levelB) {
            res = 1;
        } else if (levelA === levelB) { // If advancement levels are equal, consider their error ratios :
            errRA = errorRatio(countersA);
            errRB = errorRatio(countersB);
            if (errRA > errRB) {
                res = 1;
            } else if (errRA === errRB) { // If error ratios are equal, consider the absolute number of errors
                errsA = errors(countersA);
                errsB = errors(countersB);
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
        transformer: countersDisplayAll,
        sortable: true,
        sortFn: countersSortAll,
        label: 'Facilité globale',
        id: "counters_all"
    });

    WegasDashboard.registerVariable("counters", {
        transformer: countersDisplayCurrent,
        sortable: true,
        sortFn: countersSortCurrent,
        label: 'Facilité niv. actuel',
        active: false,
    });


    // This is self-contained client-side code !
    var sequenceDisplayCurrent = function(obj) {
       
        var seqObj = obj.object,
            level = obj.data ? obj.data.currentLevel : 99,
            keys = Object.keys(seqObj),
            seq = '';

        // Keep only the current level:
        function filterLevel(key) {
            return (key.indexOf(level) === 0);
        }

        keys = keys.filter(filterLevel).sort();
        
        var event, time, start, duration;
        
        for (var k in keys) {
            event = seqObj[keys[k]];
            time = new Date(event.time).toTimeString().substr(0,8);
            switch(event.type) {
                case "OK": seq += '<span class="success" title="Success">OK</span>'; break;
                case "SEM": seq += '<span class="semantic-error" title="Semantic error' + (event.message ? ': ' + event.message : '') + '">SEM</span>'; break;
                case "SYN": seq += '<span class="syntax-error" title="Syntax error' + (event.message ? ': ' + event.message : '') + '">SYN</span>'; break;
                case "THEORY-RESUMED": start = event.time; break;
                case "THEORY-SUSPENDED":
                    duration = Math.round((event.time - start)/1000);
                    if (duration > 0) {
                        seq += '<span class="theory" title="Theory: ' + event.topic + '">TH:'+ duration + 's</span>';
                    }
                    break;
                default: seq += '[INTERNAL ERROR: ' + event.type + ']';
            }
        }
        

        return  '<span class="sequence">' +
                (seq ? seq : '<span style="background:white;font-style:italic;padding:0 4px;color:#666;">aucune activité à ce niveau</span>') +
                '</span>';
    };
    
    
    // This is self-contained client-side code !
    var sequenceSortCurrent = function(a, b, desc) {

        // Return the most active player of a and b (the one with most events)
        var seqA = Object.keys(a.get("sequence").object).length,
            seqB = Object.keys(b.get("sequence").object).length,
            res = seqA === seqB ? 0 : (seqA > seqB ? 1 : -1);

        return desc ? -res : res;

    };


    if (sequenceVarExists) {
        WegasDashboard.registerVariable("sequence", {
            transformer: sequenceDisplayCurrent,
            sortable: true,
            sortFn: sequenceSortCurrent,
            label: 'Séquence',
            active: true
        });
    }

    // This is self-contained client-side code !
    // Hides all "history-error" elements following the first "history-success" element.
    var shortHistory = function(obj) {
        var el = document.createElement('div');
        el.innerHTML = obj.body;
        var matches = el.getElementsByClassName('wegas-dashboard-inbox-message'),
            foundFirstSuccess = false;
        for (var i = 0; i < matches.length; i++) {
            if (!foundFirstSuccess) {
                var isSuccess = matches.item(i).getElementsByClassName('history-success').length > 0;
                if (isSuccess) {
                    foundFirstSuccess = true;
                }
            } else {
                var isError = matches.item(i).getElementsByClassName('history-error').length > 0;
                if (isError) {
                    matches.item(i).classList.add('hidden');
                }
            }
        }
        obj.body = el.innerHTML;
        return obj;
    }


    WegasDashboard.registerVariable("history", {
        label: 'Historique bref',
        id: "history_short",
        transformer: shortHistory
    });


    WegasDashboard.registerVariable("history", {
        label: 'Historique complet',
        active: false
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
