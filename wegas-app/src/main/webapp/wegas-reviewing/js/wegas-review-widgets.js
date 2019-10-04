/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2018  School of Business and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
/* global Chartist, I18n */

/**
 * @fileoverview
 * @author Maxence Laurent (maxence.laurent gmail.com)
 */
YUI.add("wegas-review-widgets", function(Y) {
    "use strict";
    var CONTENTBOX = "contentBox", WIDGET = "widget", PAGEID = "pageId",
        Wegas = Y.Wegas, ReviewVariableEditor,
        BUTTON = "wegas-review-button",
        ReviewOrchestrator, ReviewWidget, ReviewTreeView, ReviewTV,
        GradeInput, TextEvalInput, CategorizationInput;

    /**
     * @name Y.Wegas.ReviewOrchestrator
     * @extends Y.Widget
     * @borrows Y.WidgetChild, Y.WidgetParent, Y.Wegas.Widget, Y.Wegas.Editable
     * @class  class loader of wegas's pages
     * @constructor
     * @description
     */
    ReviewOrchestrator = Y.Base.create("wegas-review-orchestrator", Y.Widget, [Y.WidgetChild, Wegas.Widget, Wegas.Editable], {
        /** @lends Y.Wegas.ReviewOrchestrator# */
        CONTENT_TEMPLATE:
            "<div>" +
            "    <div class=\"summary\">" +
            "        <div class=\"top-header\">" +
            "            <div class=\"header\">" +
            "                <h2>" + I18n.t("review.orchestrator.mainTitle") + "</h2>" +
            "                <span class=\"refresh\"></span>" +
            "            </div>" +
            "            <div class=\"control-panel\">" +
            "               <div class=\"state not-started\">" +
            "                   <h7>" + I18n.t("review.orchestrator.state.edition.title") + "</h7>" + I18n.t("review.orchestrator.state.edition.description") +
            "               </div>" +
            "               <div class=\"transition start-review\"><span class=\"fa fa-arrow-circle-right fa-4x\"></span></div>" +
            "               <div class=\"state reviewing\">" +
            "                   <h7>" + I18n.t("review.orchestrator.state.reviewing.title") + "</h7>" + I18n.t("review.orchestrator.state.reviewing.description") +
            "               </div>" +
            "               <div class=\"transition close-review\"><span class=\"fa fa-arrow-circle-right fa-4x\"></span></div>" +
            "               <div class=\"state commenting\">" +
            "                   <h7>" + I18n.t("review.orchestrator.state.commenting.title") + "</h7>" + I18n.t("review.orchestrator.state.commenting.description") +
            "               </div>" +
            "               <div class=\"transition close-comment\"><span class=\"fa fa-arrow-circle-right fa-4x\"></span></div>" +
            "               <div class=\"state closed\">" +
            "                   <h7>" + I18n.t("review.orchestrator.state.completed.title") + "</h7>" + I18n.t("review.orchestrator.state.completed.description") +
            "               </div>" +
            "               <div style=\"clear: both;\"></div>" +
            "           </div>" +
            "       </div>" +
            "       <div class=\"content\">" +
            "            <div class=\"properties\"><h2>" + I18n.tCap("review.orchestrator.properties") + "</h2>" +
            "               <div class=\"include-evicted\">" +
            "                   <span class=\"checkbox\">" + I18n.t("review.orchestrator.includeEvicted") + "</span>" +
            "               </div>" +
            "            </div>" +
            "            <div class=\"overview\"><h2>" + I18n.tCap("review.orchestrator.overview") + "</h2></div>" +
            "            <div class=\"reviews\"><h2>" + I18n.tCap("review.orchestrator.reviews") + "</h2></div>" +
            "            <div class=\"comments\"><h2>" + I18n.tCap("review.orchestrator.comments") + "</h2></div>" +
            "            <div class=\"charts\"></div>" +
            "        </div>" +
            "    </div>" +
            "</div>",
        initializer: function() {
            this.handlers = [];
            this.datatables = {};
            this._freeForAll = Y.Wegas.Facade.GameModel.cache.getCurrentGameModel().get("properties.freeForAll");

            this.detailsOverlay = new Y.Overlay({
                zIndex: 100,
                width: this.get("width"),
                constrain: true,
                visible: false
            }).render(this.get("contentBox"));

            this.detailsOverlay.get("contentBox").addClass("wegas-review-orchestrator--popup-overlay")
                .addClass("wegas-template-content");

        },
        countByStatus: function(instances) {
            var counters = {}, instance, key;
            for (key in instances) {
                if (instances.hasOwnProperty(key)) {
                    instance = instances[key];
                    counters[instance.get("reviewState")] = (counters[instance.get("reviewState")] + 1) || 1;
                }
            }
            return counters;
        },
        renderUI: function() {
            var prd = this.get("variable.evaluated"), ctx;
            ctx = this;
            this.refreshButton = new Y.Button({
                label: "<i class=\"fa fa-3x fa-refresh\"></i>",
                //label: "<span class=\"wegas-icon wegas-icon-refresh\"></span>",
                visible: true
                    //}).render(this.get(CONTENTBOX));
            }).render(this.get(CONTENTBOX).one(".refresh"));

            this.get("contentBox").one(".header h2")
                .setContent(I18n.t("review.orchestrator.mainTitle", {variableName: I18n.t(prd.get("label"))}));

            this.request = "ReviewHelper.summarize('" + prd.get("name") + "');";
        },
        _getMonitoredData: function() {
            var ctx = this;
            //return new Y.Promise(function(resolve, reject) {
            Y.Wegas.Facade.Variable.sendRequest({
                request: "/Script/Run/" + Y.Wegas.Facade.Game.cache.getCurrentPlayer().get("id"),
                cfg: {
                    method: "POST",
                    headers: {"Managed-Mode": false},
                    data: {
                        "@class": "Script",
                        content: ctx.request
                    }
                },
                on: {
                    success: function(e) {
                        ctx._monitoredData = e.response.results;
                        ctx.syncTable();
                    },
                    failure: function(e) {
                        if (e && e.response && e.response.results && e.response.results.message && e.response.results.message.indexOf("undefined in ReviewHelper")) {
                            ctx.showMessage("error", "Please include server script : \"wegas-reviewing/scripts/server/\"");
                        }
                    }
                }
            });
            //});
        },
        /**
         * @function
         * @private
         * @description bind function to events.
         */
        bindUI: function() {

            // TODO use updatedInstance
            this.handlers.push(Wegas.Facade.Variable.after("update", this.syncUI, this));
            this.get(CONTENTBOX)
                .delegate("click", this.onDispatch, ".control-panel .transition.start-review span", this);
            this.get(CONTENTBOX)
                .delegate("click", this.onNotify, ".control-panel .transition.close-review span", this);
            this.get(CONTENTBOX)
                .delegate("click", this.onClose, ".control-panel .transition.close-comment span", this);

            this.handlers.push(Y.one("body").on("click", this.detailsOverlay.hide, this.detailsOverlay));
            this.get(CONTENTBOX).delegate("click", this.onTeamNameClick, ".yui3-datatable-col-team-name", this);

            this.get(CONTENTBOX)
                .delegate("click", this.onTextEvalClick, ".yui3-datatable-cell span.texteval-data", this);
            this.get(CONTENTBOX)
                .delegate("click", this.onGradeEvalClick, ".yui3-datatable-cell span.gradeeval-data", this);

            this.get(CONTENTBOX)
                .delegate("click", this.onIncludeEvictedClick, ".properties .include-evicted.enabled", this);

            /*this.handlers.push(Y.Wegas.Facade.Variable.after("updatedDescriptor", function(e) {
             var question = this.get("variable.evaluated");
             if (question && question.get("id") === e.entity.get("id")) {
             this.syncUI();
             }
             }, this));*/

            //this.refreshButton.on("click", this.syncUI, this);
            this.get(CONTENTBOX).delegate("click", this.syncUI, ".header .refresh", this);
            //this.datatable.after("synched", this.syncSummary, this);
        },
        onEvalClick: function(e, separator, sortFn) {
            var cell, teamId, data, fData, title, body, i, dt, evId, token, missing = 0;
            for (dt in this.datatables) {
                cell = this.datatables[dt].getRecord(e.currentTarget);
                if (cell) {
                    break;
                }
            }

            teamId = cell.get("team-id");
            evId = "ev-" + e.target.getAttribute("data-ref").match(/\d+/)[0];
            token = teamId + "-" + evId;
            if (this.currentTarget !== token || !this.detailsOverlay.get("visible")) {
                data = cell.get(e.target.getAttribute("data-ref"));
                title = this._monitoredData.structure[dt].find(function(item) {
                    return item.id === evId;
                }).title;

                if (data) {
                    fData = [];
                    for (i = 0; i < data.length; i += 1) {
                        if (data[i]) {
                            fData.push(data[i]);
                        } else {
                            missing++;
                        }
                    }

                    if (sortFn) {
                        fData.sort(sortFn);
                    }

                    body = "";
                    for (i = 0; i < fData.length; i += 1) {
                        body += fData[i];
                        if (i < fData.length - 1) {
                            body += separator;
                        }
                    }


                    body += this.generateMissingText(missing, data.length);
                } else {
                    body = "<i>" + I18n.t("review.orchestrator.notAvailableYet") + "</i>";
                }
                this.currentTarget = token;
                this.currentPos = [e.pageX + 10, e.pageY + 20];
                this.display(title, body);
            } else {
                this.detailsOverlay.hide();
                this.currentTarget = null;
            }
            e.halt(true);
        },
        generateMissingText: function(nbMissing, total) {
            var subject, text = "";
            if (nbMissing) {
                text = "<i>";
                if (nbMissing === total) {
                    text += I18n.t("review.editor.no" + (this._freeForAll ? "Player" : "Team") + "Provide");
                } else {
                    text = "<hr /><i>" + nbMissing + " ";
                    if (nbMissing > 1) {
                        text += (this._freeForAll ? I18n.t("wegas.players") : I18n.t("wegas.teams"))
                            + " " + I18n.t("review.editor.didNotProvidePluralized");
                    } else {
                        text += (this._freeForAll ? I18n.t("wegas.player") : I18n.t("wegas.team"))
                            + " " + I18n.t("review.editor.didNotProvide");
                    }
                }
                text += "</i>";
            }
            return text;
        },
        onGradeEvalClick: function(e) {
            this.onEvalClick(e, "<br />", Y.Array.numericSort);
        },
        onTextEvalClick: function(e) {
            this.onEvalClick(e, "<hr />");
        },
        onTeamNameClick: function(e) {
            var cell, teamId, dt, token;

            for (dt in this.datatables) {
                cell = this.datatables[dt].getRecord(e.currentTarget);
                if (cell) {
                    break;
                }
            }

            teamId = cell.get("team-id");
            token = dt + "-" + teamId;

            if (this.currentTarget !== token || !this.detailsOverlay.get("visible")) {
                this.currentTarget = token;
                this.currentPos = [e.pageX + 10, e.pageY + 20];
                // TODO Individual ?
                if (this._freeForAll) {
                    this.display(I18n.t("review.orchestrator.playerData", {playerName: cell.get("team-name")}), this._monitoredData.variable[teamId]);
                } else {
                    this.display(I18n.t("review.orchestrator.teamData", {teamName: cell.get("team-name")}), this._monitoredData.variable[teamId]);
                }
            } else {
                this.detailsOverlay.hide();
                this.currentTarget = null;
            }
            e.halt(true);
        },
        display: function(title, body) {
            this.detailsOverlay.set("headerContent", title);
            this.detailsOverlay.setStdModContent('body', body);
            this.detailsOverlay.move(this.currentPos[0], this.currentPos[1]);
            this.detailsOverlay.show();
        },
        /**
         * @function
         * @private
         */
        syncUI: function() {
            this._getMonitoredData();
            this.syncIncludeEvicted();
        },
        syncIncludeEvicted: function() {
            this.get(CONTENTBOX).one(".properties .include-evicted")
                .toggleClass("selected", this.get("variable.evaluated").get("includeEvicted"));
        },
        onIncludeEvictedClick: function() {
            var prd = this.get("variable.evaluated");
            prd.set("includeEvicted", !prd.get("includeEvicted"));
            Y.Wegas.Facade.Variable.cache.put(prd.toObject());
        },
        syncTable: function() {
            //this.dashboard && this.dashboard.syncUI();
            var ctx = this,
                columns = {}, data = {}, formatter, nodeFormatter,
                game, team, globalStatus, teamStatus, prd, childEntry,
                group, item, i, j, teamId, entry, key, section,
                states = [];

            this.refreshButton.get("contentBox").one("i").addClass("fa-spin");

            game = Y.Wegas.Facade.Game.cache.getCurrentGame();
            data = {
                overview: [],
                reviews: [],
                comments: []
            };

            for (section in this._monitoredData.structure) {
                if (!columns[section]) {
                    // TODO Individual ?
                    this;
                    columns[section] = [{key: "team-name", label: (this._freeForAll ? I18n.tCap("wegas.player") : I18n.tCap("wegas.team")), formatter: "{value} <i class=\"fa fa-info-circle\"></i>"}];
                }
                for (i = 0; i < this._monitoredData.structure[section].length; i++) {
                    group = this._monitoredData.structure[section][i];
                    entry = {label: group.title, children: []};

                    for (j = 0; j < group.items.length; j++) {
                        item = group.items[j];
                        if (item.formatter) {
                            formatter = item.formatter.indexOf("function") === 0 ? eval("(" + item.formatter + ")") : item.formatter;
                        }

                        if (item.nodeFormatter) {
                            nodeFormatter = item.nodeFormatter.indexOf("function") === 0 ? eval("(" + item.nodeFormatter + ")") : item.nodeFormatter;
                        } else {
                            nodeFormatter = null;
                        }
                        childEntry = {
                            key: item.id,
                            label: item.label,
                            formatter: (formatter === "null" ? "<span class=\"" + item.id.replace(/[0-9]+-/, "") + "\">{value}</span>" : formatter),
                            allowHTML: (item.allowHTML || false)
                        };
                        if (nodeFormatter) {
                            childEntry.nodeFormatter = nodeFormatter;
                        }

                        entry.children.push(childEntry);
                    }
                    columns[section].push(entry);
                }
            }

            for (teamId in this._monitoredData.data) {
                team = Y.Wegas.Facade.Game.cache.getTeamById(teamId);
                if ((game.get("@class") === "DebugGame" || team.get("@class") !== "DebugTeam") && team.get("players").length > 0) {
                    switch (this._monitoredData.data[teamId].overview.internal_status) {
                        case "editing":
                        case "ready":
                            teamStatus = "NOT_STARTED";
                            break;
                        case "reviewing":
                        case "done":
                            teamStatus = "REVIEWING";
                            break;
                        case "commenting":
                        case "completed":
                            teamStatus = "COMMENTING";
                            break;
                        case "closed":
                            teamStatus = "CLOSED";
                            break;
                        case "evicted":
                            teamStatus = "EVICTED";
                            break;
                        default:
                            teamStatus = "N/A";
                    }
                    if (teamStatus !== "EVICTED") {
                        if (!globalStatus) {
                            globalStatus = teamStatus;
                        } else if (globalStatus !== teamStatus) {
                            globalStatus = "N/A";
                        }
                    }

                    for (section in this._monitoredData.data[teamId]) {
                        entry = {
                            "team-name": (this._freeForAll ? team.get("players")[0].get("name") : team.get("name")),
                            "team-id": teamId
                        };
                        for (key in this._monitoredData.data[teamId][section]) {
                            entry[key] = this._monitoredData.data[teamId][section][key];
                        }
                        data[section].push(entry);
                    }
                }
            }

            states = [
                this.get(CONTENTBOX).one(".state.not-started"),
                this.get(CONTENTBOX).one(".state.reviewing"),
                this.get(CONTENTBOX).one(".state.commenting"),
                this.get(CONTENTBOX).one(".state.closed")
            ];
            for (i in states) {
                states[i].removeClass("past");
                states[i].removeClass("current");
                states[i].removeClass("future");
            }

            this.get(CONTENTBOX).one(".transition.start-review span").removeClass("active");
            this.get(CONTENTBOX).one(".transition.close-review span").removeClass("active");
            this.get(CONTENTBOX).one(".transition.close-comment span").removeClass("active");

            this.get(CONTENTBOX).one(".properties .include-evicted").removeClass("enabled");

            switch (globalStatus) {
                case "NOT_STARTED":
                    this.get(CONTENTBOX).one(".transition.start-review span").addClass("active");
                    this.get(CONTENTBOX).one(".properties .include-evicted").addClass("enabled");

                    states[0].addClass("current");
                    states[1].addClass("future");
                    states[2].addClass("future");
                    states[3].addClass("future");
                    break;
                case "REVIEWING":
                    this.get(CONTENTBOX).one(".transition.close-review span").addClass("active");

                    states[0].addClass("past");
                    states[1].addClass("current");
                    states[2].addClass("future");
                    states[3].addClass("future");
                    break;
                case "COMMENTING":
                    this.get(CONTENTBOX).one(".transition.close-comment span").addClass("active");
                    states[0].addClass("past");
                    states[1].addClass("past");
                    states[2].addClass("current");
                    states[3].addClass("future");
                    break;
                case "CLOSED":
                    states[0].addClass("past");
                    states[1].addClass("past");
                    states[2].addClass("past");
                    states[3].addClass("current");
                    break;
                case "N/A":
                    this.get(CONTENTBOX).one(".transition.start-review span").addClass("active");
                    this.get(CONTENTBOX).one(".transition.close-review span").addClass("active");
                    this.get(CONTENTBOX).one(".transition.close-comment span").addClass("active");
                    break;
            }

            for (section in ctx.datatables) {
                ctx.datatables[section].destroy();
            }

            for (section in this._monitoredData.structure) {
                ctx.datatables[section] = new Y.DataTable({columns: columns[section], data: data[section], sortable: true});
                ctx.datatables[section].render(this.get(CONTENTBOX).one(".summary ." + section));
            }
            ctx.syncSummary();

            Y.later(500, this, function() {
                this.refreshButton.get("contentBox").one("i").removeClass("fa-spin");
            });
        },
        addCell: function(table, content, td) {
            td = td || "td";
            table.push("<" + td + ">");
            table.push(content);
            table.push("</" + td + ">");
        },
        getInfoFromSummary: function(summary) {
            if (summary.type === "GradeSummary") {
                return  [summary.mean, summary.median, summary.sd];
            } else if (summary.type === "TextSummary") {
                return [summary.averageNumberOfWords, summary.averageNumberOfCharacters];
            } else {
                return ["n/a"];
            }
            return ["n/a"];
        },
        syncSummary: function() {
            var data = this._monitoredData,
                evalSummary, maxY,
                node, prd;

            prd = this.get("variable.evaluated");
            evalSummary = data.extra;

            node = this.get(CONTENTBOX).one(".charts");
            node.setContent("");
            //node.append("<h1>" + I18n.tCap("review.orchestrator.charts") + "</h1>");
            node.append("<div class=\"feedback\"><h2>" + I18n.tCap("review.orchestrator.charts") + " " + I18n.t("review.orchestrator.reviews") + "</h2></div>");
            node.append("<div class=\"comments\"><h2>" + I18n.tCap("review.orchestrator.charts") + " " + I18n.t("review.orchestrator.comments") + "</h2></div>");

            maxY = this.getMaxY([prd.get("feedback").get("evaluations"), prd.get("fbComments")
                    .get("evaluations")], evalSummary);
            this.buildCharts(prd.get("feedback").get("evaluations"), node.one(".feedback"), evalSummary, maxY);
            this.buildCharts(prd.get("fbComments").get("evaluations"), node.one(".comments"), evalSummary, maxY);
        },
        getMaxY: function(reviews, summary) {
            var i, j, k, evals, evD, data, maxY = 0;
            for (j in reviews) {
                evals = reviews[j];
                for (i in evals) {
                    evD = evals[i];
                    data = summary[evD.get("id")].get("val");
                    if (evD.get("@class") === "GradeDescriptor") {
                        for (k in data.histogram) {
                            maxY = Math.max(maxY, data.histogram[k].count);
                        }
                    } else if (evD.get("@class") === "CategorizedEvaluationDescriptor") {
                        for (k in data.histogram) {
                            maxY = Math.max(maxY, data.histogram[k]);
                        }
                    }
                }
            }
            return maxY;
        },
        createGradeChart: function(klass, summary, descriptor, maxY) {
            var min, max, data, options, i, bar,
                formatNumber = function(x) {
                    if (Number.isInteger(x)) {
                        return I18n.formatNumber(x);
                    } else {
                        return I18n.formatNumber(x, 'fixed2');
                    }
                };

            data = {
                labels: [],
                series: [{
                        "name": I18n.t(descriptor.get("label")),
                        data: []
                    }]
            };

            options = {
                width: 400,
                height: 250,
                axisY: {
                    onlyInteger: true,
                    high: maxY
                }
            };

            for (i in summary.histogram) {
                bar = summary.histogram[i];
                min = bar.min || Number.NaN;
                max = bar.max || Number.NaN;

                if (Math.abs(bar.max - bar.min) < 1.0) {
                    data.labels.push(formatNumber(Math.floor(bar.max)));
                } else {
                    data.labels.push("[" + formatNumber(bar.min) + ", " + formatNumber(bar.max) + (i < summary.histogram.length - 1 ? "[" : "]"));
                }
                data.series[0].data.push(bar.count);
            }
            this.chart = new Chartist.Bar(klass, data, options);


        },
        createCategoryChart: function(klass, summary, descriptor, maxY) {
            var min, max, data, options, key;
            min = summary.min;
            max = summary.max;

            data = {
                labels: [],
                series: [{
                        "name": I18n.t(descriptor.get("label")),
                        data: []
                    }]
            };

            options = {
                width: 400,
                height: 250,
                axisY: {
                    onlyInteger: true,
                    high: maxY
                }
            };

            for (key in summary.histogram) {
                data.labels.push(descriptor.getLabelForName(key));
                data.series[0].data.push(summary.histogram[key]);
            }
            this.chart = new Chartist.Bar(klass, data, options);
        },
        _formatNumber: function(value, nD) {
            nD = nD || 2;
            return Y.Lang.isNumber(value) ? I18n.formatNumber(value.toFixed(nD)) : "n/a";
        },
        buildCharts: function(evals, node, summary, maxY) {
            var i, evD, klass, data, k;

            for (i in evals) {
                evD = evals[i];
                klass = "eval-" + evD.get("id");
                node.append("<div class=\"evaluation " + klass + "\">" +
                    "<div class=\"title\"></div>" +
                    "<div class=\"ct-chart chart\"></div>" +
                    "<div class=\"legend\"></div>" +
                    "</div>");
                data = summary[evD.get("id")].get("val");
                if (evD.get("@class") === "GradeDescriptor") {
                    this.createGradeChart("." + klass + " .chart", data, evD, maxY);
                    node.one("." + klass + " .title").setContent("<h3>" + I18n.t(evD.get("label")) + "</h3>");
                    //node.one("." + klass + " .legend").append(math);
                    node.one("." + klass + " .legend").append("<p>" +
                        I18n.t("review.orchestrator.stats.mean") + ": " + this._formatNumber(data.mean) +
                        "; " + I18n.t("review.orchestrator.stats.median") + ": " + this._formatNumber(data.median) +
                        "; " + I18n.t("review.orchestrator.stats.sd") + ": " + this._formatNumber(data.sd) +
                        "; " + I18n.t("review.orchestrator.stats.bounds") + ": [" + this._formatNumber(data.min) + "," + this._formatNumber(data.min) + "]" +
                        " </p>");

                    node.one("." + klass + " .legend")
                        .append("<p>" + I18n.t("review.orchestrator.stats.basedOn", {available: data.numberOfValues || 0, expected: summary.maxNumberOfValue}) + "</p>");
                } else if (evD.get("@class") === "CategorizedEvaluationDescriptor") {
                    this.createCategoryChart("." + klass + " .chart", summary[evD.get("id")].get("val"), evD, maxY);
                    node.one("." + klass + " .title").setContent("<h3>" + I18n.t(evD.get("label")) + "</h3>");

                    node.one("." + klass + " .legend")
                        .append("<p>" + I18n.t("review.orchestrator.stats.basedOn", {available: data.numberOfValues || 0, expected: summary.maxNumberOfValue}) + "</p>");
                } else if (evD.get("@class") === "TextEvaluationDescriptor") {
                    node.one("." + klass + " .title").setContent("<h3>" + I18n.t(evD.get("label")) + "</h3>");
                    node.one("." + klass + " .chart")
                        .append("<p>" + I18n.t("review.orchestrator.stats.avgWc") + ": " + (data.averageNumberOfWords ? I18n.formatNumber(data.averageNumberOfWords, 'fixed') : "n/a") + "</p>");
                    node.one("." + klass + " .chart")
                        .append("<p>" + I18n.t("review.orchestrator.stats.avgCc") + ": " + (data.averageNumberOfCharacters ? I18n.formatNumber(data.averageNumberOfCharacters, 'fixed') : "n/a") + "</p>");
                    node.one("." + klass + " .legend")
                        .append("<p>" + I18n.t("review.orchestrator.stats.basedOn", {available: data.numberOfValues || 0, expected: summary.maxNumberOfValue}) + "</p>");
                }
            }
        },
        /**
         * @function
         * @private
         * @description Destroy widget and detach all functions created by this widget
         */
        destructor: function() {
            Y.Array.each(this.handlers, function(h) {
                h.detach();
            });
        },
        getEditorLabel: function() {
            return "Orchestrator";
        },
        onClose: function(e) {
            if (e.target.hasClass("active")) {
                this.onAction("Close");
            }
        },
        onNotify: function(e) {
            if (e.target.hasClass("active")) {
                this.onAction("Notify");
            }
        },
        onDispatch: function(e) {
            if (e.target.hasClass("active")) {
                this.onAction("Dispatch");
            }
        },
        onAction: function(action) {
            var prd = this.get("variable.evaluated");

            Wegas.Panel.confirm(I18n.t("review.orchestrator.goNextConfirmation"), Y.bind(function() {
                this.showOverlay();
                Y.Wegas.Facade.Variable.sendRequest({
                    request: "/PeerReviewController/" + prd.get("id") + "/" + action + "/" + Y.Wegas.Facade.Game.cache.getCurrentGame()
                        .get("id"),
                    cfg: {
                        updateCache: true,
                        method: "post"
                    },
                    on: {
                        success: Y.bind(function() {
                            this.hideOverlay();
                        }, this),
                        failure: Y.bind(function() {
                            this.hideOverlay();
                            this.showMessage("error", "Something went wrong");
                        }, this)
                    }
                });
            }, this));
        }
    }, {
        /** @lends Y.Wegas.ReviewOrchestrator */
        EDITORNAME: "Review Orchestrator",
        ATTRS: {
            /**
             * The PeerReviewDescriptor
             *
             */
            variable: {
                getter: Wegas.Widget.VARIABLEDESCRIPTORGETTER,
                type: "object",
                view: {
                    type: "variableselect",
                    label: "Peer Review Descriptor",
                    classFilter: ["PeerReviewDescriptor"],
                }
            }
        }
    });
    Wegas.ReviewOrchestrator = ReviewOrchestrator;


    /**
     * @name Y.Wegas.ReviewVariableEditor
     * @extends Y.Widget
     * @borrows Y.WidgetChild, Y.WidgetParent, Y.Wegas.Widget, Y.Wegas.Editable
     */
    ReviewVariableEditor = Y.Base.create("wegas-review-variableeditor", Y.Widget,
        [Y.WidgetParent, Y.WidgetChild, Y.Wegas.Widget, Y.Wegas.Editable], {
        /** @lends Y.Wegas.ReviewVariableEditor# */
        initializer: function() {
            this.handlers = [];
        },
        renderUI: function() {
            var prd = this.get("variable.evaluated");

            this._mainList = new Y.Wegas.List({
                cssClass: "wegas-review-variable-editor--list",
                editable: false
            });


            //this._mainList.add(this._input);

            this._submitButton = new Y.Wegas.Button({
                cssClass: BUTTON,
                label: I18n.tCap("review.global.submit"),
                visible: true
            });
            this._mainList.add(this._submitButton);

            this.add(this._mainList);
        },
        /**
         * @function
         * @private
         * @description bind function to events.
         */
        bindUI: function() {
            this.handlers.push(Wegas.Facade.Variable.after("update", function() {// When the variable cache is updated,
                //TODO clever sync, please...
                this.syncUI(); // sync the view
            }, this));
            this._submitButton.on("click", this.onSubmit, this);
        },
        /**
         * @function
         * @private
         */
        syncUI: function() {
            var prd = this.get("variable.evaluated"),
                variableName;

            variableName = prd.get("toReviewName");

            if (prd.getInstance().get("reviewState") === "NOT_STARTED") {
                // Time to edit the variable
                this._submitButton.set("visible", true && this.get("showSubmitButton"));
                if (!this._input || this._input.get("readonly.evaluated")) {
                    this._input && this._input.destroy();
                    this._input = new Y.Wegas.TextInput({
                        variable: {name: variableName},
                        showSaveButton: false,
                        showStatus: true,
                        toolbar1: "bold italic underline bullist",
                        toolbar2: "",
                        toolbar3: "",
                        contextmenu: "bold italic underline bullist",
                        disablePaste: false,
                        readonly: {
                            "content": "return false;"
                        }
                    });
                    this._mainList.add(this._input, 0);
                }
            } else {
                // No longer editable
                this._submitButton.set("visible", false);
                // No input or editable one
                if (!this._input || !this._input.get("readonly.evaluated")) {
                    this._input && this._input.destroy();
                    this._input = new Y.Wegas.TextInput({
                        variable: {name: variableName},
                        showSaveButton: false,
                        showStatus: true,
                        toolbar1: "bold italic underline bullist",
                        toolbar2: "",
                        toolbar3: "",
                        contextmenu: "bold italic underline bullist",
                        disablePaste: false,
                        readonly: {
                            "content": "return true;"
                        }
                    });
                    this._mainList.add(this._input, 0);
                }
            }
        },
        /**
         * @function
         * @private
         */
        destructor: function() {
            Y.Array.each(this.handlers, function(h) {
                h.detach();
            });
        },
        getEditorLabel: function() {
            return this.get("pageLoaderId");
        },
        // *** Private Methods ***/
        /**
         * @function
         * @private
         * @param {String} pageId check for this page's ID.
         * @return boolean
         * @description Return true if an ancestor already loads pageId
         */
        onSubmit: function() {

            var prd = this.get("variable.evaluated");

            Wegas.Panel.confirm(I18n.t("review.global.confirmation"), Y.bind(function() {
                Wegas.Panel.confirmPlayerAction(Y.bind(function() {
                    this.showOverlay();
                    Y.Wegas.Facade.Variable.sendRequest({
                        request: "/PeerReviewController/" + prd.get("id") + "/Submit/" + Y.Wegas.Facade.Game.get('currentPlayerId'),
                        cfg: {
                            updateCache: true,
                            method: "post"
                        },
                        on: {
                            success: Y.bind(function() {
                                this.hideOverlay();
                            }, this),
                            failure: Y.bind(function() {
                                this.hideOverlay();
                                this.showMessage("error", "Error while submiting");
                            }, this)
                        }
                    });
                }, this));
            }, this));
        }
    }, {
        /** @lends Y.Wegas.PageLoader */
        EDITORNAME: "Review Variable Editor",
        ATTRS: {
            variable: {
                getter: Wegas.Widget.VARIABLEDESCRIPTORGETTER,
                type: "object",
                view: {
                    type: "variableselect",
                    label: "Peer Review Descriptor",
                    classFilter: ["PeerReviewDescriptor"]
                }
            },
            showSubmitButton: {
                type: "boolean",
                value: true,
                view: {
                    label: "Display submit button"
                }
            }
        }
    });
    Wegas.ReviewVariableEditor = ReviewVariableEditor;

    ReviewTV = Y.Base.create("wegas-review-tv", Y.TreeView, [Y.WidgetChild, Y.Wegas.Widget, Y.Wegas.Editable], {
    });
    Y.Wegas.ReviewTV = ReviewTV;

    /**
     * @name Y.Wegas.ReviewTreeView
     * @extends Y.Widget
     * @borrows Y.WidgetChild, Y.Wegas.Widget, Y.Wegas.Editable
     * @class
     * @constructor
     * @description Show available review to the player. There is two review categories:
     * the first one contains reviews the player (self) has to write to reflect
     * his thoughts about work done by others players. The second contains the reviews
     * written by others about the work of the current player.
     */
    ReviewTreeView = Y.Base.create("wegas-review-treeview", Y.Widget,
        [Y.WidgetParent, Y.WidgetChild, Y.Wegas.Widget, Y.Wegas.Editable], {
        initializer: function() {
            this.handlers = {};
        },
        renderUI: function() {
            this.destroyAll();

            this._treeview = new Y.Wegas.ReviewTV({
                editable: false
            });
            this._treeview.addTarget(this);

            //this.plug(Y.Plugin.RememberExpandedTreeView);

            this._panel = new Y.Wegas.FlexList({
                cssClass: "wegas-review-treeview__panel",
                editable: false
            });

            this.add(this._treeview);
            this.add(this._panel);

            //this.syncTree();
        },
        bindUI: function() {
            this.handlers.update = Y.Wegas.Facade.Variable.after("update", this.syncUI, this);
            this.handlers.tvClick = this._treeview.after("*:click", this.onTvClick, this);

        },
        syncTree: function() {
            var nodes = this._genTreeView();
            if (nodes[1] && nodes[1].children.length === 0) {
                nodes.pop();
            }
            if (nodes[0] && nodes[0].children.length === 0) {
                nodes.shift();
                this._panel.destroyAll();
            }
            this._treeview.destroyAll();
            this._treeview.add(nodes);
            this._treeview.syncUI();
            this.updateTreeSelection();
        },
        updateTreeSelection: function() {
            var currentReviewId, isReviewer, nodeToSelect;

            if (this._currentPanel && this._currentPanel.get("review")) {
                currentReviewId = this._currentPanel.get("review").get("id");
                isReviewer = this._currentPanel.get("reviewer");
                nodeToSelect = this._treeview.find(function(item) {
                    // is current item refers to current edited review ?
                    return item.get("data.review") && item.get("data.review").get("id") === currentReviewId &&
                        // is mode the same (aka prevent selected review rather than comment when debugging)
                        isReviewer === item.get("data.reviewer");
                });
                if (nodeToSelect) {
                    nodeToSelect.set("selected", 2);
                }
            }
        },
        syncUI: function() {
            this.syncTree();
            this.refreshPanel();
        },
        refreshPanel: function() {
            if (this._currentPanel instanceof Y.Wegas.ReviewWidget) {
                var i, j, reviews, review,
                    prd = this.get("variable.evaluated"),
                    pri = prd.getInstance();

                // Find the correct review
                reviews = pri.get(this._currentPanel.get("reviewer") ? "toReview" : "reviewed");

                for (j = 0; j < reviews.length; j++) {
                    review = reviews[j];

                    if (this._currentPanel.get("review") && this._currentPanel.get("review")
                        .get("id") === review.get("id")) {
                        if (review.get("reviewState") !== this._currentPanel._status) {
                            // Build new
                            this.renderReviewWidget(review, this._currentPanel.get("title"), this._currentPanel.get("reviewer"));
                        } else {
                            this._currentPanel.set("review", review);
                            this._currentPanel.syncUI();
                        }
                    }
                }
                //}
            }
        },
        destructor: function() {
            for (var k in this.handlers) {
                this.handlers[k].detach();
            }
        },
        _genTreeView: function() {

            var prd = this.get("variable.evaluated"),
                pri = prd.getInstance(), i, j,
                types = ["toReview", "reviewed"],
                reviews, root, nodes = [], i, review, node;

            nodes.push({
                label: I18n.t("review.tabview.toReviewTitle"),
                type: "TreeNode",
                collapsed: false,
                selected: 0,
                data: {
                    type: "REVIEW_TITLE"
                },
                children: [],
                iconCSS: "fa fa-users",
                cssClass: "title"
            });

            nodes.push({
                label: I18n.t("review.tabview.toCommentTitle"),
                selected: 0,
                collapsed: false,
                type: "TreeNode",
                iconCSS: "fa fa-users",
                data: {
                    type: "FB_TITLE"
                },
                children: [],
                cssClass: "title"
            });

            for (i = 0; i < 2; i++) {
                reviews = pri.get(types[i]);
                for (j = 0; j < reviews.length; j++) {
                    review = reviews[j];
                    node = null;


                    if (i === 0 || review.get("reviewState") === "NOTIFIED" ||
                        review.get("reviewState") === "COMPLETED" ||
                        review.get("reviewState") === "CLOSED") {

                        node = {
                            label: (i === 0 ? I18n.t("review.tabview.toReview") : I18n.t("review.tabview.toComment")) + " " + I18n.t("review.editor.number") + (j + 1),
                            type: "TreeLeaf",
                            iconCSS: "fa fa-user-circle-o",
                            data: {
                                type: "REVIEW",
                                review: review,
                                reviewer: (i === 0)
                            }
                        };

                        if (
                            (node.data.reviewer
                                && (
                                    node.data.review.get("reviewState") === "DISPATCHED"  // Review is reviewing
                                    || node.data.review.get("reviewState") === "CLOSED") // Reviewe can read review comment
                                )
                            || (!node.data.reviewer
                                && (
                                    node.data.review.get("reviewState") === "NOTIFIED")  // Author comments review
                                )) {
                            node.cssClass = "unread";
                        }

                        nodes[i].children.push(node);
                    }

                    //this.addReview(reviews[j], i, j);
                }
            }
            return nodes;
        },
        //isNodeExpanded: function(entity) {
        //return this.RememberExpandedTreeView.expandedIds[entity.get("id")] || false;
        //},
        renderReviewWidget: function(review, label, reviewer) {
            if (this._currentPanel) {
                this._panel.destroyAll();
            }

            this._currentPanel = new Wegas.ReviewWidget({
                title: label,
                review: review,
                descriptor: this.get("variable.evaluated"),
                reviewer: reviewer,
                showSubmitButton: this.get("showSubmitButton")
            });
            this._currentPanel.plug(Y.Plugin.CSSPosition, {
                styles: {
                    position: "relative"
                }});

            this._panel.add(this._currentPanel);
        },
        onTvClick: function(e) {
            var data;
            data = e.target.get("data");
            if (data) {
                switch (data.type) {
                    case "REVIEW":
                        this.renderReviewWidget(data.review, e.target.get("label"), data.reviewer);
                        break;
                    default:
                        Y.later(0, this, function() {
                            this._treeview.deselectAll();
                            this.updateTreeSelection();
                        });
                        // Title
                        /*this._panel.destroyAll();
                         
                         this._currentPanel = new Y.Wegas.Text({
                         editable: false,
                         cssClass: "wegas-review-treeview__title__panel",
                         content: "<h2>RTFM</h2>"
                         });
                         
                         this._panel.add(this._currentPanel);
                         */
                        break;
                }
            }
        }
    }, {
        EDITORNAME: "Review TreeView display",
        ATTRS: {
            variable: {
                getter: Wegas.Widget.VARIABLEDESCRIPTORGETTER,
                type: "object",
                view: {
                    type: "variableselect",
                    label: "Peer Review Descriptor",
                    classFilter: ["PeerReviewDescriptor"]
                }
            },
            showSubmitButton: {
                type: "boolean",
                value: true,
                view: {
                    label: "Display submit button"
                }
            }
        }
    });
    Y.Wegas.ReviewTreeView = ReviewTreeView;
    Y.Wegas.ReviewTabView = ReviewTreeView;


    /**
     * @name Y.Wegas.ReviewWidget
     * @extends Y.Widget
     * @borrows Y.WidgetChild, Y.Wegas.Widget, Y.Wegas.Editable
     * @class
     * @constructor
     * @description Is used to display a specific review.
     */
    ReviewWidget = Y.Base.create("wegas-review-widget", Y.Widget, [Y.WidgetParent, Y.WidgetChild, Wegas.Widget, Wegas.Editable], {
        CONTENT_TEMPLATE: "<div>"
            + "  <div class=\"title\"></div>"
            + "  <div class=\"container\">"
            + "    <div class=\"toReview\">"
            + "      <div class=\"subtitle\"></div>"
            + "      <div class=\"description\"></div>"
            + "      <div class=\"content wegas-template-content\"></div>"
            + "    </div>"
            + "  </div>"
            + "  <div class=\"container\">"
            + "    <div class=\"feedback\">"
            + "      <div class=\"subtitle\"></div>"
            + "      <div class=\"content\"></div>"
            + "    </div>"
            + "  </div>"
            + "  <div class=\"container\">"
            + "    <div class=\"feedbackEv\">"
            + "      <div class=\"subtitle\"></div>"
            + "      <div class=\"content\"></div>"
            + "    </div>"
            + "  </div>"
            + "  <div>"
            + "    <div class=\"submit\"></div>"
            + "  </div>"
            + "</div>",
        initializer: function() {
            this._status = this.get("review").get("reviewState");
            this.widgets = {};
            this.handlers = {};
            this.locks = {};
            this.values = {}; // to store last saved values
        },
        /**
         *
         * @param {type} ev
         * @param {type} container
         * @param {type} mode hidden, read or write, others means hidden
         * @returns {undefined}
         */
        addEvaluation: function(ev, container, mode) {
            var klass = ev.get("@class"),
                widget, readonly = mode === "read", cfg = {
                    evaluation: ev,
                    readonly: readonly,
                    showStatus: false
                };

            if (mode === "write" || mode === "read") {
                switch (klass) {
                    case "GradeInstance":
                        widget = new Wegas.GradeInput(cfg).render(container);
                        break;
                    case "TextEvaluationInstance":
                        cfg.readonly = {
                            "content": "return " + readonly + ";"
                        };
                        widget = new Wegas.TextEvalInput(cfg).render(container);
                        break;
                    case "CategorizedEvaluationInstance":
                        widget = new Wegas.CategorizationInput(cfg).render(container);
                        break;
                }
                this.add(widget);
                //widget.before("*:save", this.fire, this);
                //widget.on(["*:message", "*:saved", "*:revert", "*:editing", "*:showOverlay", "*:hideOverlay"], this.fire, this); // Event on the loaded
            }
            return widget;
        },
        renderUI: function() {
            var review = this.get("review"),
                i, evls,
                reviewer = this.get("reviewer"),
                desc = this.get("descriptor"),
                fbContainer = this.get("contentBox").one(".feedback").one(".content"),
                fbEContainer = this.get("contentBox").one(".feedbackEv").one(".content"),
                modeFb = "hidden",
                modeFbEval = "hidden";

            this.get("contentBox").one(".title").setContent(this.get("title"));
            this.get("contentBox").one(".description").setContent(desc.get("description"));

            var content = this.get(CONTENTBOX).one(".toReview").one(".content");
            this.showOverlay();
            Y.Wegas.Facade.Variable.sendRequest({
                request: "/PeerReviewController/" + desc.get("id") + "/ToReview/" + review.get("id")
                    + "/" + Y.Wegas.Facade.Game.cache.get("currentPlayerId"),
                cfg: {
                    updateCache: false,
                    method: "get"
                },
                on: {
                    success: Y.bind(function(e) {
                        content.setContent(e.response.entity.get("value"));
                        this.hideOverlay();
                        this.fire("contentUpdated");
                    }, this),
                    failure: Y.bind(function() {
                    }, this)
                }
            });


            this.get("contentBox").one(".toReview").toggleClass("me", !reviewer);
            this.get("contentBox").one(".feedback").toggleClass("me", reviewer);
            this.get("contentBox").one(".feedbackEv").toggleClass("me", !reviewer);

            this.get("contentBox").one(".toReview").one(".subtitle").setContent(I18n.t("review.editor.given"));

            if (reviewer) {
                if (review.get("reviewState") === "DISPATCHED") {
                    modeFb = "write";
                    this.get("contentBox").one(".feedback").one(".subtitle")
                        .setContent(I18n.t("review.editor.ask_your_feedback"));

                } else {
                    modeFb = "read";
                    this.get("contentBox").one(".feedback").one(".subtitle")
                        .setContent(I18n.t("review.editor.your_feedback"));
                }
                if (review.get("reviewState") === "CLOSED") {
                    modeFbEval = "read";
                    this.get("contentBox").one(".feedbackEv").one(".subtitle")
                        .setContent(I18n.t("review.editor.author_comment"));
                }
            } else { // Author
                if (review.get("reviewState") === "NOTIFIED") {
                    modeFb = "read";
                    modeFbEval = "write";
                    this.get("contentBox").one(".feedback").one(".subtitle")
                        .setContent(I18n.t("review.editor.reviewer_feedback"));
                    this.get("contentBox").one(".feedbackEv").one(".subtitle")
                        .setContent(I18n.t("review.editor.ask_comment"));
                } else if (review.get("reviewState") === "COMPLETED" || review.get("reviewState") === "CLOSED") {
                    modeFb = "read";
                    modeFbEval = "read";
                    this.get("contentBox").one(".feedback").one(".subtitle")
                        .setContent(I18n.t("review.editor.reviewer_feedback"));
                    this.get("contentBox").one(".feedbackEv").one(".subtitle")
                        .setContent(I18n.t("review.editor.comment"));
                }
            }

            if (modeFb === "write" || modeFbEval === "write") {
                if (modeFb === "write") {
                    this.get("contentBox").one(".container .feedback .subtitle")
                        .append("<span class=\"save-status\"></span>");
                } else {
                    this.get("contentBox").one(".container .feedbackEv .subtitle")
                        .append("<span class=\"save-status\"></span>");
                }

                if (this.get("showSubmitButton")) {
                    this.submitButton = new Y.Button({
                        label: I18n.t("review.global.submit"),
                        visible: true
                    }).render(this.get(CONTENTBOX).one('.submit'));
                }
            }

            evls = review.get("feedback");
            for (i in evls) {
                this.widgets[evls[i].get("id")] = this.addEvaluation(evls[i], fbContainer, modeFb);
                this.values[evls[i].get("id")] = evls[i].get("value");
            }

            evls = review.get("comments");
            for (i in evls) {
                this.widgets[evls[i].get("id")] = this.addEvaluation(evls[i], fbEContainer, modeFbEval);
                this.values[evls[i].get("id")] = evls[i].get("value");
            }
        },
        syncUI: function() {
            var i, evl, evls, review = this.get("review"), w;

            evls = review.get("feedback").concat(review.get("comments"));
            for (i in evls) {
                evl = evls[i];
                w = this.widgets[evl.get("id")];
                if (w) {
                    w.set("evaluation", evl);
                    if (this.values[evl.get("id")] !== evl.get("value")) {
                        this.values[evl.get("id")] = evl.get("value");
                        w.syncUI(true);
                    }
                }
            }
        },
        outdate: function() {
            this._status = "OUTDATED";
            this.get("contentBox").one(".title").append("<p style='warn'>Outdated</p>");
        },
        bindUI: function() {
            if (this.submitButton) {
                this.submitButton.on("click", this.submit, this);
            }
            /*if (this.saveButton) {
             this.saveButton.on("click", this.save, this);
             }*/

            //this.handlers.beforeAnswerSave = this.before("*:save", this.onSave, this);
            this.handlers.afterAnswerSave = this.after("*:saved", this.onSaved, this);
            this.handlers.editing = this.on("*:editing", this.onEdit, this);
            this.handlers.revert = this.on("*:revert", this.onRevert, this);

        },
        /*onSave: function(e) {
         Y.log("SAVE " + e.id + " := " + e.value);
         },*/
        setStatus: function(status) {
            this.get("contentBox").one(".save-status").setContent(status);

            if (this.statusTimer) {
                this.statusTimer.cancel();
            }
            this.statusTimer = Y.later(3000, this, function() {
                this.get("contentBox").one(".save-status").setContent("");
            });
        },
        onSaved: function(e) {
            this.submitButton.set("disabled", true);
            delete this.locks[e.id];
            if (this.timer) {
                this.timer.cancel();
            }
            this.timer = Y.later(500, this, function() {
                var id;
                for (id in this.locks) {
                    if (this.locks.hasOwnProperty(id) && this.locks[id]) {
                        // at least one evaluation is being edited -> do not save yet 
                        // but wait for edition end
                        return;
                    }
                }
                this.save();
            });
        },
        onEdit: function(e) {
            this.locks[e.id] = true;
            this.setStatus("saving <i class=\"fa fa-1x fa-spinner fa-spin\"></i>");
            this.submitButton.set("disabled", true);
        },
        onRevert: function(e) {
            delete this.locks[e.id];
        },
        destructor: function() {
            this.set("predestroyed", true);
            if (this.timer) {
                this.timer.cancel();
                this.save();
            }

            this.statusTimer && this.statusTimer.cancel();

            var id;
            for (id in this.handlers) {
                if (this.handlers.hasOwnProperty(id)) {
                    this.handlers[id].detach();
                }
            }

            /*for (id in this.widgets) {
             this.widgets[id] && this.widgets[id].destroy();
             }*/

            if (this.submitButton) {
                this.submitButton.destroy();
            }
            /*if (this.saveButton) {
             this.saveButton.destroy();
             }*/
        },
        _sendRequest: function(action, updateCache, cb) {
            if (!this.get("destroyed") && !this.get("predestroyed")) {
                //this.showOverlay();
            }
            Y.Wegas.Facade.Variable.sendQueuedRequest({
                request: "/PeerReviewController/" + action
                    + "/" + Y.Wegas.Facade.Game.cache.get("currentPlayerId"),
                cfg: {
                    updateCache: updateCache,
                    method: "post",
                    data: this.get("review")
                },
                on: {
                    success: Y.bind(function(e) {
                        //this.hideOverlay();
                        cb && cb.call(this, e);
                    }, this),
                    failure: Y.bind(function(e) {
                        //this.hideOverlay();
                        cb && cb.call(this, e);
                        this.showMessage("error", "Something went wrong: " + action + " review");
                    }, this)
                }
            });
        },
        syncSavedValues: function() {
            var review, evls, i;
            review = this.get("review");

            evls = review.get("feedback");
            for (i in evls) {
                this.values[evls[i].get("id")] = evls[i].get("value");
            }

            evls = review.get("comments");
            for (i in evls) {
                this.values[evls[i].get("id")] = evls[i].get("value");
            }
        },
        save: function() {
            if (!this._submitted) {
                this._sendRequest("SaveReview", false, function(e) {
                    if (!this.get("destroyed")) {
                        this.submitButton.set("disabled", false);
                        this.setStatus("saved");
                        this.syncSavedValues();
                    }
                });
            }
        },
        submit: function() {
            Wegas.Panel.confirm(I18n.tCap("review.global.confirmation"), Y.bind(function() {
                Wegas.Panel.confirmPlayerAction(Y.bind(function(e) {
                    this._submitted = true;
                    this._sendRequest("SubmitReview", true, function(e) {
                    });
                    this.syncSavedValues();
                }, this));
            }, this));
        }
    }, {
        ATTRS: {
            title: {
                type: "string",
                value: "Review"
            },
            descriptor: {
                type: "PeerReviewDescriptor"
            },
            review: {
                type: "Review"
            },
            reviewer: {
                type: "boolean",
                value: false
            },
            showPage: {
                type: "string",
                view: {
                    label: "Show page",
                    type: "pageselect"
                },
                required: true
            },
            showSubmitButton: {
                type: "boolean",
                value: true,
                view: {
                    label: "Display submit button"
                }
            }

        }
    });
    Wegas.ReviewWidget = ReviewWidget;

    GradeInput = Y.Base.create("wegas-review-gradeinput", Y.Widget, [Y.WidgetChild, Wegas.Widget, Wegas.Editable], {
        CONTENT_TEMPLATE: "<div class=\"wegas-review-evaluation\">" +
            "  <div class=\"wegas-review-evaluation-label\"></div>" +
            "  <div class=\"wegas-review-evaluation-desc\"></div>" +
            "  <div class=\"wegas-review-evaluation-content\">" +
            "    <div class=\"wegas-review-grade-instance-slider\"></div>" +
            "    <div class=\"wegas-review-grade-instance-input-container\">" +
            "      <input class=\"wegas-review-grade-instance-input\" />" +
            "    </div>" +
            "  </div>" +
            "</div>",
        initializer: function() {
            this.handlers = [];
            this.xSlider = null;
            //this.get("evaluation").get("value");
            this.publish("save", {
                emitFacade: true
            });
            this.publish("saved", {
                emitFacade: true
            });
            this.publish("editing", {
                emitFacade: true
            });
            /* to be fired if content is edited and canceled in a shot */
            this.publish("revert", {
                emitFacade: true
            });
        },
        renderUI: function() {
            var ev = this.get("evaluation"), desc = ev.get("descriptor"),
                CB = this.get("contentBox"), min, max;
            this.evId = ev.get("id");
            CB.one(".wegas-review-evaluation-label").setContent(I18n.t(desc.get("label")));
            CB.one(".wegas-review-evaluation-desc").setContent(I18n.t(desc.get("description")));

            if (!this.get("readonly")) {
                //this.get(CONTENTBOX).one(".wegas-review-grade-instance-input").set("value", ev.get("value"));
                min = desc.get("minValue");
                max = desc.get("maxValue");
                if (Y.Lang.isNumber(min) && Y.Lang.isNumber(max)) {
                    if (max - min < 10) {
                        this.get(CONTENTBOX).addClass("small-range-grade");
                    }

                    this.xSlider = new Y.Slider({
                        min: min,
                        max: max,
                        value: +ev.get("value")
                    }).render(this.get(CONTENTBOX).one(".wegas-review-grade-instance-slider"));
                    this.get(CONTENTBOX).one(".wegas-review-grade-instance-slider .yui3-slider-rail-cap-left")
                        .setAttribute("data-value", min);
                    this.get(CONTENTBOX).one(".wegas-review-grade-instance-slider .yui3-slider-rail-cap-right")
                        .setAttribute("data-value", max);
                }
                //} else {
                //    this.get(CONTENTBOX).one(".wegas-review-grade-instance-input-container").setContent('<p>' +
                //        ev.get("value") + '</p>');
            }

        },
        syncUI: function(quiet) {
            var evl, value;
            evl = this.get("evaluation");
            value = evl.get("value");
            this.evId = evl.get("id");
            this._quiet = quiet;

            //if (value !== this._initialValue) {
            //    this._initialValue = value;

            if (!this.get("readonly")) {
                this.get(CONTENTBOX).one(".wegas-review-grade-instance-input").set("value", value);
                if (this.xSlider) {
                    this.xSlider.get("contentBox").one(".yui3-slider-rail")
                        .setAttribute("data-value", Y.Lang.isNumber(value) ? value : "");
                    this.xSlider.set("value", value);
                }
            } else {
                this.get(CONTENTBOX).one(".wegas-review-grade-instance-input-container").setContent('<p>' +
                    (value ? value : "<i>" + I18n.t("review.editor.noValueProvided")) + '</i></p>');
            }
            this._quiet = false;
            //} else {
            //if (!this.get("readonly")) {
            //evl.set("value", this.getCurrentValue());
            //}
            //}
        },
        getCurrentValue: function() {
            if (this.get("readonly")) {
                return this.get(CONTENTBOX).one(".wegas-review-grade-instance-input-container p").getContent();
            } else {
                return parseInt(this.get(CONTENTBOX).one(".wegas-review-grade-instance-input").get("value"), 10);
            }
        },
        bindUI: function() {
            var input = this.get(CONTENTBOX).one(".wegas-review-grade-instance-input");
            if (this.xSlider) {
                this.handlers.push(this.xSlider.after("valueChange", this.updateInput, this));
            }
            if (input) {
                this.handlers.push(input.on("keyup", this.updateSlider, this));
            }
            this.on("save", this._save);
        },
        _save: function(e) {
            var ev = this.get("evaluation");
            ev.set("value", e.value);
            this.fire("saved", {id: e.id, value: e.value});
        },
        destructor: function() {
            this.timer && this.timer.cancel();
            Y.Array.each(this.handlers, function(h) {
                h.detach();
            });
        },
        updateValue: function(rawValue) {
            var ev = this.get("evaluation"),
                desc = ev.get("descriptor"),
                value = +rawValue;

            if (isNaN(value)) {
                this.showMessage("error", I18n.t("errors.nan", {value: rawValue}));
                return false;
            } else if ((desc.get("minValue") && value < desc.get("minValue")) ||
                (desc.get("maxValue") && value > desc.get("maxValue"))
                ) {
                this.showMessage("error", I18n.t("errors.outOfBounds", {value: value, min: desc.get("minValue"), max: desc.get("maxValue")}));
                return false;
            }

            if (value === this._initialValue) {
                !this._quiet && this.fire("revert", {"id": this.evId, "value": value});
            } else {
                !this._quiet && this.fire("save", {"id": this.evId, "value": value});
            }
            this._quiet = false;

            return true;
        },
        updateInput: function(e) {
            var input = this.get(CONTENTBOX).one(".wegas-review-grade-instance-input"),
                value = this.xSlider.get("value");

            if (this.updateValue(value)) {
                this.xSlider.get("contentBox").one(".yui3-slider-rail")
                    .setAttribute("data-value", Y.Lang.isNumber(value) ? value : "");
                input.set("value", value);
            }
        },
        updateSlider: function(e) {
            var input = this.get(CONTENTBOX).one(".wegas-review-grade-instance-input"),
                value = input.get("value");

            this.fire("editing", {"id": this.evId, "value": value});

            if (this.timer) {
                this.timer.cancel();
            }
            this.timer = Y.later(200, this, function() {
                this.timer = null;
                if (this.updateValue(value)) {
                    if (this.xSlider) {
                        this.xSlider.get("contentBox").one(".yui3-slider-rail")
                            .setAttribute("data-value", Y.Lang.isNumber(value) ? value : "");
                        this.xSlider.set("value", +value);
                    }
                }
            });
        }
    }, {
        ATTRS: {
            evaluation: {
                type: "GradeInstance"
            },
            readonly: {
                type: "boolean",
                value: false
            }
        }
    });
    Wegas.GradeInput = GradeInput;




    TextEvalInput = Y.Base.create("wegas-review-textevalinput", Y.Wegas.TextInput, [], {
        CONTENT_TEMPLATE: "<div class=\"wegas-review-evaluation\">" +
            "<div class=\"wegas-review-evaluation-label\"></div>" +
            "<div class=\"wegas-review-evaluation-desc\"></div>" +
            "<div class=\"wegas-review-evaluation-content\">" +
            "<div class=\"wegas-text-input-editor\"></div>" +
            "<div class=\"wegas-text-input-toolbar\"><div class=\"status\"></div></div>" +
            "</div>" +
            "</div>",
        getInitialContent: function() {
            var ev = this.get("evaluation"), desc = ev.get("descriptor"),
                CB = this.get("contentBox");

            CB.one(".wegas-review-evaluation-label").setContent(I18n.t(desc.get("label")));
            CB.one(".wegas-review-evaluation-desc").setContent(I18n.t(desc.get("description")));
            this._initialContent = ev.get("value");

            if (this.get("readonly.evaluated") && !this._initialContent) {
                return "<i>" + I18n.t("review.editor.noValueProvided") + '</i>';
            }

            return this._initialContent;
        },
        valueChanged: function(newValue) {
            this.currentValue = newValue;
        },
        getCurrentValue: function() {
            return this.currentValue;
        },
        getPayload: function(value) {
            return {
                id: this.get("evaluation").get("id"),
                value: value
            };
        },
        /*save: function(value) {
         this.get("evaluation").set("value", value);
         return true;
         },*/
        _save: function(e) {
            var cb = this.get("contentBox"),
                value = e.value,
                ev = this.get("evaluation");
            if (!this._quiet) {
                this._initialContent = value;
                ev.set("value", value);
                cb.removeClass("loading");
                this.fire("saved", this.getPayload(e.value));
            }
        },
        syncUI: function(quiet) {
            var evl, value;
            evl = this.get("evaluation");
            value = evl.get("value");
            this._quiet = quiet;

            if (value !== this._initialContent && this.getCurrentValue() === this._initialContent) {
                Y.later(100, this, function() {
                    if (this.editor) {
                        var content = this.getInitialContent();
                        this.currentValue = content;
                        this.editor.setContent(content);
                    } else {
                        Y.later(100, this, this.syncUI);
                    }
                    /*var tmceI = tinyMCE.get(this.get("contentBox").one(".wegas-text-input-editor"));
                     if (tmceI) {
                     tmceI.setContent(this.getInitialContent());
                     }*/
                    this._quiet = false;
                });
            } else {
                this._quiet = quiet;
                if (!this.get("readonly.evaluated")) {
                    evl.set("value", this.editor.getContent());
                }
            }
        }
    }, {
        EDITORNAME: "TextEvalInput",
        ATTRS: {
            evaluation: {
                type: "TextEvaluationInstance"
            },
            showSaveButton: {
                type: "boolean",
                value: false
            }
        }
    });
    Wegas.TextEvalInput = TextEvalInput;


    CategorizationInput = Y.Base.create("wegas-review-categinput", Y.Widget, [Y.WidgetChild, Wegas.Widget, Wegas.Editable], {
        CONTENT_TEMPLATE: "<div class=\"wegas-review-evaluation\">" +
            "<div class=\"wegas-review-evaluation-label\"></div>" +
            "<div class=\"wegas-review-evaluation-desc\"></div>" +
            "<div class=\"wegas-review-evaluation-content\">" +
            "<div class=\"wegas-review-categinput-content\"></div>" +
            "</div>" +
            "</div>",
        initializer: function() {
            this.handlers = [];
            this._initialValue = undefined;
            this.publish("save", {
                emitFacade: true
            });
            this.publish("saved", {
                emitFacade: true
            });
            this.publish("editing", {
                emitFacade: true
            });
            /* to be fired if content is edited and canceled in a shot */
            this.publish("revert", {
                emitFacade: true
            });
        },
        renderUI: function() {
            var ev = this.get("evaluation"), desc = ev.get("descriptor"), categs, i,
                categ, frag, CB = this.get("contentBox");
            CB.one(".wegas-review-evaluation-label").setContent(I18n.t(desc.get("label")));
            CB.one(".wegas-review-evaluation-desc").setContent(I18n.t(desc.get("description")));

            if (!this.get("readonly")) {
                frag = ['<select>'];
                categs = desc.get("categories");
                frag.push("<option value=\"\" disabled selected>--select--</option>");
                for (i in categs) {
                    if (categs.hasOwnProperty(i)) {
                        categ = categs[i];
                        frag.push("<option value=\"" + encodeURIComponent(categ.get("name")) + "\" " +
                            (categ === ev.get("value") ? "selected=''" : "") +
                            ">" + I18n.t(categ.get("label")) + "</option>");
                    }
                }
                frag.push('</select>');
                CB.one(".wegas-review-categinput-content").setContent(frag.join(""));
            }
        },
        getCurrentValue: function() {
            var option = this.get("contentBox").one(".wegas-review-categinput-content select");
            if (option) {
                return decodeURIComponent(option.get("options").item(option.get("selectedIndex"))
                    .getAttribute("value"));
            } else {
                option = this.get("contentBox").one(".wegas-review-categinput-content");
                if (option) {
                    return option.getContent();
                } else {
                    return undefined;
                }
            }
        },
        syncUI: function(quiet) {
            var evl, CB, value, select, option;
            this._quiet = quiet;
            CB = this.get("contentBox");
            evl = this.get("evaluation");
            value = evl.get("value");
            if (this.get("readonly")) {
                value = this.get("evaluation").get("descriptor").getLabelForName(value);
                if (!value) {
                    value = "<i>" + I18n.t("review.editor.noValueProvided") + '</i>';
                }
                CB.one(".wegas-review-categinput-content").setContent(value);
            } else if (value !== this._initialValue) {
                this._initialValue = value;
                select = CB.one(".wegas-review-categinput-content select");
                option = select.one("option[value=\"" + encodeURIComponent(value) + "\"]");
                if (option) {
                    var x = select.one("option[selected]");
                    x && x.removeAttribute("selected");

                    option.setAttribute("selected");
                }
            } else {
                // no-update case, fetch effective value from "select"
                evl.set("value", this.getCurrentValue());
            }
            this._quiet = false;
        },
        bindUI: function() {
            var select;
            select = this.get(CONTENTBOX).one(".wegas-review-categinput-content select");
            if (select) {
                this.handlers.push(select.on("change", this.updateValue, this));
            }
        },
        destructor: function() {
            Y.Array.each(this.handlers, function(h) {
                h.detach();
            });
        },
        updateValue: function(e) {
            var ev = this.get("evaluation"),
                value = decodeURIComponent(e.target.get("value"));

            ev.set("value", value);
            !this._quiet && this.fire("saved", {id: ev.get("id"), value: value});

            return true;
        }
    }, {
        ATTRS: {
            evaluation: {
                type: "CategorizedEvaluationInstance"
            },
            readonly: {
                type: "boolean",
                value: false
            }
        }
    });
    Wegas.CategorizationInput = CategorizationInput;
});
