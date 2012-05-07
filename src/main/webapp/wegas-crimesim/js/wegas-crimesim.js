/**
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */

YUI.add('wegas-crimesim', function (Y) {
    "use strict";

    var CONTENTBOX = 'contentBox',
    YAHOO = Y.YUI2,
    ScheduleDisplay, Menu;

    /**
     * Helper to display the menu in a positionable box
     */
    Menu = Y.Base.create("scheduledisplay-menu", Y.Widget,
        [Y.WidgetPosition,  Y.WidgetPositionAlign, Y.WidgetStack], {

            // *** Fields *** /
            menu: null,

            // *** Lifecycle Methods *** //
            renderUI : function () {
                var cb = this.get(CONTENTBOX);

                this.menu = new YAHOO.widget.Menu("scheduledisplay-menu", {
                    visible: true,
                    position: 'static',
                    hidedelay: 100,
                    shadow: true
                });
                this.menu.render(cb._node);
            },

            // *** Methods *** /
            setMenuItems: function (menuItems) {
                this.menu.clearContent();
                this.menu.addItems(menuItems);
                this.menu.render();
            }

        // *** Private Methods *** //
        });

    /**
     *  The schedule display class.
     */
    ScheduleDisplay = Y.Base.create("wegas-crimesim-scheduledisplay", Y.Widget,
        [Y.WidgetChild, Y.Wegas.Widget], {

            // *** Fields *** /
            _menu: null,

            // *** Lifecycle Methods *** //
            renderUI: function () {
                this._menu = new Menu({
                    zIndex: 2,
                    render: true,
                    visible: true
                });
                this.get(CONTENTBOX).setContent('<div class="schedule-questions"></div><div class="schedule-detail"></div>');
            },
            bindUI: function () {
                var cb = this.get(CONTENTBOX);

                cb.delegate("click", function (e) {                             // Show the "action available" menu on cell click
                    var questionId =  e.target.ancestor("tr").getAttribute("data-questionid"),
                    startTime = e.target.ancestor("td").getAttribute("data-startTime"),
                    question = Y.Wegas.app.dataSources.VariableDescriptor.rest.getCachedVariableById(questionId);

                    this._menu.setMenuItems(this._genMenuItems(question, startTime));
                    this._menu.get("boundingBox").appendTo(e.target.get('parentNode'));
                    this._menu.set("align", {
                        node: e.target,
                        points: ["tr", "br"]
                    });
                    this._menu.show();
                }, ".schedule-available .icon", this);

                this._menu.menu.subscribe("click", this.onMenuClick,            // Listen for the choice menu click event
                    null, this);

                cb.delegate("click", function (e) {                             // Show the question detail on left label click
                    var questionId = e.target.ancestor("tr").getAttribute("data-questionid");
                    this._syncDetailsPanel(questionId);
                }, "td.schedule-leftcolum", this);

                cb.delegate("click", this._hideDetails,                         // Hide the question detail on close icon click
                    ".schedule-icon-close", this);

                cb.delegate("click", this.onCancelReplyClick,                   // Hide the question detail on close icon click
                    ".icon .close-icon", this);

                Y.Wegas.app.dataSources.VariableDescriptor.after("response",    // If data changes, refresh
                    this.syncUI, this);

                Y.Wegas.app.after('currentPlayerChange', this.syncUI, this);    // If current user changes, refresh (editor only)

            },

            syncUI: function () {
                this._syncSchedule();
                if (this._currentQuestionId) {
                    this._syncDetailsPanel(this._currentQuestionId);
                }
            },

            // *** Model methods *** //
            getChoiceDescriptor: function(id) {
                return Y.Wegas.app.dataSources.VariableDescriptor.rest.getCachedVariableById(id);
            },

            // *** Rendering methods *** //
            _syncSchedule: function () {
                var perPeriodBudget = 15, perPeriodLoad = [], cIndex, choiceDescriptor, choiceInstance,
                questionInstance,  reply, i, j, k, question, cols, replies, names,
                questionsVarDesc = Y.Wegas.app.dataSources.VariableDescriptor.rest.getCachedVariableBy('name', "evidences").items,
                questionInstances = [],
                period = Y.Wegas.app.dataSources.VariableDescriptor.rest.getCachedVariableBy('name', "period"),
                periodInstance = Y.Wegas.app.dataSources.VariableDescriptor.rest.getInstanceBy("name", "period"),
                acc = ['<table class="schedule-table"><tr><th class="schedule-leftcolum">Evidences</th>'],
                cb = this.get(CONTENTBOX).one(".schedule-questions");


                this._perPeriodLoad = perPeriodLoad;

                if (!period) {
                    cb.setContent("No time variable is set.");
                    return;
                }

                for (i = period.minValue; i <= period.maxValue; i += 1) {
                    acc.push('<th class="schedule-maincolum"><div>' + i + '</div></th>'); // Generate table header
                    perPeriodLoad.push(0);                                      // Default value for perPeriodLoad calculation
                }
                acc.push("</tr>");

                for (i = 0; i < questionsVarDesc.length; i += 1) {              // First pass to compute remaining time budget per period
                    question = questionsVarDesc[i];
                    questionInstance = Y.Wegas.app.dataSources.VariableDescriptor.rest.getDescriptorInstance(question);
                    for (j = 0; j < questionInstance.replies.length; j += 1) {
                        reply = questionInstance.replies[j];
                        choiceDescriptor = this.getChoiceDescriptor(reply.choiceDescriptorId);
                        perPeriodLoad[reply.startTime] += choiceDescriptor.cost;
                    }
                    questionInstances.push(questionInstance);
                }

                for (i = 0; i < questionsVarDesc.length; i += 1) {              // Generate table body
                    question = questionsVarDesc[i];
                    questionInstance = questionInstances[i];

                    if (!questionInstance.active) {
                        continue;
                    }

                    acc.push('<tr data-questionId="' + question.id + '"><td class="schedule-leftcolum" >' +
                        (question.label || question.name || "undefined") + "</td>");

                    cols = [];
                    names = [];
                    replies = [];

                    for (j = 0; j <= period.maxValue - period.minValue; j += 1) {   // Initially, all time slots are available
                        if (j >= periodInstance.value - period.minValue) {
                            cols.push(["schedule-item", "schedule-available"]);
                        } else {
                            cols.push(["schedule-item"]);
                        }
                        replies.push(null);
                        names.push("");
                    }

                    for (j = 0; j < questionInstance.replies.length; j += 1) {
                        reply = questionInstance.replies[j];
                        cIndex = reply.startTime;
                        choiceDescriptor = this.getChoiceDescriptor(reply.choiceDescriptorId);
                        choiceInstance = Y.Wegas.app.dataSources.VariableDescriptor.rest.getDescriptorInstance(choiceDescriptor);

                        cols[cIndex] = ["schedule-unavailable", "schedule-unavailablestart", "schedule-unavailable-" + choiceDescriptor.duration];

                        names[cIndex] = choiceDescriptor.name;
                        replies[cIndex] = reply;

                        for (k = 1; k < choiceDescriptor.duration; k += 1) {
                            cols[cIndex + k] = ["schedule-unavailable"];
                        }

                        cols[cIndex].push((choiceInstance.active) ? "schedule-active" : "schedule-inactive");
                    }

                    for (j = 0; j <= period.maxValue - period.minValue; j += 1) {
                        if (j > periodInstance.value - period.minValue) {
                            cols[j].push("schedule-future");    // Mark cells in the future
                        } else if (j < periodInstance.value - period.minValue) {
                            cols[j].push("schedule-past");      // Mark cells in the past
                        } else {
                            cols[j].push("schedule-present");   // Mark cells in the past
                        }
                    }

                    for (j = 0; j < cols.length; j += 1) {
                        acc.push('<td data-startTime="' + j +
                            '" class="' + cols[j].join(" ") + '"><div><div class="icon" data-replyid="' +
                            ((replies[j]) ? replies[j].id : '') + '">' +
                            names[j] + '<div class="close-icon"></div></div></div></td>');
                    }

                    acc.push("</tr>");
                }

                acc.push('<tfoot><tr>',                                         // Generate table footer
                    '<td class="schedule-leftcolum">Available human resources</td>');
                for (i = 0; i < perPeriodLoad.length; i += 1) {
                    acc.push('<td>' + (perPeriodBudget - perPeriodLoad[i]) + '/' + perPeriodBudget + '</td>');
                }
                acc.push("</tr></tfoot></table>");

                cb.setContent(acc.join(""));                                    // Update ContentBox
            },

            _currentQuestionId: null,

            _syncDetailsPanel: function (questionId) {
                var i, reply,
                targetNode = this.get(CONTENTBOX).one(".schedule-detail"),
                question = Y.Wegas.app.dataSources.VariableDescriptor.rest.getCachedVariableById(questionId),
                questionInstance = Y.Wegas.app.dataSources.VariableDescriptor.rest.getInstanceById(question.id),
                periodDesc = Y.Wegas.app.dataSources.VariableDescriptor.rest.getCachedVariableBy('name', "period"),
                period = Y.Wegas.app.dataSources.VariableDescriptor.rest.getInstanceBy('name', "period"),
                acc = ['<div class="schedule-icon-close"></div><h1>',
                question.label || question.name || "undefined",
                '</h1><div class="content">', question.description, '</div>'];

                this._currentQuestionId = questionId;

                if (questionInstance.replies.length > 0) {
                    acc.push('<h2>Anaylses</h2>');
                }
                for (i = 0; i < questionInstance.replies.length; i += 1) {

                    reply = questionInstance.replies[i];

                    var choiceDescriptor = this.getChoiceDescriptor(reply.choiceDescriptorId),
                    choiceInstance = Y.Wegas.app.dataSources.VariableDescriptor.rest.getDescriptorInstance(choiceDescriptor);

                    acc.push('<div class="schedule-detail-reply"><h3>Period ',
                        reply.startTime - periodDesc.minValue, ': ', choiceDescriptor.name || "undefined",
                        '</h3><div class="content">');
                    if ((reply.startTime + choiceDescriptor.duration) <= period.value - periodDesc.minValue) {
                        acc.push(choiceDescriptor.answer);
                    } else if (reply.startTime <= period.value - periodDesc.minValue) {
                        acc.push("analysis in progress");
                    } else {
                        acc.push("analysis planified");
                    }
                    acc.push("</div>");
                }

                targetNode.setContent(acc.join(""));
                targetNode.setStyles( {
                    position: 'display',
                    display:"block"
                });
            },
            _hideDetails: function () {
                var targetNode = this.get(CONTENTBOX).one(".schedule-detail");
                targetNode.setStyles({
                    position: 'display',
                    display:"none"
                });
                this._currentQuestionId = null;
            },

            // *** Events Methods *** /

            onCancelReplyClick: function(e, args) {
                var replyId =  e.target.ancestor(".icon").getAttribute("data-replyid");

                Y.Wegas.app.dataSources.VariableDescriptor.rest.sendRequest({
                    request: "/QuestionDescriptor/CancelReply/" + replyId
                });
            },
            onMenuClick: function (e, args) {
                var menuItem = args[1],
                choice = menuItem.value.reply;

                Y.Wegas.app.dataSources.VariableDescriptor.rest.sendRequest({
                    request: "/QuestionDescriptor/SelectReply/" + choice.id
                    + "/Player/" + Y.Wegas.app.get('currentPlayer') + "/StartTime/" + menuItem.value.startTime + "/"
                });
            },
            _genMenuItems: function (question, startTime) {
                var perPeriodBudget = 15, ret = [], i, choice, choiceInstance;
                for (i = 0; i < question.items.length; i += 1) {
                    choice = question.items[i];
                    choiceInstance = Y.Wegas.app.dataSources.VariableDescriptor.rest.getDescriptorInstance(choice);
                    ret.push({
                        text: choice.label || choice.name || "undefined",
                        value: {
                            reply: choice,
                            startTime: startTime
                        },
                        disabled: (!choiceInstance.active || this._perPeriodLoad[startTime] + choice.cost  > perPeriodBudget)
                    });
                }
                return ret;
            }
        }, {
            ATTRS : {
                classTxt: {
                    value: "ScheduleDisplay"
                },
                type: {
                    value: "ScheduleDisplay"
                }
            }
        });

    Y.namespace('Wegas').ScheduleDisplay = ScheduleDisplay;
});