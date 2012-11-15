/*
 * Wegas
 * http://www.albasim.com/wegas/
 *
 * School of Business and Engineering Vaud, http://www.heig-vd.ch/
 * Media Engineering :: Information Technology Managment :: Comem
 *
 * Copyright (C) 2012
 */

/**
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */

YUI.add('wegas-crimesim-resultsdisplay', function (Y) {
    "use strict";

    var CONTENTBOX = 'contentBox',
            ResultsDisplay;

    /**
     *  The results display class.
     */
    ResultsDisplay = Y.Base.create("wegas-crimesim-resultsdisplay", Y.Widget,
            [Y.Wegas.Widget, Y.WidgetChild], {
        // *** Fields *** /
        menu: null,
        handlers: null,
        gallery: null,
        datatable: null,
        currentQuestionId: null,
        // *** Lifecycle Methods *** //
        initializer: function () {
            this.menu = new Y.Wegas.Menu();
            this.menuDetails = new Y.Wegas.Menu({
                width: "250px"
            });
            this.handlers = {};
        },
        renderUI: function () {
            this.renderDetailsPanel(this.get(CONTENTBOX));
        },
        bindUI: function () {
            var cb = this.get(CONTENTBOX);
            this.handlers.playerChange = // If current user changes, refresh (editor only)
                    Y.Wegas.app.after('currentPlayerChange', this.syncUI, this);
        },
        destructor: function () {
            this.datatable.destroy();
            for (var i in this.handlers) {
                this.handlers[i].detach();
            }
        },
        syncUI: function () {
            var data = this.genData();
            this.datatable.syncUI(data);
        },
        renderDetailsPanel: function (node) {
            var columns = [{
                    sortable: true,
                    key: "startTime",
                    //className: 'hidden',
                    label: "Period",
                    className: "period"
                }, {
                    sortable: true,
                    key: "evidence",
                    label: "Evidences"
                }, {
                    sortable: true,
                    key: "analyis",
                    label: "Analyse"
                }, {
                    key: "answer",
                    label: "Result"
                }, {
                    sortable: true,
                    key: "fileLinks",
                    label: "Files",
                    emptyCellValue: "no files"
                }]
            this.datatable = new Y.Wegas.CrimeSimTreeble({
                columns: columns,
                isTreeble: true,
                node: node,
                descriptionColumn: 'evidence'
            })
            this.datatable.render(this.get(CONTENTBOX));
        },
        genData: function () {
            var i, j, k, questionInstance, reply, replyData, status,
                    questions = Y.Wegas.VariableDescriptorFacade.rest.find('name', "evidences").get("items"),
                    data = [],
                    responsesByStartTime = {},
                    period = Y.Wegas.VariableDescriptorFacade.rest.find('name', "period"),
                    periodInstance = period.getInstance(),
                    currentTime = periodInstance.get("value") - period.get("minValue");

            for (i = 0; i < questions.length; i = i + 1) {
                questionInstance = questions[i].getInstance();
                for (j = 0; j < questionInstance.get("replies").length; j = j + 1) {
                    reply = questionInstance.get("replies")[j];
                    replyData = Y.mix(reply.getAttrs(), reply.get("result").getAttrs());
                    status = reply.getStatus(currentTime);

                    replyData.evidence = questions[i].get("name");
                    replyData.analyis = reply.getChoiceDescriptor().get("name");

                    replyData.startTime += 1;

                    if (!replyData.description) {
                        delete replyData.description;
                    }

                    if (status === 1) {
                        replyData.answer = "analysis in progress";
                    } else if (status === 2) {
                        replyData.answer = "analysis planified";
                    } else {
                        replyData.fileLinks = "";
                        for (k = 0; k < replyData.files.length; k = k + 1) {
                            replyData.fileLinks += '<a target="_blank" href="' +
                                    Y.Plugin.CRDataSource.getFullpath(replyData.files[k]) + '">' +
                                    Y.Plugin.CRDataSource.getFilename(replyData.files[k]) + '</a><br />'
                        }
                        if (!replyData.fileLinks) {
                            delete replyData.fileLinks;
                        }
                    }

                    if (!responsesByStartTime[reply.get("startTime")]) {
                        responsesByStartTime[reply.get("startTime")] = [];
                    }
                    responsesByStartTime[reply.get("startTime")].push(replyData);
                }
            }
            for (i in responsesByStartTime) {
                data = data.concat(responsesByStartTime[i]);
            }
            return data;
        }
    });

    Y.namespace('Wegas').ResultsDisplay = ResultsDisplay;
});