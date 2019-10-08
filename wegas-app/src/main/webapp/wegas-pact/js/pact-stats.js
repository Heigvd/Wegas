YUI.add('pact-stats', function (Y) {
    "use strict";
    
    var OBJECT_ID = "object id", // In Cyril's logs it's just "object"
        OBJECT_PREFIX = "internal://wegas/",
        PROGGAME_LEVEL_PREFIX = OBJECT_PREFIX + "proggame-level/",
        PROGGAME_THEORY_PREFIX = OBJECT_PREFIX + "proggame-theory/",
        ANNOTATED_FILENAME = "xapi-annotated.csv",
        // Existing game levels as an easily iterable enumeration. Attribute values give the corresponding position.
        // @TODO make this dynamic, depending on actually available game levels!
        LEVELS = {11:1, 12:2, 21:3, 22:4, 23:5, 24:6, 31:7, 32:8, 33:9, 34:10, 41:11, 42:12};
        
    var MIN_LEVELS_OUTLIERS = 3;

    Y.Wegas.PactStats = Y.Base.create("pact-stats", Y.Widget,
            [Y.WidgetParent, Y.WidgetChild, Y.Wegas.Widget, Y.Wegas.Editable], {
        CONTENT_TEMPLATE: '<div class="pact-stats-widget" style="background:white;"></div>',


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
            return teams;
        },

        // Filters out outliers, i.e. teams with less than given number of code submissions or completed levels.
        // The minimal number of levels is obviously the strongest condition.
        removeOutliers: function(teams) {
            var minLevels = minLevels || MIN_LEVELS_OUTLIERS;
            for (var team in teams) {
                var lastLevel = this.markCompletedLevels(teams[team]);
                if (lastLevel < 0 || LEVELS[lastLevel] < minLevels) {
                    delete teams[team];
                }
            }
            return teams;
        },
        
        // Checks if timestamps are in chronological order (which they should)
        checkTimestamps: function(teams) {
            var ok = true,
                nbAlerts = 0,
                badTeam = '';
            for (var team in teams) {
                var currTeam = teams[team],
                    t = "0";
                for (var i = 0; i < currTeam.length; i++) {
                    var nextT = currTeam[i].timestamp;
                    if (nextT >= t || new Date(nextT) >= new Date(t)) {
                        t = nextT;
                    } else {
                        nbAlerts++;
                        badTeam = team;
                        ok = false;
                    }
                }
            }
            if (nbAlerts > 0) {
                alert("Data not in chronological order, at least for team " + badTeam);
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

        // Sets attribute completed=true for all statements of completed levels (to prevent statistics on abandoned levels).
        // Returns the last completed level.
        markCompletedLevels: function(team) {
            var completed = 0,
                prevLevel = -1,
                prevLevelEnd = -1,
                i;
            for (var level in LEVELS) {
                completed = this.indexOf(team, "completed", PROGGAME_LEVEL_PREFIX + level, completed);
                if (completed > 0) {
                    for (i = prevLevelEnd+1; i <= completed; i++) {
                        team[i].completed = true;
                    }
                    prevLevelEnd = completed;
                    prevLevel = level;
                } else {
                    // No more completed levels, mark remaining statements as not completed and exit.
                    for (i = prevLevelEnd+1; i < team.length; i++) {
                        team[i].completed = false;
                    }
                    return prevLevel;
                }
            }
            return prevLevel;
        },

        
        // Returns the index of the chronologically first given verb with the given objectId,
        // or -1 if not found.
        indexOf: function (team, verb, objectId, startFrom) {
            startFrom = startFrom || 0;
            for (var i = startFrom; i < team.length; i++) {
                if (team[i].shortVerb === verb &&
                    team[i][OBJECT_ID] === objectId) {
                    return i;
                }
            }
            return -1;
        },
        
        noNewSubmissions: function() {
            return { submissions: '', syntaxErrors: '', semanticErrors: '', successes: '', resubmissions: '' };
        },
        
        newSubmissionSummary: function(submissions, resubmissions, syntaxErrors, semanticErrors, successes) {
            return { submissions: submissions, resubmissions: resubmissions, syntaxErrors: syntaxErrors, semanticErrors: semanticErrors, successes: successes };
        },
        
        // Count syntax and semantic errors at given level.
        // Arg level must follow the internal format, i.e. "11" for "1.1"
        countSubmissionsForLevel: function (team, level) {
            level = level || 11;
            var start = this.indexOf(team, "initialized", PROGGAME_LEVEL_PREFIX + level);
            if (start < 0) {
                return this.noNewSubmissions();
            }
            start++;
            var end = this.indexOf(team, "completed", PROGGAME_LEVEL_PREFIX + level, start);
            if (end < 0) {
                return this.noNewSubmissions();
            }
            return this.countSubmissions(team, start, end-1);
        },
        
        // Count submissions, syntax and semantic errors for team between fromPos and toPos (included)
        countSubmissions: function (team, fromPos, toPos) {
            fromPos = fromPos || 0;
            toPos = toPos || team.length-1;
            var syntaxErrors = 0,
                semanticErrors = 0,
                successes = 0,
                submissions = 0,
                duplicatas = 0,
                prevCode = '';
            for (var i = fromPos; i <= toPos; i++) {
                var currStmt = team[i];
                if (!currStmt.completed) {
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
                        } else {
                            semanticErrors++;
                        }
                    } else {
                        if (currStmt.success === "false") {
                            alert("combinaison impossible");
                        } else {
                            successes++;
                        }
                    }
                }
            }
            return this.newSubmissionSummary(submissions, duplicatas, syntaxErrors, semanticErrors, successes);
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
            return { sum: total, mean: avg, stdev: stdev };
        },

        // Convenience function to store digest of 'column' of 'inputTable' into 'target'
        digestAndStoreColumn: function(inputTable, column, target) {
            var digestObj = this.digestColumn(inputTable, column);
            target.Sum[column] = digestObj.sum;
            target.Mean[column] = digestObj.mean.toFixed(2);
            target.Stdev[column] = digestObj.stdev.toFixed(2);
        },
            
        addCounters: function (teams, outputTable) {
            var currError, lvl, colIsOdd = true;
            
            this.teamsOutputHeaders.push("Submits", "Syntax errs", "Semantic errs", "Successes");
            this.teamsOutputColgroups.push({ span: 5, style: "background: white" });
            for (lvl in LEVELS) {
                var strLvl = lvl/10;
                this.teamsOutputHeaders.push("Submits "+strLvl, "Synt. "+strLvl, "Sem. "+strLvl);
                this.teamsOutputColgroups.push({ span: 3, style: (colIsOdd ? "background: #ddd;" : "background: #fff") });
                colIsOdd = !colIsOdd;
            }

            for (var team in teams) {
                currError = this.countSubmissions(teams[team]);
                outputTable[team].submits = currError.submissions;
                outputTable[team].syntaxErrors = currError.syntaxErrors;
                outputTable[team].semanticErrors = currError.semanticErrors;
                outputTable[team].successes = currError.successes;
                
                for (lvl in LEVELS) {
                    currError = this.countSubmissionsForLevel(teams[team], lvl);
                    outputTable[team]["submits"+lvl] = currError.submissions;
                    outputTable[team]["syntaxErrors"+lvl] = currError.syntaxErrors;
                    outputTable[team]["semanticErrors"+lvl] = currError.semanticErrors;
                }
            }
            
            this.digestAndStoreColumn(outputTable, "submits", this.teamsTableBottom);
            this.digestAndStoreColumn(outputTable, "syntaxErrors", this.teamsTableBottom);
            this.digestAndStoreColumn(outputTable, "semanticErrors", this.teamsTableBottom);
            this.digestAndStoreColumn(outputTable, "successes", this.teamsTableBottom);

            for (lvl in LEVELS) {
                this.digestAndStoreColumn(outputTable, "submits"+lvl, this.teamsTableBottom);
                this.digestAndStoreColumn(outputTable, "syntaxErrors"+lvl, this.teamsTableBottom);
                this.digestAndStoreColumn(outputTable, "semanticErrors"+lvl, this.teamsTableBottom);
            }
        },
        
        prepareOutputTable: function(teams) {
            var teamsOutput = {};
            this.teamsOutputHeaders = ["Team"];
            this.teamsOutputColgroups = [];
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
        
        genOutput: function (teamsOutputTable) {
            var str = "<table><colgroup>";
            for (var g in this.teamsOutputColgroups) {
                var gConf = this.teamsOutputColgroups[g];
                str += '<col span="' + gConf.span + '" style="' + gConf.style + '">';
            }
            str += "</colgroup>";
            // Generate Headers
            str += '<thead><tr class="header">';
            for (var head in this.teamsOutputHeaders) {
                var currHead = this.teamsOutputHeaders[head];
                str += '<th>' + currHead + '</th>';
            }
            str += "</tr></thead><tbody>";
            // Generate main output lines:
            for (var team in teamsOutputTable) {
                var currTeam = teamsOutputTable[team];
                str += "<tr>";
                str += "<th>" + team + "</th>";
                for (var item in currTeam) {
                    str += "<td>" + currTeam[item] + "</td>";
                }
                str += "</tr>";
            }
            str += "</tbody><tfoot>"
            // Generate bottom summary lines
            for (var line in this.teamsTableBottom) {
                var curr = this.teamsTableBottom[line];
                str += '<tr class="' + line.toLowerCase() + '"><th>' + line + '</th>';
                for (var item2 in curr) {
                    str += "<td>" + curr[item2] + "</td>";
                }
                str += "</tr>";
            }
            str += "</tfoot></table>";
            Y.one(".pact-stats-widget").setStyle('padding','10px').setStyle('text-align','right');
            Y.one(".pact-stats-widget").setHTML(str);
        },
        
        initializer: function () {
            if (Y.one("body.wegas-hostmode")) {
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
                            this.teams = this.splitTeams(this.datatable);
                            this.teams = this.removeOutliers(this.teams);
                            this.checkTimestamps(this.teams);
                            this.teamsOutput = this.prepareOutputTable(this.teams);
                            this.addCounters(this.teams, this.teamsOutput);
                            this.genOutput(this.teamsOutput);
                        }, this),
                        failure: function () {
                            alert("Could not load session statistics");
                        }
                    }
                });
            }
            this.download(ANNOTATED_FILENAME, callback);
        },
        
        download: function(url, callback) {
            var cfg = {
                    method: "GET"
                },
                handler, request;
            function onComplete(transactionId, responseObject, callback) {
                handler.detach();
                if (responseObject.status === 200) {
                    this.source = responseObject.responseText;
                    Y.bind(callback, this)();
                } else {
                    alert("Erreur " + responseObject.status + " lors du chargement du fichier source");
                }
            }
            handler = Y.on('io:complete', onComplete, this, callback);
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
                i, obj, pos;
            for (i = 0; i < datatable.length; i++) {
                obj = datatable[i];
                if (verbs.indexOf(obj.verb) === -1) {
                    verbs.push(obj.verb);
                    var parts = obj.verb.split('/'),
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
                obj = datatable[i];
                pos = verbs.indexOf(obj.verb);
                obj.shortVerb = shortVerbs[pos];
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

/*
Y.use(['wegas-pact-stats', 'node'], function () {
    Y.log("USE PACT Stats");
    setTimeout(function () {
        var pageLoader = Y.Wegas.PageLoader && Y.Wegas.PageLoader.find('previewPageLoader');
        if (pageLoader) {
            pageLoader.on('contentUpdated', function (e) {
                Y.Wegas.PactStats.prototype.init();
            });
        } else {
            Y.log("PageLoader unavailable");
        }
    }, 1000);
});
*/
