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
        unreadRepliesId: null,
        // *** Lifecycle Methods *** //
        initializer: function() {
            this.handlers = {};
            this.unreadRepliesId = [];
            this.considerateAsRead = false;
        },
        renderUI: function() {
            this.renderDetailsPanel(this.get(CONTENTBOX));
            this.timer = Y.later(5000, this, function() {
                this.considerateAsRead = true;
            });
        },
        bindUI: function() {
            this.handlers.playerChange = // If current user changes, refresh (editor only)
                    Y.Wegas.app.after('currentPlayerChange', this.syncUI, this);

            this.handlers.response = // If data changes, refresh
                    Y.Wegas.Facade.VariableDescriptor.after("update",
                    this.syncUI, this);
        },
        destructor: function() {
            if (this.considerateAsRead) {
                this.setUnread();
            }
            this.timer.cancel();
            this.datatable.destroy();
            for (var i in this.handlers) {
                this.handlers[i].detach();
            }
        },
        syncUI: function() {
            this.unreadRepliesId.length = 0;
            if (Y.Wegas.Facade.VariableDescriptor.cache.find('name', "evidences")) {
                this.datatable.syncUI(this.genData());
                this.higlightNewsEvidences();
            } else {
                this.datatable.syncUI([]);
            }
        },
        renderDetailsPanel: function(node) {
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
        genData: function() {
            var i, j, k, questionInstance, reply, replyData, status,
                    questions = Y.Wegas.Facade.VariableDescriptor.cache.find('name', "evidences").flatten(),
                    data = [],
                    responsesByStartTime = {},
                    period = Y.Wegas.Facade.VariableDescriptor.cache.find('name', "period"),
                    periodInstance = period.getInstance(),
                    currentTime = periodInstance.get("value") - period.get("minValue");

            for (i = 0; i < questions.length; i = i + 1) {
                questionInstance = questions[i].getInstance();
                for (j = 0; j < questionInstance.get("replies").length; j = j + 1) {
                    reply = questionInstance.get("replies")[j];
                    replyData = Y.mix(reply.getAttrs(), reply.get("result").getAttrs());
                    replyData.choiceDescriptorId = reply.get('result').get('choiceDescriptorId');
                    status = reply.getStatus(currentTime);

                    if (reply.get("unread")) {
                        this.unreadRepliesId.push(replyData.choiceDescriptorId);
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
        higlightNewsEvidences: function() {
            var j;
            if (this.unreadRepliesId.length === 0) {
                return;
            }
            this.get(CONTENTBOX).all('.yui3-datatable-col-choiceDescriptorId').each(function(cell, i) {
                for (j = 0; j < this.unreadRepliesId.length; j++) {
                    if (+cell.getContent() === this.unreadRepliesId[j]) {
                        cell.ancestor("tr").addClass('unread');
                    }
                }
            }, this);
        }
    });

    Y.namespace('Wegas').ResultsDisplay = ResultsDisplay;
});