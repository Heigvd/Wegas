YUI.add('wegas-dataviz', function (Y) {
    "use strict";

    Y.Wegas.Dataviz = Y.Base.create("wegas-dataviz", Y.Widget,
            [Y.WidgetParent, Y.WidgetChild, Y.Wegas.Widget, Y.Wegas.Editable], {
        CONTENT_TEMPLATE: '<div class="dataviz" style="background:white;"></div>',


        splitTeams: function(datatable) {
            var teams = {};
            this.teamsOutput = {};
            this.teamsOutput.headers = ["Team"];
            for (var i = 0; i < datatable.length; i++) {
                var currTeam = datatable[i].team;
                if (teams[currTeam]) {
                    teams[currTeam].push(datatable[i]);
                } else {
                    teams[currTeam] = [datatable[i]];
                    this.teamsOutput[currTeam] = {};
                }
            }
            return teams;
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

        addCounters: function (teams, outputTable) {
            outputTable.headers.push("Submits");
            for (var team in teams) {
                outputTable[team].submit = this.countShortVerbs("submit", teams[team]);
            }
        },
        
        genOutput: function (teamsOutputTable) {
            var str = "<table>";
            for (var team in teamsOutputTable) {
                var currTeam = teamsOutputTable[team];
                str += "<tr>";
                if (team !== "headers") {
                    str += "<td>" + team + "</td>";
                }
                for (var item in currTeam) {
                    var currItem = currTeam[item]
                    str += "<td>" + currItem + "</td>";
                    // other output
                }
                str += "</tr>";
            }
            str += "</table>";
            Y.one(".wegas-dataviz").setHTML(str);
        },
        
        init: function () {
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
                        this.addCounters(this.teams, this.teamsOutput);
                        this.genOutput(this.teamsOutput);
                    }, this),
                    failure: function () {
                        Y.log("OUILLE");
                    }
                }
            });

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
                        obj.team = "T-" + obj.actor;
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
        EDITORNAME: "DataViz",
        ATTRS: {}
    });

}, 'V1', {requires: ['node']});


Y.use(['wegas-dataviz', 'node'], function () {
    Y.log("USE Dataviz");
    setTimeout(function () {
        var pageLoader = Y.Wegas.PageLoader && Y.Wegas.PageLoader.find('previewPageLoader');
        if (pageLoader) {
            pageLoader.on('contentUpdated', function (e) {
                Y.Wegas.Dataviz.prototype.init();
            });
        } else {
            Y.log("PageLoader unavailable");
        }
    }, 1000);
});
