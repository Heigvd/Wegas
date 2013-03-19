/*
 * Wegas
 * http://www.albasim.ch/wegas/
 *
 * Copyright (c) 2013 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
/**
 * @author Benjamin Gerber <ger.benjamin@gmail.com>
 */
YUI.add('wegas-leaderway-score', function (Y) {
    "use strict";

    var CONTENTBOX = 'contentBox', Score = Y.Base.create("wegas-score", Y.Widget, [Y.Wegas.Widget, Y.Wegas.Editable], {

        // *** Fields *** /
        table: null,
        data: null,

        // *** Lifecycle Methods *** //
        initializer: function () {
            this.data = [];
        },

        /**
         * Render the widget.
         * Create the child widget "table"
         */
        renderUI: function () {
            var cb = this.get(CONTENTBOX);
            this.table = new Y.DataTable({
                columns: [
                    {
                        key: "number",
                        label: "#"
                    },
                    {
                        key: "team",
                        label: "Entreprises"
                    },
                    {
                        key: "score",
                        label: "Score"
                    }
                ]
            });
            cb.setContent(
                    '<div class="scoreTitle">' + this.get('title') + '</div>\n\
                <div class="datatable"></div>');
            this.table.render(cb.one(".datatable"));
        },

        /**
         * Synchronise the content of this widget.
         */
        syncUI: function () {
            this.data.length = 0;
            this.getTeamScore(this.get('maxRows'));
            this.table.addRows(this.data);
            if (!this.data[0]) {
                this.table.showMessage("Aucun score n'est disponible.");
            } else {
                this.table.hideMessage();
            }
            this.goToFinalPage();// ! hack function
        },

        /*
         * Destroy all child widget
         */
        destructor: function () {
            this.table.destroy();
        },

        //*** Particular Methods ***/
        /**
         * Add rows to the datatable. Create the hall of fame from team of all time.
         * @param Integer rows, number of wanted rows.
         */
        getTeamScore: function (maxRows) {
            var i, j, k, allScore, team = [], score = [], sortedScore = [], sortedTeam = [], exist = false;
            allScore = Y.Wegas.VariableDescriptorFacade.cache.find("name", "score").get("scope").get("variableInstances");
            for (i in allScore) {
                team.push(Y.Wegas.GameFacade.cache.findById(i).get('name'));
                score.push(allScore[i].get('value'));
            }
            if (score.length > 0) {
                sortedScore = score.slice(0);
                sortedScore.sort();
                sortedScore.reverse();
                for (i = 0; i < sortedScore.length; i++) {
                    for (j = 0; j < score.length; j++) {
                        if (sortedScore[i] === score[j]) {
                            exist = false;
                            for (k = 0; k < sortedTeam.length; k++) {
                                if (sortedTeam[k] === team[j]) {
                                    exist = true;
                                    break;
                                }
                            }
                            if (!exist)
                                sortedTeam.push(team[j]);
                        }
                    }
                }
                if (score.length <= maxRows) {
                    maxRows = score.length;
                }
                for (i = 0; i < maxRows; i++) {
                    this.data.push({
                        number: i + 1,
                        team: sortedTeam[i],
                        score: sortedScore[i]
                    });
                }
            }
        },
        // *** hack Methods *** //
        /**
         * if current week > max value of week value, then
         * change the current widget to go on the "dialogue" widget.
         */
        goToFinalPage: function () {
            var currentWeek = Y.Wegas.VariableDescriptorFacade.cache.find("name", "week"),
                    targetPageLoader = Y.Wegas.PageLoader.find(this.get('targetPageLoaderId'));
            if (parseInt(currentWeek.getInstance().get('value')) > currentWeek.get('maxValue')) {
                targetPageLoader.once("widgetChange", function (e) {
                    e.newVal.setCurrentDialogue("dialogueFinal");
                });
                targetPageLoader.set("pageId", this.get('dialoguePageId'));
            }
        }
    }, {
        ATTRS: {
            title: {
                value: 'Top 5 des meilleurs entreprises.',
                validator: function (s) {
                    return s === null || Y.Lang.isString(s);
                }
            },
            maxRows: {
                value: 5,
                validator: function (i) {
                    return i === null || Y.Lang.isNumber(i);
                }
            },
            dialoguePageId: {
                value: null,
                validator: function (s) {
                    return s === null || Y.Lang.isString(s);
                }
            },
            targetPageLoaderId: {
                value: null,
                validator: function (s) {
                    return s === null || Y.Lang.isString(s);
                }
            }
        }
    });

    Y.namespace('Wegas').Score = Score;
});