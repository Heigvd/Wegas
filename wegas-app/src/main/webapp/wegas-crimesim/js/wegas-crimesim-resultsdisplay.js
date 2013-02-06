/*
 * Wegas
 * http://www.albasim.ch/wegas/
 *
 * Copyright (c) 2013 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
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
            [Y.Wegas.Widget, Y.WidgetChild, Y.Wegas.Editable], {
        // *** Fields *** /
        menu: null,
        handlers: null,
        gallery: null,
        datatable: null,
        // *** Lifecycle Methods *** //
        initializer: function () {
            this.handlers = {};
        },
        renderUI: function () {
            this.renderDetailsPanel(this.get(CONTENTBOX));
            this.setUnread();
        },
        bindUI: function () {
            this.handlers.playerChange = // If current user changes, refresh (editor only)
                    Y.Wegas.app.after('currentPlayerChange', this.syncUI, this);

            this.handlers.response = // If data changes, refresh
                    Y.Wegas.app.dataSources.VariableDescriptor.after("response",
                    this.syncUI, this);
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
                    key: "choiceDescriptorId",
                    className: "hidden"
                }, {
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
                    label: "Result",
                    allowHTML: true
                }, {
                    sortable: true,
                    key: "fileLinks",
                    allowHTML: true,
                    label: "Files",
                    emptyCellValue: "no files"
                }];
            this.datatable = new Y.Wegas.CrimeSimTreeble({
                columns: columns,
                isTreeble: true,
                node: node,
                descriptionColumn: 'evidence'
            });
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
                    replyData.choiceDescriptorId = reply.get('result').get('choiceDescriptorId');
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
                                    Y.Plugin.CRDataSource.getFilename(replyData.files[k]) + '</a><br />';
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
        },
        setUnread: function () {
            var i, j, questionInstance, reply,
                    questions = Y.Wegas.VariableDescriptorFacade.rest.find('name', "evidences").get("items");
            for (i = 0; i < questions.length; i = i + 1) {
                questionInstance = questions[i].getInstance();
                for (j = 0; j < questionInstance.get("replies").length; j = j + 1) {
                    reply = questionInstance.get("replies")[j];
                    if (reply.get("unread")) {
                        reply.set("unread", false);
                        Y.Wegas.VariableDescriptorFacade.rest.sendRequest({
                            request: "/" + reply.getAttrs().id + "/Reply/" + reply.getAttrs().id,
                            headers: {
                                'Content-Type': 'application/json; charset=ISO-8859-1'
                            },
                            cfg: {
                                method: "PUT",
                                data: reply
                            }
                        });
                    }
                }
            }
        }
    });

    Y.namespace('Wegas').ResultsDisplay = ResultsDisplay;
});