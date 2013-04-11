/*
 * Wegas
 * http://www.albasim.ch/wegas/
 *
 * Copyright (c) 2013 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
/**
 * @fileoverview
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
YUI.add('wegas-mcqtabview', function(Y) {
    "use strict";

    var CONTENTBOX = 'contentBox',
            MCQTabView;

    /**
     * @name Y.Wegas.MCQTabView
     * @extends Y.Widget
     * @borrows Y.WidgetChild, Y.Wegas.Widget, Y.Wegas.Editable
     * @class Class to view and reply to questions and choices.
     * @constructor
     * @description  Display and allow to reply at questions and choice sent
     *  to the current player
     */
    MCQTabView = Y.Base.create("wegas-mcqtabview", Y.Widget, [Y.WidgetChild, Y.Wegas.Widget, Y.Wegas.Editable], {
        /** @lends Y.Wegas.MCQTabView# */

        // *** Private fields *** //
        /**
         * TabView widget used to display question/choices and corresponding reply
         */
        tabView: null,
        /**
         * datasource from Y.Wegas.Facade.VariableDescriptor
         */
        dataSource: null,
        /**
         * Reference to each used functions
         */
        handlers: null,
        // *** Lifecycle Methods *** //
        /**
         * @function
         * @private
         * @description Set variable with initials values.
         */
        initializer: function() {
            this.dataSource = Y.Wegas.Facade.VariableDescriptor;
            this.tabView = new Y.TabView();
            this.gallery = null;
            this.handlers = {};
        },
        /**
         * @function
         * @private
         * @description Render the TabView widget in the content box.
         */
        renderUI: function() {
            var cb = this.get(CONTENTBOX);
            this.tabView.render(cb);
            cb.append("<div style='clear:both'></div>");
        },
        /**
         * @function
         * @private
         * @description bind function to events.
         * When submit button is clicked, send the selected choice
         * When datasource is updated, do syncUI;
         */
        bindUI: function() {
            this.get(CONTENTBOX).delegate("click", function(e) {
                this.showOverlay();
                this.dataSource.sendRequest({
                    request: "/QuestionDescriptor/SelectAndValidateChoice/" + e.target.get('id')
                            + "/Player/" + Y.Wegas.app.get('currentPlayer'),
                    on: {
                        failure: Y.bind(this.defaultExceptionHandler, this)
                    }
                });
            }, "input[type=submit]", this);

            this.handlers.response = this.dataSource.after("update", this.syncUI, this);
        },
        /**
         * @function
         * @private
         * @description Clear and re-fill the TabView with active
         * choice/questions and relatives reply.
         * Display a message if there is no message.
         */
        syncUI: function() {
            var i, j, cReplyLabel, cQuestion, ret, firstChild, cQuestionInstance, cQuestionLabel, tab, cChoices, choiceDescriptor, reply,
                    questions = this.get("variable.evaluated"),
                    selectedTab = this.tabView.get('selection'),
                    lastSelection = (selectedTab) ? selectedTab.get('index') : 0;

            this.tabView.removeAll();                                           // Empty the tabview
            if (this.gallery) {
                this.gallery.destroy();
                this.gallery = null;
            }
            if (questions) {

                questions = questions.get("items");

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

                            ret.push('<div class="replies">');

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

                                if (reply.get("result").get("answer")) {
                                    ret.push('<div class="replies"><div class="reply first-child">', reply.get("result").get("answer"), '</div></div>');
                                }

                                if (!cReplyLabel) {
                                    cReplyLabel = choiceDescriptor.getPublicLabel().substr(0, 15) + "...";
                                }
                            }
                            ret.push("</div>");
                        }

                        ret.push("</div>");
                        tab = new Y.Tab({
                            label: '<div class="'
                                    + (cQuestionInstance.get("replies").length === 0 ? "unread" : "")
                                    + '"><div class="label">' + cQuestionLabel + '</div>'
                                    + '<div class="status">' + (cReplyLabel || "unanswered") + '</div></div>',
                            content: ret.join('')
                        });
                        tab.questionInstance = cQuestionInstance;
                        this.tabView.add(tab);
                    }
                    if (cQuestion.get("pictures").length > 0) {
                        this.gallery = new Y.Wegas.util.FileExplorerGallery({
                            render: this.get(CONTENTBOX).one(".description"),
                            selectedHeight: 150,
                            selectedWidth: 235,
                            gallery: Y.clone(cQuestion.get("pictures"))
                        });
                    }
                }
            }

            if (this.tabView.isEmpty()) {
                this.tabView.add(new Y.Tab({
                    label: "",
                    content: "<center><i><br /><br /><br />No questions available yet.</i></center>"
                }));
//                this.tabView.selectChild(0);
            }
            this.tabView.selectChild(lastSelection);
            this.hideOverlay();
            if (this.gallery) {
                this.gallery.syncUI();
            }
        },
        /**
         * @function
         * @private
         * @description Destroy TabView and detach all functions created
         *  by this widget
         */
        destructor: function() {
            var i;
            if(this.gallery){
                this.gallery.destroy();
            }
            this.tabView.destroy();
            for (i in this.handlers) {
                this.handlers[i].detach();
            }
        }
    }, {
        /** @lends Y.Wegas.MCQTabView */

        /**
         * @field
         * @static
         * @description
         * <p><strong>Attributes</strong></p>
         * <ul>
         *    <li>variable: The target variable, returned either based on the name
         *     attribute, and if absent by evaluating the expr attribute.</li>
         * </ul>
         */
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
