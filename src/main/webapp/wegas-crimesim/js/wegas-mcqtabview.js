/**
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */

YUI.add('wegas-mcqtabview', function (Y) {
    "use strict";

    var CONTENTBOX = 'contentBox',
    MCQTabView;

    MCQTabView = Y.Base.create("wegas-mcqtabview", Y.Widget, [Y.WidgetChild, Y.Wegas.Widget], {

        // *** Private fields *** //
        tabView: null,

        // *** Lifecycle Methods *** //
        renderUI: function () {
            this.tabView = new Y.TabView({
                children: []
            });

            this.tabView.render(this.get(CONTENTBOX).append('<div></div>'));
        },

        bindUI: function () {
            this.get(CONTENTBOX).delegate("click", function (e) {
                Y.Wegas.app.dataSources.VariableDescriptor.rest.sendRequest({
                    request: "/QuestionDescriptor/SelectReply/" + e.target.get('id')
                    + "/Player/" + Y.Wegas.app.get('currentPlayer')
                });
            }, "input[type=submit]", this);

            Y.Wegas.app.dataSources.VariableDescriptor.after("response", this.syncUI, this);

            Y.Wegas.app.after('currentPlayerChange', this.syncUI, this);
        },

        syncUI: function () {
            var i, j, cReplyLabel, cQuestion, ret, firstChild, cQuestionInstance, cQuestionLabel,
                questions = Y.Wegas.app.dataSources.VariableDescriptor.rest.getCachedVariableBy('name', "questions").items,
                selectedTab = this.tabView.get('selection'),
                lastSelection = (selectedTab) ? selectedTab.get('index') : 0;

            this.tabView.removeAll();

            for (i = 0; i < questions.length; i += 1) {
                cQuestion = questions[i];
                ret = [];
                cQuestionInstance = Y.Wegas.app.dataSources.VariableDescriptor.rest.getDescriptorInstance(cQuestion);
                firstChild = "first-child";
                cQuestionLabel = cQuestion.label || cQuestion.name || "undefined";
                cReplyLabel = null;

                if (cQuestionInstance.active) {
                    if (cQuestionInstance.replies.length === 0                  // If the question is not replied, we display its reply set
                        || cQuestion.allowMultipleReplies) {

                        ret.push('<div class="subtitle">Answers</div><div class="replies">');

                        for (j = 0; j < cQuestion.items.length; j += 1) {
                            ret.push('<div class="reply ' + firstChild + '">'
                                + '<div class="name">' + cQuestion.items[j].name + '</bold>'
                                + '<div class="description">' + cQuestion.items[j].description + '</div>'
                                + '<input type="submit" id="' + cQuestion.items[j].id + '" value="Submit"></input>'
                                + '<div style="clear:both"></div>'
                                + '</div>');
                            firstChild = "";
                        }
                        ret.push('</div>');
                    } else {                                                    // Otherwise we display the selected reply

                        ret.push('<div class="subtitle">Selected answer</div><div class="replies">');

                        for (j = 0; j < cQuestionInstance.replies.length; j += 1) {
                            var choiceDescriptor = this.getChoiceDescriptor(cQuestionInstance.replies[j].choiceDescriptorId);
                            ret.push('<div class="reply">'
                                + '<bold>' + choiceDescriptor.name + '</bold>'
                                + '<div>' + choiceDescriptor.description + '</div>'
                                + '<div style="clear:both"></div>'
                                + '</div>');
                            ret.push('</div><div class="subtitle">Results</div>',
                                '<div class="replies"><div class="reply first-child">', choiceDescriptor.answer, '</div></div>');

                            if (!cReplyLabel) {
                                cReplyLabel = choiceDescriptor.name.substr(0, 15)+"...";
                            }
                        }
                    }

                    this.tabView.add({
                        label: '<div class="label">' + cQuestionLabel + '</div><div class="status">' + (cReplyLabel || "unanswered") + '</div>',
                        content: '<div class="title">Details</div>'
                        + '<div class="content">'
                        + '<div class="title">' + cQuestionLabel + '</div>'
                        + '<div class="description">' + cQuestion.description + '</div>'
                        + ret.join('') + '</div>'
                    });
                }
            }
            /* @fixme */
            Y.later(100, this, function() {
                this.tabView.selectChild(lastSelection);
            });
        },

        // *** Private Methods *** //
        // *** Model methods *** //
        getChoiceDescriptor: function(id) {
            return Y.Wegas.app.dataSources.VariableDescriptor.rest.getCachedVariableById(id);
        }
    });

    Y.namespace('Wegas').MCQTabView = MCQTabView;
});