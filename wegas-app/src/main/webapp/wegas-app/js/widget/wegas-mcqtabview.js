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

YUI.add('wegas-mcqtabview', function (Y) {
    "use strict";

    var CONTENTBOX = 'contentBox',
    MCQTabView;

    MCQTabView = Y.Base.create("wegas-mcqtabview", Y.Widget, [Y.WidgetChild, Y.Wegas.Widget, Y.Wegas.Editable], {

        // *** Private fields *** //
        tabView: null,
        dataSource: null,
        handlers: null,

        // *** Lifecycle Methods *** //
        renderUI: function () {
            var cb = this.get(CONTENTBOX);
            this.dataSource = Y.Wegas.VariableDescriptorFacade;
            this.tabView = new Y.TabView();
            this.tabView.render(cb);
            cb.append("<div style='clear:both'></div>");
            this.handlers = {};
        },

        bindUI: function () {
            this.get(CONTENTBOX).delegate("click", function (e) {
                this.showOverlay();
                this.dataSource.rest.sendRequest({
                    request: "/QuestionDescriptor/SelectChoice/" + e.target.get('id')
                    + "/Player/" + Y.Wegas.app.get('currentPlayer'),
                    on: {
                        failure: Y.bind(this.defaultExceptionHandler, this)
                    }
                });
            }, "input[type=submit]", this);

            this.tabView.after("selectionChange", this.onTabSelected, this);

            this.handlers.response = this.dataSource.after("response", this.syncUI, this);
            this.handlers.playerChange = Y.Wegas.app.after('currentPlayerChange', this.syncUI, this);
        },

        syncUI: function () {
            var i, j, cReplyLabel, cQuestion, ret, firstChild, cQuestionInstance, cQuestionLabel, tab, cChoices, choiceDescriptor, reply,
            questions = this.get("variable.evaluated"),
            selectedTab = this.tabView.get('selection'),
            lastSelection = (selectedTab) ? selectedTab.get('index') : 0;

            if (!questions) {
                return;
            }
            questions = questions.get("items");

            this.tabView.removeAll();                                           // Empty the tabview

            for (i = 0; i < questions.length; i += 1) {
                cQuestion = questions[i];
                cQuestionLabel = cQuestion.getPublicLabel() || "undefined";
                ret = [//'<div class="title">Details</div>',
                '<div class="content">',
                '<div class="title">', cQuestionLabel, '</div>',
                '<div class="description">',
                (cQuestion.get("description") || "<em>No description</em>"), '</div>'];
                cQuestionInstance = cQuestion.getInstance();
                firstChild = "first-child";
                cReplyLabel = null;
                cChoices = cQuestion.get("items");

                if (cQuestionInstance.get("active")) {
                    if (cQuestionInstance.get("replies").length === 0        // If the question is not replied, we display its reply set
                        || cQuestion.get("allowMultipleReplies")) {

                        ret.push('<div class="subtitle">Possible replies</div><div class="replies">');

                        for (j = 0; j < cChoices.length; j += 1) {
                            if (cChoices[j].getInstance().get("active")) {
                                ret.push('<div class="reply ', firstChild, '">',
                                    '<div class="name">', cChoices[j].get("label"), '</div>',
                                    '<div class="content">', cChoices[j].get("description"), '</div>',
                                    '<input type="submit" id="', cChoices[j].get("id"), '" value="Submit"></input>',
                                    '<div style="clear:both"></div>',
                                    '</div>');
                                firstChild = "";
                            }
                        }
                        ret.push('</div>');
                    }

                    if (cQuestionInstance.get("replies").length > 0) {       // Display the selected replies
                        ret.push('<div class="subtitle">Selected replies</div><div class="replies">');
                        for (j = 0; j < cQuestionInstance.get("replies").length; j += 1) {
                            reply = cQuestionInstance.get("replies")[j];
                            choiceDescriptor = reply.getChoiceDescriptor();
                            ret.push('<div class="reply"><div class="name">', choiceDescriptor.get("label"), '</div>',
                                '<div>', choiceDescriptor.get("description"), '</div>',
                                '<div style="clear:both"></div></div>');

                            ret.push('<div class="subtitle">Result</div>',
                                '<div class="replies"><div class="reply first-child">', reply.get("result").get("answer"), '</div></div>');

                            if (!cReplyLabel) {
                                cReplyLabel = choiceDescriptor.getPublicLabel().substr(0, 15) + "...";
                            }
                        }
                        ret.push("</div>");
                    }

                    ret.push("</div>");
                    tab = new Y.Tab({
                        label: '<div class="' + (cQuestionInstance.get("replies").length === 0 ? "unread" : "") + '"><div class="label">' + cQuestionLabel + '</div>'
                        + '<div class="status">' + (cReplyLabel || "unanswered") + '</div></div>',
                        content: ret.join('')
                    });
                    tab.questionInstance = cQuestionInstance;
                    this.tabView.add(tab);
                }
            }

            if (this.tabView.isEmpty()) {
                this.tabView.add(new Y.Tab({
                    label: "",
                    content: "<center><i><br /><br /><br />No questions available yet.</i></center>"
                }));
            }

            this.tabView.selectChild(lastSelection);
            this.hideOverlay();
        },
        /**
         *
         */
        destructor: function () {
            var i;
            for (i in this.handlers) {
                this.handlers[i].detach();
            }
        },

        // *** Private Methods *** //
        // *** Callbacks *** //
        onTabSelected: function (e) {

            return;                                                             // This logic is not executed, since we do not manage read count on questions

            if (this.timer) {                                                   // If there is an active unread
                this.timer.cancel();                                            // question timer, we cancel it.
            }

            if (e.newVal && e.newVal.questionInstance.get("unread")) {       // If the question is currently unread,
                Y.log("Sending question read update", "info",  "MCQTabView");
                this.questionInstance = e.newVal.questionInstance;
                this.timer = Y.later(2000, this, function () {
                    this.questionInstance.set("unread", false);
                    this.dataSource.rest.put(this.questionInstance);
                });
            }
        }
    }, {
        ATTRS: {
            variable: {

                /**
                * The target variable, returned either based on the name attribute,
                * and if absent by evaluating the expr attribute.
                */
                getter: Y.Wegas.Widget.VARIABLEDESCRIPTORGETTER,
                _inputex: {
                    _type: "variableselect"
                }
            }
        }
    });

    Y.namespace('Wegas').MCQTabView = MCQTabView;
});
