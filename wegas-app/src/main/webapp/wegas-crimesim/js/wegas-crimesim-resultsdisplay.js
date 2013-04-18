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

YUI.add('wegas-crimesim-resultsdisplay', function(Y) {
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
        timer: null,
        gallery: null,
        datatable: null,
        unreadRows: null,
        // *** Lifecycle Methods *** //
        initializer: function() {
            this.handlers = {};
            this.unreadRows = [];
        },
        renderUI: function() {
            this.renderDetailsPanel(this.get(CONTENTBOX));
            this.timer = Y.later(3000, this, function() {
                this.setUnread();
            });
        },
        bindUI: function() {
            this.handlers.response = // If data changes, refresh
                    Y.Wegas.Facade.VariableDescriptor.after("update", this.syncUI, this);
            this.handlers.toggleRow = //don't work
                    this.get(CONTENTBOX).one("table").delegate("click", function() {
                this.highlightNewEvidences();
            }, ".yui3-datatable-col-treeblenub", this);
        },
        destructor: function() {
            this.timer.cancel();
            this.datatable.destroy();
            for (var i in this.handlers) {
                this.handlers[i].detach();
            }
        },
        syncUI: function() {
            this.unreadRows.length = 0;
            if (Y.Wegas.Facade.VariableDescriptor.cache.find('name', "evidences")) {
                this.datatable.syncUI(this.genData());
                this.highlightNewEvidences();
            } else {
                this.datatable.syncUI([]);
            }
        },
        renderDetailsPanel: function(node) {
            var columns = [{
                    key: "choiceDescriptorId",
                    className: "hidden"
                }, {
                    //sortable: true, //Don't sort with treeble !
                    key: "startTime",
                    //className: 'hidden',
                    label: "Period",
                    className: "period"
                }, {
                    //sortable: true,
                    key: "evidence",
                    label: "Evidences"
                }, {
                    //sortable: true,
                    key: "analyis",
                    label: "Analyse"
                }, {
                    key: "answer",
                    label: "Result",
                    allowHTML: true
                }, {
                    //sortable: true,
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
        genData: function() {
            var i, j, k, questionInstance, reply, replyData, status,
                    questions = Y.Wegas.Facade.VariableDescriptor.cache.find('name', "evidences").flatten(),
                    data = [],
                    responsesByStartTime = {},
                    period = Y.Wegas.Facade.VariableDescriptor.cache.find('name', "period"),
                    periodInstance = period.getInstance(),
                    currentTime = periodInstance.get("value") - period.get("minValue"),
                    rowCount = 0;

            for (i = 0; i < questions.length; i = i + 1) {
                questionInstance = questions[i].getInstance();
                for (j = 0; j < questionInstance.get("replies").length; j = j + 1) {
                    reply = questionInstance.get("replies")[j];
                    replyData = Y.mix(reply.getAttrs(), reply.get("result").getAttrs());
                    replyData.choiceDescriptorId = reply.get('result').get('choiceDescriptorId');
                    status = reply.getStatus(currentTime);

                    if (reply.get("unread")) {
                        this.unreadRows.push(rowCount);
                    }

                    replyData.evidence = questions[i].getPublicLabel();
                    replyData.analyis = reply.getChoiceDescriptor().getPublicLabel();

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
                    rowCount++;
                }
            }
            for (i in responsesByStartTime) {
                data = data.concat(responsesByStartTime[i]);
            }
            return data;
        },
        /**
         *
         * @returns {undefined}
         */
        setUnread: function() {
            var i, j, questionInstance, reply,
                    questions = Y.Wegas.Facade.VariableDescriptor.cache.find('name', "evidences").flatten();
            for (i = 0; i < questions.length; i = i + 1) {
                questionInstance = questions[i].getInstance();
                for (j = 0; j < questionInstance.get("replies").length; j = j + 1) {
                    reply = questionInstance.get("replies")[j];
                    if (reply.get("unread")) {
                        reply.set("unread", false);
                        Y.Wegas.Facade.VariableDescriptor.sendRequest({
                            request: "/QuestionDescriptor/Reply/" + reply.get("id"),
                            cfg: {
                                method: "PUT",
                                data: reply
                            }
                        });
                    }
                }
            }
        },
        highlightNewEvidences: function() {
            if (this.unreadRows.length === 0) {
                return;
            }
            this.get(CONTENTBOX).all('.yui3-datatable-data .yui3-datatable-col-choiceDescriptorId').each(function(cell, i) {
                if (this.unreadRows.indexOf(i) > -1) {
                    cell.ancestor("tr").addClass('unread');
                }
            }, this);
        }
    });

    Y.namespace('Wegas').ResultsDisplay = ResultsDisplay;
});