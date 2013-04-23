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
        consideredAsRead: null,
        unreadEvidences: null,
        requestedAnswers: null,
        translator: null,
        // *** Lifecycle Methods *** //
        initializer: function() {
            this.handlers = {};
            this.unreadEvidences = [];
            this.consideredAsRead = false;
            this.translator = new Y.Wegas.Translator();
        },
        renderUI: function() {
            this.renderDetailsPanel(this.get(CONTENTBOX));
            this.timer = Y.later(1500, this, function() {
                this.consideredAsRead = true;
            });
        },
        bindUI: function() {
            this.handlers.update = // If data changes, refresh
                    Y.Wegas.Facade.VariableDescriptor.after("update", this.syncUI, this);
            this.handlers.openRow = this.datatable.datasource.after('response', this.highlightNewEvidences, this);
        },
        destructor: function() {
            if (this.consideredAsRead) {
                this.setUnread();
            }
            this.timer.cancel();
            this.datatable.destroy();
            for (var i in this.handlers) {
                this.handlers[i].detach();
            }
        },
        syncUI: function() {
            this.unreadEvidences.length = 0;
            this.requestedAnswers = 0;
            if (Y.Wegas.Facade.VariableDescriptor.cache.find('name', "evidences")) {
                //this.syncAnswers(this.genData()); //and continue sync
                this.datatable.syncUI(this.genData());
                this.highlightNewEvidences();
                this.hideOverlay();
            } else {
                this.datatable.syncUI();
            }
        },
//        syncAnswers: function(data) {
//            var i, reply;
//            if (!data) {
//                return;
//            }
//            for (i = 0; i < data.length; i++) {
//                reply = Y.Wegas.Facade.VariableDescriptor.cache.findById(data[i].choiceDescriptorId);
//                Y.Wegas.Facade.VariableDescriptor.cache.getWithView(reply, "Editor", {// Retrieve the result answer from the server
//                    cfg: {
//                        updateCache: false
//                    },
//                    on: {
//                        success: Y.bind(function(data, position, e) {
//                            var i, j, k, reply = e.serverResponse.get("entities")[0],
//                                    questionInstance, instanceReply, found = false,
//                            questions = Y.Wegas.Facade.VariableDescriptor.cache.find('name', "evidences").flatten();
//                            //find corresponding reply;
//                            for (i = 0; i < questions.length; i = i + 1) {
//                                questionInstance = questions[i].getInstance();
//                                for (j = 0; j < questionInstance.get("replies").length; j = j + 1) {
//                                    instanceReply = questionInstance.get("replies")[j];
//                                    for (k = 0; k < instanceReply.get("result").length; k = k + 1) {
//                                        if (reply.get("results")[k].get("id") === instanceReply.get("result").get("id")) {
//                                            found = true;
//                                            break;
//                                        }
//                                    }
//                                    if (found) {
//                                        break;
//                                    }
//                                }
//                                if (found) {
//                                    break;
//                                }
//                            }
//                            data[position].answer =
//                                    reply.get("results")[k].get("answer") || " + this.translator.getRB().No_description + ";
//                            this.requestedAnswers++;
//                            this.syncTreeble(data);
//                        }, this, data, i),
//                        failure: Y.bind(function(data) {
//                            this.requestedAnswers++;
//                            this.syncTreeble(data);
//                        }, this, data)
//                    }
//                });
//            }
//            this.requestedAnswers = 3;
//            this.syncTreeble(data);
//        },
//        syncTreeble: function(data) {
//            if (this.requestedAnswers === data.length) {
//                this.highlightNewEvidences();
//                this.hideOverlay();
//                this.datatable.syncUI(data);
//            }
//        },
        renderDetailsPanel: function(node) {
            var columns = [{
                    key: "id", //evidenceId
                    className: "hidden"
                }, {
                    //sortable: true, //Don't sort with treeble !
                    key: "startTime",
                    //className: 'hidden',
                    label: this.translator.getRB().Period,
                    className: "period"
                }, {
                    //sortable: true,
                    key: "evidence",
                    label: this.translator.getRB().Evidence
                }, {
                    //sortable: true,
                    key: "analyis",
                    label: this.translator.getRB().Analyse
                }, {
                    key: "answer",
                    label: this.translator.getRB().Result,
                    allowHTML: true
                }, {
                    //sortable: true,
                    key: "fileLinks",
                    allowHTML: true,
                    label: this.translator.getRB().File,
                    emptyCellValue: this.translator.getRB().No_File
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
            
            this.showOverlay();
            for (i = 0; i < questions.length; i += 1) {
                questionInstance = questions[i].getInstance();
                for (j = 0; j < questionInstance.get("replies").length; j += 1) {
                    reply = questionInstance.get("replies")[j];
                    replyData = Y.mix(reply.getAttrs(), reply.get("result").getAttrs());
                    replyData.choiceDescriptorId = reply.get('result').get('choiceDescriptorId');
                    status = reply.getStatus(currentTime);

                    if (reply.get("unread")) {
                        this.unreadEvidences.push(replyData.id);
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
            data.reverse();
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
            if (this.unreadEvidences.length === 0) {
                return;
            }
            this.get(CONTENTBOX).all('.yui3-datatable-data .treeble-depth-0 .yui3-datatable-col-id').each(function(cell, i) {
                if (this.unreadEvidences.indexOf(+cell.getContent()) > -1) {
                    cell.ancestor("tr").addClass('unread');
                }
            }, this);
        }
    });

    Y.namespace('Wegas').ResultsDisplay = ResultsDisplay;
});
