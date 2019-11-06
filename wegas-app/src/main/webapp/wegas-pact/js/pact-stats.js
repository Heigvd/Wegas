/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2019  School of Business and Engineering Vaud, Comem, MEI, HES-SO
 * Licensed under the MIT License
 * 
 * Author: J.Hulaas, oct. 2019
 */

YUI.add('pact-stats', function (Y) {
    "use strict";
    
    var OBJECT_ID = "object id", // In Cyril's logs it's just "object"
        OBJECT_PROGGAME_PREFIX = "internal://wegas/",
        OBJECT_ACTIVITY_PREFIX = "act:wegas/",
        THEORY_SHORTOBJECT = "proggame-theory",
        PROGGAME_LEVEL_SHORTOBJECT = "proggame-level",
        PROGGAME_LEVEL_PREFIX = OBJECT_PROGGAME_PREFIX + PROGGAME_LEVEL_SHORTOBJECT + "/",
        PROGGAME_THEORY_PREFIX = OBJECT_PROGGAME_PREFIX + THEORY_SHORTOBJECT + "/",
        ANNOTATED_FILENAME = "xapi-annotated.csv",
        PACT_STATS_CLASS = ".pact-stats-widget",
        PACT_STATS_OPTIONS = ".pact-stats-options",
        PACT_STATS_HEADER = ".pact-stats-header",
        PACT_STATS_TABLE = ".pact-stats-table",
        PACT_STATS_FOOTER = ".pact-stats-footer",
        TABLE_ID = "pact-stats",
        MIN_LEVELS_OUTLIERS = 2;

    Y.Wegas.PactStats = Y.Base.create("pact-stats", Y.Widget,
            [Y.WidgetParent, Y.WidgetChild, Y.Wegas.Widget, Y.Wegas.Editable], {
        CONTENT_TEMPLATE:
                    '<div class="' + PACT_STATS_CLASS.substr(1) + '"><div class="' +
                        PACT_STATS_OPTIONS.substr(1) + '">' +
                        '<input type="checkbox" id="exclude-outliers" name="exclude-outliers"><label for="exclude-outliers"> Exclure les joueurs n\'ayant pas terminé au moins 2 niveaux</label><br>' +
                        '<input type="checkbox" id="exclude-unfinished" name="exclude-unfinished"><label for="exclude-unfinished"> Exclure les niveaux non terminés (chez tous les joueurs)</label>' +
                        '<i class="fa fa-2x fa-refresh" id="refresh"></i>' +
                        '</div><div class="' + 
                        PACT_STATS_HEADER.substr(1) + '"></div><div class="' + 
                        PACT_STATS_TABLE.substr(1) + '"></div><div class="' + 
                        PACT_STATS_FOOTER.substr(1) + '"></div>' +
                        'Pour télécharger le fichier CSV, choisir un séparateur décimal : <button type="button" id="downloadTableComma">Virgule</button>&nbsp;<button type="button" id="downloadTablePoint">Point</button>' +
                        '</div>',

        // Quick and simple export of table #TABLE_ID into a csv
        // From https://stackoverflow.com/questions/15547198/export-html-table-to-csv
        exportTableToCSV: function(decimalSeparator) {
            // Select rows from table_id
            var rows = document.querySelectorAll('table#' + TABLE_ID + ' tr'),
                csv = [],
                numberFormatter = decimalSeparator === ',' ?
                    new Intl.NumberFormat('fr-CH', { style: 'decimal', useGrouping: false, maximumFractionDigits: 2 }) :
                    new Intl.NumberFormat('en-US', { style: 'decimal', useGrouping: false, maximumFractionDigits: 2 });
            for (var i = 0; i < rows.length; i++) {
                var row = [], cols = rows[i].querySelectorAll('td, th');
                for (var j = 0; j < cols.length; j++) {
                    // Clean innertext to remove multiple spaces and jumpline (break csv)
                    var data = cols[j].innerText.replace(/(\r\n|\n|\r)/gm, '').replace(/(\s\s)/gm, ' ')
                    // Escape double-quote with double-double-quote (see https://stackoverflow.com/questions/17808511/properly-escape-a-double-quote-in-csv)
                    data = data.replace(/"/g, '""');
                    // JH: Localize floating-point numbers (dots vs commas) to enable direct loading into Excel
                    if (data !== '' && !isNaN(data)) {
                        data = numberFormatter.format(data);
                    }
                    // JH: duplicate cells as many times as required by colspan:
                    if (cols[j].colSpan > 1) {
                        for (var rs = 1; rs <= cols[j].colSpan; rs++) {
                            row.push('"' + data + '"');
                        }
                    } else {
                        row.push('"' + data + '"');
                    }
                }
                csv.push(row.join(';'));
            }
            var csv_string = csv.join('\n');
            // Download it
            var filename = TABLE_ID + '_' + new Date().toLocaleDateString() + '.csv';
            var link = document.createElement('a');
            link.style.display = 'none';
            link.setAttribute('target', '_blank');
            link.setAttribute('href', 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv_string));
            link.setAttribute('download', filename);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        },


        // Returns an object where each entry is the data of a distinct team.
        splitTeams: function(datatable) {
            var teams = {};
            for (var i = 0; i < datatable.length; i++) {
                var currTeam = datatable[i].team;
                if (teams[currTeam]) {
                    teams[currTeam].unshift(datatable[i]);
                } else {
                    teams[currTeam] = [datatable[i]];
                }
            }
            for (var t in teams) {
                this.setupTeamLevels(teams[t]);
            }
            return teams;
        },

        // Filters out outliers, i.e. teams with less than given number of completed levels.
        removeOutliers: function(teams) {
            for (var team in teams) {
                var levels = this.getLevels(teams[team]),
                    lastLevel = levels.length > 0 ? levels[levels.length-1].level : 0;
                if (lastLevel <= 0 || this.levels[lastLevel] < MIN_LEVELS_OUTLIERS) {
                    delete teams[team];
                }
            }
            return teams;
        },
        
        // Checks if timestamps are in chronological order (which they should)
        // and replaces string-based timestamps by corresponding Date objects.
        checkTimestamps: function(teams) {
            var ok = true,
                nbAlerts = 0,
                badTeam = '';
            for (var team in teams) {
                var currTeam = teams[team],
                    t = new Date("0");
                for (var i = 0; i < currTeam.length; i++) {
                    var nextT = new Date(currTeam[i].timestamp);
                    currTeam[i].timestamp = nextT;
                    if (nextT >= t) {
                        t = nextT;
                    } else {
                        nbAlerts++;
                        badTeam = team;
                        ok = false;
                    }
                }
            }
            if (nbAlerts > 0) {
                alert("Data not in chronological order, at least for user/team " + badTeam);
            }
            return ok;
        },

        countShortVerbs: function (verb, team) {
            var nb = 0;
            for (var i = 0; i < team.length; i++) {
                if (team[i].shortVerb === verb) {
                    nb++;
                }
            }
            return nb;
        },
        
        // Returns the level info object for the given team.
        // Param "team" may be a the name of the team or directly its object.
        getLevels: function(team) {
            if (typeof team === "string") {
                return this.teams[team][0].levels;
            } else {
                return team[0].levels;                
            }
        },

        getName: function(team) {
            return team[0].team;
        },
        
        // Adds attribute "levelInfo" to all statements: { level, start, end, completed }
        // Adds attribute "levels" to the team object: [ levelInfo, ... ]
        // Returns the last completed level.
        setupTeamLevels: function(team) {
            var levels = [],
                completed = 0,
                prevLevel = -1,
                prevLevelEnd = -1,
                i, levelInfo;
            
            for (var level in this.levels) {
                completed = this.indexOf(team, "completed", PROGGAME_LEVEL_PREFIX + level, completed);
                if (completed > 0) {
                    var firstStmtNo = prevLevelEnd+1,
                        lookAhead = completed+1;
                    // Integrate statements following the completion of the level, like variable updates, up to the start of the next level:
                    while (lookAhead < team.length && team[lookAhead].shortVerb !== "initialized") {
                        lookAhead++;
                    }
                    completed = lookAhead-1;
                    if (firstStmtNo < completed) {
                        levelInfo = { level: level, start: firstStmtNo, end: completed, completed: true };
                        team[firstStmtNo].levelInfo = levelInfo;
                        levels[level] = levelInfo;
                    }
                    for (i = firstStmtNo; i <= completed; i++) {
                        team[i].levelInfo = levelInfo;
                    }
                    prevLevelEnd = completed;
                    prevLevel = level;
                } else {
                    // Level not completed, mark remaining statements as not completed and exit.
                    levelInfo = { level: level, start: prevLevelEnd+1, end: team.length-1, completed: false };
                    for (i = prevLevelEnd+1; i < team.length; i++) {
                        team[i].levelInfo = levelInfo;
                    }
                    levels[level] = levelInfo;
                    break;
                }
            }
            team[0].levels = levels;
            return prevLevel;
        },

        
        // Returns the index of the chronologically first given verb with the given objectId,
        // or -1 if not found.
        indexOf: function (team, verb, objectId, startFrom, upperBound) {
            startFrom = startFrom || 0;
            upperBound = upperBound || team.length-1;
            for (var i = startFrom; i <= upperBound; i++) {
                if (team[i].shortVerb === verb &&
                    team[i][OBJECT_ID] === objectId) {
                    return i;
                }
            }
            return -1;
        },
        
        newUnfinishedLevel: function() {
            return { 
                submissions: '', syntaxErrors: '', semanticErrors: '', 
                successes: '', resubmissions: '',
                theoryReads: '', theoryDuration: '',
                sequence: ''
            };
        },
        
        newLevelSummary: function(submissions, resubmissions,
                                  syntaxErrors, semanticErrors, successes,
                                  theoryReads, theoryDuration, sequence) {
            return { 
                submissions: submissions, resubmissions: resubmissions, 
                syntaxErrors: syntaxErrors, semanticErrors: semanticErrors, 
                successes: successes,
                theoryReads: theoryReads, theoryDuration: theoryDuration,
                sequence: sequence
            };
        },
        
        // Count submissions, syntax and semantic errors for the given team.
        // If argument 'level' is undefined, count events for the whole game.
        // Also count theory reads and durations.
        // Also return the sequence of significant events.
        countEvents: function (team, level) {
            var fromPos, toPos;
            if (!level) {
                // Process the whole game:
                fromPos = 0;
                toPos = team.length-1;
                // Check if this player did not even finish the first level:
                if (!team[0].levelInfo.completed && this.excludeUnfinishedLevels) {
                    return this.newUnfinishedLevel();
                }
            } else {
                var levelInfo = this.getLevels(team)[level];
                if (levelInfo) {
                    fromPos = levelInfo.start;
                    toPos = levelInfo.end;
                    if (!levelInfo.completed && this.excludeUnfinishedLevels) {
                        return this.newUnfinishedLevel();
                    }
                } else {
                    return this.newUnfinishedLevel();
                }
            }
            
            var syntaxErrors = 0,
                semanticErrors = 0,
                successes = 0,
                submissions = 0,
                duplicatas = 0,
                prevCode = '',
                theoryReads = 0,
                theoryDuration = 0,
                reads = [],
                sequence = '<span class="sequence" data-team="' + this.getName(team) + '" data-level="' + (level ? level : -1) + '">';

            for (var i = fromPos; i <= toPos; i++) {
                var currStmt = team[i];
                if (!currStmt.levelInfo.completed && this.excludeUnfinishedLevels) {
                    break;
                }
                if (currStmt.shortVerb === "submit") {
                    // First filter out any duplicate code submission:
                    if (currStmt.result.trim() === prevCode) {
                        duplicatas++;
                        continue;
                    }
                    prevCode = currStmt.result.trim();
                    submissions++;
                    if (currStmt.completion === "false") {
                        if (currStmt.success === "false") {
                            syntaxErrors++;
                            sequence += '<span class="syntax-error" title="Syntax error (' + currStmt.timestamp.toTimeString().substr(0,8) + ')">SYN</span>';
                        } else {
                            semanticErrors++;
                            sequence += '<span class="semantic-error" title="Semantic error (' + currStmt.timestamp.toTimeString().substr(0,8) + ')">SEM</span>';
                        }
                    } else {
                        if (currStmt.success === "false") {
                            alert("combinaison impossible");
                        } else {
                            successes++;
                            sequence += '<span class="success" title="Success ('+ currStmt.timestamp.toTimeString().substr(0,8) + ')">OK</span>';
                        }
                    }
                // Investigate theory reads WHICHEVER topic is consulted.
                // This code is expected to correctly manage interleaved suspend/resume verbs for different theory topics,
                // therefore we scan all statements sequentially, without skipping any potential "resume" of another topic in-between.
                } else if ((currStmt.shortVerb === "initialized" || currStmt.shortVerb === "resumed") && 
                           currStmt.shortObject === THEORY_SHORTOBJECT &&
                           !currStmt._accounted) {
                    theoryReads++;
                    var topic = currStmt.objectParam;
                    currStmt._accounted = true;
                    reads.push(currStmt);
                    // Find the corresponding "suspended" verb
                    var endTopic = this.indexOf(team, "suspended", PROGGAME_THEORY_PREFIX + topic, i+1, toPos);
                    if (endTopic < 0) {
                        Y.log("Pas de fin de lecture de la théorie pour le joueur " + this.getName(team));
                        // Arrange for duration to be null:
                        endTopic = i;
                    } else {
                        // Try to concatenate chained resumed/suspended sequences on the same theory topic.
                        // (the player may indeed spend a lot of time reading without interacting much with the GUI).
                        var lookAhead = endTopic+1,
                            lookAheadStmt = team[lookAhead];
                        while (lookAheadStmt &&
                               lookAheadStmt.shortVerb === "resumed" && 
                               lookAheadStmt.shortObject === THEORY_SHORTOBJECT &&
                               lookAheadStmt.objectParam === topic) {
                            lookAheadStmt._accounted = true;
                            reads.push(lookAheadStmt);
                            var endTopic2 = this.indexOf(team, "suspended", PROGGAME_THEORY_PREFIX + topic, lookAhead+1, toPos);
                            if (endTopic2 < 0) {
                                Y.log("Pas de fin de lecture de la théorie pour le joueur " + this.getName(team));
                                break;
                            }
                            Y.log("Concatenate theory reads on topic '" + topic + "' at " + lookAheadStmt.timestamp + " (stmt " + lookAhead + ")");
                            endTopic = endTopic2;
                            lookAhead = endTopic2+1;
                            lookAheadStmt = team[lookAhead];
                        }
                    }
                    var duration = Math.round((team[endTopic].timestamp - currStmt.timestamp) / 1000);
                    topic += ' (' + currStmt.timestamp.toTimeString().substr(0,8) + ' - ' + team[endTopic].timestamp.toTimeString().substr(0,8) + ")";
                    theoryDuration += duration;
                    sequence += '<span class="theory" title="Theory: ' + topic + '">TH:'+ duration + 's</span>';
                } else if (currStmt.shortVerb === "initialized" && 
                           currStmt.shortObject === PROGGAME_LEVEL_SHORTOBJECT) {
                    sequence += '<span class="initialize-level"> </span>';
                }
            }
            sequence += '</span>';
            for (var r in reads) {
                reads[r]._accounted = false;
            }

            return this.newLevelSummary(submissions, duplicatas, syntaxErrors, semanticErrors, successes, theoryReads, theoryDuration, sequence);
        },
        
        // Produces a textual listing of the given level for the given team
        dumpLevel: function(teamName, level) {
            var team = this.teams[teamName],
                interval = this.getLevels(team)[level],
                lines = [];
            if (interval.start < 0 || interval.end < 0) {
                Y.log("dumpLevel impossible");
            }
            for (var i = interval.start; i <= interval.end; i++) {
                var curr = team[i];
                lines.push(curr.timestamp.toTimeString().substr(0,8) + ' &nbsp; ' + 
                        curr.shortVerb + ' &nbsp; ' + curr.shortObject + ' &nbsp; ' + 
                        (curr.objectParam ? curr.objectParam : ''));
            }
            var panel = this.getPanel({
                content:
                    '<div class="no-user-select header"><div class="title">Joueur: ' + 
                    teamName + ' - Niveau: ' + (level/10).toFixed(1) +
                    '</div><button class="yui3-button close-button">X</button></div>' +
                    '<div style="margin:30px auto;"><div style="text-align:left; margin:auto; width: fit-content;">' +
                    lines.join('<br>') +
                    "</div></div>"
            });
        },

        getPanel: function(cfg) {
            var panel = new Y.Wegas.Panel(
                Y.mix(cfg, {
                    modal: false,
                    centered: true,
                    width: 300,
                    buttons: {}
                })
            ).render();
            panel.plug(Y.Plugin.DraggablePanel, {});
            panel.get('boundingBox').addClass('proggame-stats-panel')
                    .one('button').on('click', function(){ panel.exit(); });
            return panel;
        },
            
        calcSum: function (teams, column) {
            var total = 0;
            for (var team in teams) {
                total += teams[team][column];
            }
            return total;
        },

        calcMeans: function (teams, column) {
            var total = 0,
                nb = 0;
            for (var team in teams) {
                nb++;
                total += teams[team][column];
            }
            return (total / nb);
        },
        
        // Returns the sum, mean and stdev of the given column in one object.
        digestColumn: function (teams, column) {
            var total = 0,
                nb = 0,
                team, val;
            for (team in teams) {
                val = teams[team][column];
                if (typeof val === 'number') {
                    nb++;
                    total += val;
                }
            }
            var avg = total / nb,
                sumSq = 0,
                diff;
            if (nb !== 0) {
                for (team in teams) {
                    val = teams[team][column];
                    if (typeof val === 'number') {
                        diff = teams[team][column] - avg;
                        sumSq += diff*diff;
                    }
                }
            }
            var stdev = Math.sqrt(sumSq / nb);
            return { card: nb, sum: total, mean: avg, stdev: stdev };
        },

        // Convenience function to store digest of 'column' of 'inputTable' into 'target'
        digestAndStoreColumn: function(inputTable, column, target) {
            var digestObj = this.digestColumn(inputTable, column);
            target.Sum[column] = digestObj.sum;
            target.Mean[column] = digestObj.card !== 0 ? digestObj.mean : '';
            target.Stdev[column] = digestObj.card !== 0 ? digestObj.stdev : '';
        },
            
        // Convenience function to store empty digest into 'column' of 'target'
        emptyDigestAndStoreColumn: function(column, target) {
            target.Sum[column] = '';
            target.Mean[column] = '';
            target.Stdev[column] = '';
        },

        addCounters: function (teams, outputTable) {
            var currError, lvl;
            
            this.outputColgroupHeaders.push("GLOBAL");
            this.outputColumnHeaders.push("Submits", "Syntax errs", "Semantic errs", "Successes", "Theory reads", "Theory [secs]");  //, "Sequence");
            this.outputColgroups.push({ span: 6, clazz: "even" });
            var colGroup = 3;
            for (lvl in this.levels) {
                var strLvl = (lvl/10).toFixed(1);
                this.outputColgroupHeaders.push("Niv. "+strLvl);
                this.outputColumnHeaders.push("Submits", "Synt.", "Sem.", "Theory", "Theory [secs]", "Sequence");
                this.outputColgroups.push({ span: 6, clazz: (colGroup%2 === 1 ? "odd" : "even") });
                colGroup++;;
            }

            for (var team in teams) {
                currError = this.countEvents(teams[team]);
                outputTable[team].submits = currError.submissions;
                outputTable[team].syntaxErrors = currError.syntaxErrors;
                outputTable[team].semanticErrors = currError.semanticErrors;
                outputTable[team].successes = currError.successes;
                outputTable[team].theoryReads = currError.theoryReads;
                outputTable[team].theoryDuration = currError.theoryDuration;
                //outputTable[team].sequence = currError.sequence;
                
                for (lvl in this.levels) {
                    currError = this.countEvents(teams[team], lvl);
                    outputTable[team]["submits"+lvl] = currError.submissions;
                    outputTable[team]["syntaxErrors"+lvl] = currError.syntaxErrors;
                    outputTable[team]["semanticErrors"+lvl] = currError.semanticErrors;
                    outputTable[team]["theoryReads"+lvl] = currError.theoryReads;
                    outputTable[team]["theoryDuration"+lvl] = currError.theoryDuration;
                    outputTable[team]["sequence"+lvl] = currError.sequence;
                }
            }
            
            this.digestAndStoreColumn(outputTable, "submits", this.teamsTableBottom);
            this.digestAndStoreColumn(outputTable, "syntaxErrors", this.teamsTableBottom);
            this.digestAndStoreColumn(outputTable, "semanticErrors", this.teamsTableBottom);
            this.digestAndStoreColumn(outputTable, "successes", this.teamsTableBottom);
            this.digestAndStoreColumn(outputTable, "theoryReads", this.teamsTableBottom);
            this.digestAndStoreColumn(outputTable, "theoryDuration", this.teamsTableBottom);
            //this.emptyDigestAndStoreColumn("sequence", this.teamsTableBottom);

            for (lvl in this.levels) {
                this.digestAndStoreColumn(outputTable, "submits"+lvl, this.teamsTableBottom);
                this.digestAndStoreColumn(outputTable, "syntaxErrors"+lvl, this.teamsTableBottom);
                this.digestAndStoreColumn(outputTable, "semanticErrors"+lvl, this.teamsTableBottom);
                this.digestAndStoreColumn(outputTable, "theoryReads"+lvl, this.teamsTableBottom);
                this.digestAndStoreColumn(outputTable, "theoryDuration"+lvl, this.teamsTableBottom);
                this.emptyDigestAndStoreColumn("sequence"+lvl, this.teamsTableBottom);
            }
        },
        
        prepareOutputTable: function(teams) {
            var teamsOutput = {};
            this.outputColgroupHeaders = [""];
            this.outputColumnHeaders = ["Joueur"];
            this.outputColgroups = [{ span: 1, clazz: "odd"}];
            this.teamsTableBottom = {
                Sum : {},
                Mean : {},
                Stdev: {}
            };
            for (var team in teams) {
                teamsOutput[team] = { };
            }
            this.teamsOutputTable = teamsOutput;
            return teamsOutput;
        },
        
        genOutput: function (teamsOutputTable, nbDecimals) {
            nbDecimals = nbDecimals || 2;
            var str = '<table id="' + TABLE_ID + '"><colgroup>';
            for (var g in this.outputColgroups) {
                var gConf = this.outputColgroups[g];
                str += '<col span="' + gConf.span + '" class="' + gConf.clazz + '">';
            }
            str += "</colgroup>";
            // Generate Group Headers
            str += '<thead><tr class="header">';
            for (var colgroup in this.outputColgroupHeaders) {
                var currHead = this.outputColgroupHeaders[colgroup],
                    span = this.outputColgroups[colgroup].span;
                str += '<th colspan="' + span + '">' + currHead + '</th>';
            }
            str += "</tr>";
            // Generate Column Headers
            str += '<tr class="header">';
            for (var head in this.outputColumnHeaders) {
                var currHead = this.outputColumnHeaders[head];
                str += '<th>' + currHead + '</th>';
            }
            str += "</tr></thead><tbody>";
            // Generate main output lines:
            for (var team in teamsOutputTable) {
                var currTeam = teamsOutputTable[team];
                str += "<tr>";
                str += "<th>" + team + "</th>";
                for (var item in currTeam) {
                    var currItem = currTeam[item];
                    if (currItem === '' || isNaN(currItem) || Number.isSafeInteger(currItem)) {
                        str += "<td>" + currItem + "</td>";                        
                    } else {
                        str += "<td>" + currItem.toFixed(nbDecimals) + "</td>";                        
                    }
                }
                str += "</tr>";
            }
            str += "</tbody><tfoot>"
            // Generate bottom summary lines
            for (var line in this.teamsTableBottom) {
                var curr = this.teamsTableBottom[line];
                str += '<tr class="' + line.toLowerCase() + '"><th>' + line + '</th>';
                for (var item2 in curr) {
                    if (Number.isSafeInteger(curr[item2]) || curr[item2] === '') {
                        str += "<td>" + curr[item2] + "</td>";
                    } else {
                        str += "<td>" + curr[item2].toFixed(nbDecimals) + "</td>";                        
                    }
                }
                str += "</tr>";
            }
            str += "</tfoot></table>";
            Y.one(PACT_STATS_TABLE).setHTML(str);
        },
        
        addHeader: function(msg) {
            Y.one(PACT_STATS_HEADER).append("<p>" + msg + "</p>");
        },
        
        clearPage: function(msg) {
            Y.one(PACT_STATS_FOOTER).setHTML("");
            Y.one(PACT_STATS_TABLE).setHTML("");
            Y.one(PACT_STATS_HEADER).setHTML("");
        },

        abort: function(msg) {
            Y.one(PACT_STATS_HEADER).append("<p>" + msg + "</p>");
            throw msg;
        },

        getGameLevels: function () {
            var ctx = this;
            return new Y.Promise(function(resolve) {
                Y.Wegas.Facade.Variable.script.remoteEval(
                    'gameModel.getPages();',
                    {
                        on: {
                            success: function(res) {
                                var pages = JSON.parse(res.data.response),
                                    levels = {},
                                    nbPages = 0,
                                    currPageNo = 0;
                                if (pages) {
                                    pages = pages.updatedEntities[0];
                                    // Find the first game level page (normally 10 or 11)
                                    for (var p in pages) {
                                        var page = pages[p];
                                        if (page.type === "ProgGameLevel") {
                                            currPageNo = +p;
                                            break;
                                        }
                                    }
                                    if (currPageNo){
                                        do {
                                            nbPages++;
                                            levels[currPageNo] = nbPages;
                                            // Make sure object keys are numbers to enable later iteration in increasing order
                                            currPageNo = +pages[currPageNo].onWin;
                                        } while (currPageNo !== undefined && currPageNo < 900);
                                        ctx.levels = levels;
                                        var liste = '';
                                        for (var lvl in levels) {
                                            liste += (lvl/10).toFixed(1) + ' &nbsp;';
                                        }
                                        ctx.addHeader("Niveaux actifs dans ce jeu : " + liste);
                                        resolve("got levels");
                                    } else {
                                        ctx.abort("Impossible de trouver les pages de jeu");
                                    }
                                }
                            },
                            failure: function() {
                                ctx.abort("Problème de comm avec le serveur");
                            }
                        }
                    }
                );
            });
        },

        // Invoked when the dashboard tab gets visible
        refreshFromTab: function(e) {
            if (e.newVal) {
                this.updateOptions();
                this.refresh();
            }
        },
        
        // Invoked by the refresh button
        refreshFromIcon: function() {
            var btn = this.get("contentBox").one("#refresh").addClass("fa-spin");
            this.refresh();
            Y.later(1000, this, function(){ btn.removeClass("fa-spin"); });
        },
        
        // Refresh page (tab contents)
        refresh: function() {
            this.clearPage();
            var owner = {
                name: "Game",
                id: Y.Wegas.Facade.Game.cache.getCurrentGame().get("id")
            };
            var logId = Y.Wegas.Facade.GameModel.cache.getCurrentGameModel().get("properties").get("val").logID;
            var path = owner.name === "Game" || owner.name === "DebugGame" ? "Games" : "Teams";

            Y.io(Y.Wegas.app.get("base") + "rest/Statistics/Export/" + logId + "/" + path + "/" + owner.id, {
                "method": "GET",
                on: {
                    success: Y.bind(function (rId, xmlHttpRequest) {
                        var response = xmlHttpRequest.response;
                        this.datatable = this.csv2obj(response);
                        this.shortenVerbs(this.datatable);
                        this.shortenObjects(this.datatable);
                        this.teams = this.splitTeams(this.datatable);
                        var nbTeamsInitial = Object.keys(this.teams).length;
                        if (nbTeamsInitial === 0) {
                            this.abort("Aucun joueur n'a commencé.");
                        }
                        if (this.excludeOutliers) {
                            this.teams = this.removeOutliers(this.teams);
                            var nbTeams2 = Object.keys(this.teams).length,
                                diffTeams = nbTeamsInitial - nbTeams2;
                            if (nbTeams2 === 0) {
                                this.abort("Aucun joueur n'a suffisamment avancé pour produire des statistiques utiles.");
                            } else if (diffTeams > 0) {
                                this.addHeader("" + diffTeams + " joueur(s) écarté(s) pour avoir terminé moins de " + MIN_LEVELS_OUTLIERS + " niveaux.");
                            }
                        }
                        this.checkTimestamps(this.teams);
                        this.teamsOutput = this.prepareOutputTable(this.teams);
                        this.addCounters(this.teams, this.teamsOutput);
                        this.genOutput(this.teamsOutput);
                    }, this),
                    failure: Y.bind(function () {
                        this.abort("Impossible de télécharger les logs.");
                    }, this)
                }
            });
        },
        
        
        bindUI: function() {
            var cb = this.get("contentBox");
            // Detects when the tab continaing this widget is selected:
            this.handlers.push(
                this.get("parent").after("selectedChange", Y.bind(this.refreshFromTab, this))
            );
            this.handlers.push(
                cb.delegate('click', function(){ this.exportTableToCSV(',') }, "#downloadTableComma", this)
            );
            this.handlers.push(
                cb.delegate('click', function(){ this.exportTableToCSV('.') }, "#downloadTablePoint", this)
            );
            this.handlers.push(
                cb.delegate('click', this.refreshFromIcon, "#refresh", this)
            );
            this.handlers.push(
                cb.delegate('click', function(e){
                    this.dumpLevel(e.currentTarget.getData()["team"], e.currentTarget.getData()["level"]);
                },
                ".sequence", this)
            );
            this.handlers.push(
                cb.delegate('click', this.updateOptions, PACT_STATS_OPTIONS + " input", this)
            );
        },

        updateOptions: function (e) {
            var cb = this.get("contentBox"),
                cbx1 = cb.one("#exclude-outliers"),
                cbx2 = cb.one("#exclude-unfinished");
            this.excludeOutliers = cbx1.get("checked");
            this.excludeUnfinishedLevels = cbx2.get("checked");
            // Param 'e' should be defined only if invoked by a click on a checkbox:
            if (e) {
                this.refresh();
            }
        },

        initOptions: function () {
            var cb = this.get("contentBox"),
                cbx1 = cb.one("#exclude-outliers"),
                cbx2 = cb.one("#exclude-unfinished");

            this.excludeOutliers = true;
            this.excludeUnfinishedLevels = true;

            cbx1.set("checked", this.excludeOutliers);
            cbx2.set("checked", this.excludeUnfinishedLevels);
        },
        
        initializer: function () {
            this.initOptions();
            this.handlers = [];
            this.getGameLevels().then(Y.bind(function(){
                // @TODO charger les annotations permettant de corriger les stats:
                //this.download(ANNOTATED_FILENAME, this.csv2obj);
            }, this));
        },

        destructor: function () {
            for (var k in this.handlers) {
                this.handlers[k].detach();
            }
        },

        download: function(url, callbackF) {
            var cfg = {
                    method: "GET"
                },
                handler, request;
            function onComplete(transactionId, responseObject, e) {
                handler.detach();
                if (responseObject.status === 200) {
                    this.source = responseObject.responseText;
                    Y.bind(callbackF, this)();
                } else {
                    Y.log("Erreur " + responseObject.status + " lors du chargement du fichier annoté");
                }
            }
            handler = Y.on('io:complete', onComplete, this, callbackF);
            request = Y.io(url, cfg);
        },


        csv2obj: function (csv) {
            var lines = this.CSVToArray(csv),
                result = [],
                headers = lines[0],
                nbCols = headers.length;

            this.headers = headers;

            for (var i = 1; i < lines.length; i++) {
                if (lines[i].length !== 0 && lines[i][0].length !== 0) {
                    var obj = {},
                        currentline = lines[i],
                        currCol = 0,
                        nonEmptyCols = 0,
                        currHeader = "",
                        currValue = "";
                    while (nonEmptyCols < nbCols) {
                        currHeader = headers[currCol];
                        currValue = currentline[currCol];
                        if (currHeader.length > 0) {
                            obj[currHeader] = currValue;
                            nonEmptyCols++;
                        }
                        currCol++;
                    }
                    if (obj.team.length === 0) {
                        obj.team = obj.actor;
                    }
                    result.push(obj);
                }
            }
            return result;
        },

        // Adds a "shortVerb" to all entries of the given datatable
        shortenVerbs: function(datatable) {
            var verbs = [],
                shortVerbs = [],
                i, stmt, pos;
            for (i = 0; i < datatable.length; i++) {
                stmt = datatable[i];
                if (verbs.indexOf(stmt.verb) === -1) {
                    verbs.push(stmt.verb);
                    var parts = stmt.verb.split('/'),
                        lastPart = parts[parts.length-1];
                    if (shortVerbs.indexOf(lastPart) === -1) {
                        shortVerbs.push(lastPart);
                    } else {
                        // @TODO: find shortest different substring from the end of the strings
                        alert("Duplicate verb: " + lastPart);
                    }
                }
            }
            for (i = 0; i < datatable.length; i++) {
                stmt = datatable[i];
                pos = verbs.indexOf(stmt.verb);
                stmt.shortVerb = shortVerbs[pos];
            }            
        },

        // Adds a "shortObject" and "objectParam" to all entries of the given datatable
        shortenObjects: function(datatable) {
            var objects = [],
                shortObjects = [],
                isInternal,
                i, stmt, obj, pos, parts;
            // First identify all types of xAPI objects (and store any objectParams).
            // Objects in PACT have a fixed structure, as opposed to the verbs used.
            for (i = 0; i < datatable.length; i++) {
                stmt = datatable[i];
                obj = stmt[OBJECT_ID];
                parts = obj.split('/');
                isInternal = obj.indexOf(OBJECT_PROGGAME_PREFIX) === 0;
                if (isInternal) {
                    if (parts[4]) {
                        stmt.objectParam = parts[4];
                    }
                } else if (stmt.shortVerb === "author") {
                    // Just a simplification for dumpLevel():
                    stmt.objectParam = stmt.result;
                }
                if (objects.indexOf(obj) === -1) {
                    objects.push(obj);
                    var lastPart = isInternal ?
                        parts[3] : // "best object identifier"
                        parts[2]; // Name of the modified variable
                    if (shortObjects.indexOf(lastPart) !== -1 &&
                        !stmt.objectParam) {
                        alert("Duplicate object: " + lastPart);
                    }
                    shortObjects.push(lastPart);
                }
            }
            // Then create the new fields:
            for (i = 0; i < datatable.length; i++) {
                stmt = datatable[i];
                pos = objects.indexOf(stmt[OBJECT_ID]);
                stmt.shortObject = shortObjects[pos];
            }            
        },

        /**
         * From http://www.bennadel.com/blog/1504-ask-ben-parsing-csv-strings-with-javascript-exec-regular-expression-command.htm
         * CSVToArray parses any String of Data including '\r' '\n' characters,
         * and returns an array with the rows of data.
         * @param {String} CSV_string - the CSV string you need to parse
         * @param {String} delimiter - the delimeter used to separate fields of data
         * @returns {Array} rows - rows of CSV where first row are column headers
         */
        CSVToArray: function (CSV_string, delimiter) {
            delimiter = (delimiter || ","); // user-supplied delimeter or default comma

            var pattern = new RegExp(// regular expression to parse the CSV values.
                    (// Delimiters:
                            "(\\" + delimiter + "|\\r?\\n|\\r|^)" +
                            // Quoted fields.
                            "(?:\"([^\"]*(?:\"\"[^\"]*)*)\"|" +
                            // Standard fields.
                            "([^\"\\" + delimiter + "\\r\\n]*))"
                            ), "gi"
                    );

            var rows = [[]];  // array to hold our data. First row is column headers.
            // array to hold our individual pattern matching groups:
            var matches = false; // false if we don't find any matches
            // Loop until we no longer find a regular expression match
            while (matches = pattern.exec(CSV_string)) {
                var matched_delimiter = matches[1]; // Get the matched delimiter
                // Check if the delimiter has a length (and is not the start of string)
                // and if it matches field delimiter. If not, it is a row delimiter.
                if (matched_delimiter.length && matched_delimiter !== delimiter) {
                    // Since this is a new row of data, add an empty row to the array.
                    rows.push([]);
                }
                var matched_value;
                // Once we have eliminated the delimiter, check to see
                // what kind of value was captured (quoted or unquoted):
                if (matches[2]) { // found quoted value. unescape any double quotes.
                    matched_value = matches[2].replace(
                            new RegExp("\"\"", "g"), "\""
                            );
                } else { // found a non-quoted value
                    matched_value = matches[3];
                }
                // Now that we have our value string, let's add
                // it to the data array.
                rows[rows.length - 1].push(matched_value);
            }
            return rows; // Return the parsed data matrix
        }
        
    }, {
        EDITORNAME: "PACT stats",
        ATTRS: {}
    });

}, 'V1', {requires: ['node']});
