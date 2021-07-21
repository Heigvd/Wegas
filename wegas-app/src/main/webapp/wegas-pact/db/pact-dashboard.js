/* global gameModel, self, Variable, WegasDashboard, Infinity, I18n*/
var PactDashboard = (function() {

    // This variable only exists in games made from dec. 2019:
    var sequenceVarExists = Variable.hasVariable(gameModel, "sequence");

    /**
     * convert internal (11, 12, 21, 31, ..) )level to human readable 1.1, 1.2, 2.1, ...
     */
    var levelDisplay = function(teamId, instance) {
        return (instance.getValue() / 10).toFixed(1);
    };

    WegasDashboard.registerVariable("currentLevel", {
        mapFn: levelDisplay,
        label: 'Niveau actuel',
        sortable: true
    });

    WegasDashboard.registerVariable("maxLevel", {
        mapFn: levelDisplay,
        label: 'Max atteint',
        sortable: true,
        active: false
    });

    WegasDashboard.registerVariable("levelLimit", {
        mapFn: levelDisplay,
        label: 'Niveau autorisé',
        sortable: true,
        active: false
    });

    // This is self-contained client-side code !
    var formatCounters = function(bloc, counters) {

        function colored(nbErrs, nbTotal) {
            var ratio = nbTotal != 0 ? nbErrs / nbTotal : 0;
            if (nbErrs <= 1 || ratio <= 0.2) {
                // Green:
                return "<span class='result-green'>" + nbErrs + "</span>";
            } else if (ratio <= 0.4 && ratio > 0.2) {
                // Orange:
                return "<span class='result-orange'>" + nbErrs + "</span>";
            } else {
                // Red:
                return "<span class='result-red'>" + nbErrs + "</span>";
            }
        }

        bloc.setContent('<table class="dashboard-internal-table">' +
            '<tr><td>Exceptions:</td><td>' + colored(counters.exceptions, counters.submissions) + '</td></tr>' +
            '<tr><td>Incomplets:</td><td>' + colored(counters.incomplete, counters.submissions) + '</td></tr>' +
            '<tr><td>Réussis:</td><td class="result-gray">' + counters.successful + '</td></tr>' +
            '<tr class="result-total"><td>Total:</td><td class="result-gray">' + counters.submissions + '</td></tr>' +
            '</tr></table>');
    };



    /*
     * Counters of the current level
     * Returns {submissions: x, successful: x, incomplete: x, exceptions: x}
     */
    var extractCurrentCount = function(teamId, instance, currentLevel) {
        var current = instance.getProperty("" + currentLevel.getValue());
        if (current) {
            try {
                var counter = JSON.parse(current);
                return counter;
            } catch (e) {
            }
        }

        return  {
            submissions: 0,
            successful: 0,
            incomplete: 0,
            exceptions: 0
        };
    };

    /*
     * Sum counters of all levels
     * moreover, include current level as the strange sort method use it
     * Returns {currentLevel:x, submissions: x, successful: x, incomplete: x, exceptions: x}
     */
    var extractAllCount = function(teamId, instance, currentLevel) {
        var sum = {
            currentLevel: currentLevel.getValue(),
            submissions: 0,
            successful: 0,
            incomplete: 0,
            exceptions: 0
        };
        instance.getProperties().values().forEach(function(sCount) {
            try {
                var count = JSON.parse(sCount);
                sum.successful += count.successful;
                sum.incomplete += count.incomplete;
                sum.exceptions += count.exceptions;
                sum.submissions += count.submissions;
            } catch (e) {
            }
        });
        return sum;
    };

    // This is self-contained client-side code !
    var sortCounters = function(a, b, desc) {

        function errorCount(counter) {
            return counter.exceptions + counter.incomplete;
        }

        function errorRatio(counter) {
            if (counter.submissions > 0) {
                return errorCount(counter) / counter.submissions;
            } else {
                return Infinity;
            }
        }

        var res;

        var ratioA = errorRatio(a);
        var ratioB = errorRatio(b);

        // Return 1 if A needs more urgent help than B, otherwise -1 (or 0 if their needs are equal).
        // First look at their advancement levels:
        if (a.currentLevel < b.currentLevel) {
            res = 1;
        } else if (a.currentLevel === b.currentLevel) {
            // If advancement levels are equal, consider their error ratios :
            if (ratioA > ratioB) {
                res = 1;
            } else if (ratioA === ratioB) {
                // If error ratios are equal, consider the absolute number of errors
                var errsA = errorCount(a);
                var errsB = errorCount(b);

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
        mapFn: extractAllCount,
        mapFnExtraArgs: ["currentLevel"],
        formatter: formatCounters,
        sortable: true,
        sortFn: sortCounters,
        label: 'New Facilité globale',
        id: "counters_all"
    });

    WegasDashboard.registerVariable("counters", {
        mapFn: extractCurrentCount,
        mapFnExtraArgs: ["currentLevel"],
        formatter: formatCounters,
        sortable: true,
        sortFn: sortCounters,
        label: 'New Facilité niv. actuel',
        active: false,
        id: "counters"
    });

    var sequenceForCurrentLevel = function(teamId, instance, currentLevel) {
        var pList = instance.getInternalProperties();
        var result = {};

        pList.forEach(function(entry) {
            var key = entry.getKey();
            if (key.startsWith(currentLevel.getValue() + "-")) {
                result[key] = JSON.parse(entry.getValue());
            }
        });

        return {
            sequence: result,
            totalLength: pList.size()
        };
    };

    // This is self-contained client-side code !
    var sequenceFormatter = function(bloc, value) {

        var seqObj = value.sequence,
            keys = Object.keys(seqObj),
            seq = '';

        var event, time, start, duration;

        for (var k in keys) {
            event = seqObj[keys[k]].get("val");
            time = new Date(event.time).toTimeString().substr(0, 8);
            switch (event.type) {
                case "OK":
                    seq += '<span class="success" title="Success">OK</span>';
                    break;
                case "SEM":
                    seq += '<span class="semantic-error" title="Semantic error' + (event.message ? ': ' + event.message : '') + '">SEM</span>';
                    break;
                case "SYN":
                    seq += '<span class="syntax-error" title="Syntax error' + (event.message ? ': ' + event.message : '') + '">SYN</span>';
                    break;
                case "THEORY-RESUMED":
                    start = event.time;
                    break;
                case "THEORY-SUSPENDED":
                    duration = Math.round((event.time - start) / 1000);
                    if (duration > 0) {
                        seq += '<span class="theory" title="Theory: ' + event.topic + '">TH:' + duration + 's</span>';
                    }
                    break;
                default:
                    seq += '[INTERNAL ERROR: ' + event.type + ']';
            }
        }


        bloc.setContent('<span class="sequence">' +
            (seq ? seq : '<span style="background:white;font-style:italic;padding:0 4px;color:#666;">aucune activité à ce niveau</span>') +
            '</span>');
    };


    // This is self-contained client-side code !
    var sequenceSortCurrent = function(a, b, desc) {

        // Return the most active player of a and b (the one with most events)
        var seqA = a.totalLength,
            seqB = b.totalLength,
            res = seqA === seqB ? 0 : (seqA > seqB ? 1 : -1);

        return desc ? -res : res;
    };


    if (sequenceVarExists) {
        WegasDashboard.registerVariable("sequence", {
            mapFn: sequenceForCurrentLevel,
            mapFnExtraArgs: ["currentLevel"],
            formatter: sequenceFormatter,
            sortable: true,
            sortFn: sequenceSortCurrent,
            label: 'Séquence',
            active: true
        });
    }

    // Hides all "history-error" elements following the first "history-success" element.
    var shortenHistory = function(teamId, instance, data) {
        var msgs = instance.getSortedMessages(),
            empty = msgs.length === 0,
            content = '',
            foundFirstSuccess = false;

        if (empty) {
            content = "<i>(0 messages)</i>";
        } else {
            for (var i = 0; i < msgs.length; i++) {
                var curmsg = msgs[i],
                    subj = curmsg.getSubject() && I18n.t(curmsg.getSubject()),
                    date = curmsg.getDate() && I18n.t(curmsg.getDate()),
                    body = curmsg.getBody() && I18n.t(curmsg.getBody()),
                    from = curmsg.getFrom() && I18n.t(curmsg.getFrom());

                if (!foundFirstSuccess) {
                    if (subj.contains('history-success')) {
                        foundFirstSuccess = true;
                    }
                } else {
                    if (subj.contains('history-error')) {
                        continue;
                    }
                }

                content += '<div class="wegas-dashboard-inbox-message">';

                if (from && from.length) {
                    content += "<b>" + subj + "</b><br/>";
                }
                if (subj && subj.length) {
                    content += "<b>" + subj + "</b>&nbsp;&nbsp;";
                }
                if (date && date.length) {
                    content += "(" + date + ")";
                }
                if (body && body.length) {
                    content += "<br/>&nbsp;<br/>" + body;
                }

                content += '<hr/></div>';
            }
        }
        return {"title": data.teamName + ": " + data.label, "body": content, "empty": empty};
    };


    WegasDashboard.registerVariable("history", {
        label: 'Historique bref',
        id: "history_short",
        mapFn: shortenHistory
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
