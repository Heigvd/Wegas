/**
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */

YUI.add('wegas-crimesim', function (Y) {
    "use strict";

    var CONTENTBOX = 'contentBox',
        YAHOO = Y.YUI2,
        ScheduleDisplay, Menu;

    Menu = Y.Base.create("scheduledisplay-menu", Y.Widget,                      // Helper to display the menu in a positionable box
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

                this._menu.menu.subscribe("click", this._onMenuClick,           // Listen for the choice menu click event
                    null, this);

                cb.delegate("click", function(e) {                              // Show the question detail on left label click
                    var questionId =  e.target.ancestor("tr").getAttribute("data-questionid");
                    this._syncDetailsPanel(questionId);
                }, "td.schedule-leftcolum", this);

                cb.delegate("click", this._hideDetails,                         // Hide the question detail on close icon click
                    ".schedule-icon-close", this);

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

            _syncSchedule: function () {
                var perPeriodBudget = 15, perPeriodLoad = [], question, cols = [], questionInstance,  reply, i, j, k,
                    questionsVarDesc = Y.Wegas.app.dataSources.VariableDescriptor.rest.getCachedVariablesBy('@class', "MCQVariableDescriptor"),
                    period = Y.Wegas.app.dataSources.VariableDescriptor.rest.getCachedVariableBy('name', "period"),
                    acc = ['<table class="schedule-table"><tr><th class="schedule-leftcolum">Evidences</th>'],
                    cb = this.get(CONTENTBOX).one(".schedule-questions"),
                    periodInstance = Y.Wegas.app.dataSources.VariableDescriptor.rest.getInstanceBy("name", "period");

                if (!period) {
                    return;
                }

                for (i = period.minValue; i <= period.maxValue; i += 1) {
                    acc.push('<th class="schedule-maincolum"><div>' + i + '</div></th>'); // Generate table header
                    perPeriodLoad.push(0);                                      // Default value for perPeriodLoad calculation
                }
                acc.push("</tr>");

                for (i = 0; i < questionsVarDesc.length; i += 1) {                     // Generate table body
                    question = questionsVarDesc[i];
                    questionInstance = Y.Wegas.app.dataSources.VariableDescriptor.rest.getInstanceById(question.id);

                    acc.push('<tr data-questionId="' + question.id + '"><td class="schedule-leftcolum" >' +
                        (question.label || question.name || "undefined") + "</td>");

                    cols = [];
                    questionInstance = Y.Wegas.app.dataSources.VariableDescriptor.rest.getInstanceById(question.id);
                    periodInstance = Y.Wegas.app.dataSources.VariableDescriptor.rest.getInstanceBy("name", "period");

                    for (j = period.minValue; j <= period.maxValue; j += 1) {   // Initially, all time slots are available
                        if (j >= periodInstance.value) {
                            cols.push(["schedule-item", "schedule-available"]);
                        } else {
                            cols.push(["schedule-item"]);
                        }
                    }

                    for (j = 0; j < questionInstance.replies.length; j += 1) {
                        reply = questionInstance.replies[j];
                        perPeriodLoad[reply.startTime - period.minValue] += reply.duration;
                        cols[reply.startTime - period.minValue] = ["schedule-unavailable", "schedule-unavailablestart", "schedule-unavailable-" + reply.duration];
                        for (k = 1; k < reply.duration; k += 1) {
                            cols[reply.startTime + k - period.minValue] = ["schedule-unavailable"];
                        }
                    }

                    for (j = period.minValue; j <= period.maxValue; j += 1) {
                        if (j > periodInstance.value) {
                            cols[j - period.minValue].push("schedule-future");    // Mark cells in the future
                        } else if (j < periodInstance.value) {
                            cols[j - period.minValue].push("schedule-past");      // Mark cells in the past
                        }
                    }

                    for (j = 0; j < cols.length; j += 1) {
                        acc.push('<td data-startTime="' + (period.minValue + j) +
                            '" class="' + cols[j].join(" ") + '"><div><div class="icon"></div></div></td>');
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
                    period = Y.Wegas.app.dataSources.VariableDescriptor.rest.getInstanceBy('name', "period"),
                    questionInstance = Y.Wegas.app.dataSources.VariableDescriptor.rest.getInstanceById(question.id),
                    acc = ['<div class="schedule-icon-close"></div><h1>',
                        question.label || question.name || "undefined",
                        '</h1><div class="content">', question.description, '</div>'];

                this._currentQuestionId = questionId;

                if (questionInstance.replies.length > 0) {
                    acc.push('<h2>Anaylses</h2>');
                }
                for (i = 0; i < questionInstance.replies.length; i += 1) {
                    reply = questionInstance.replies[i];
                    acc.push('<div class="schedule-detail-reply"><h3>Period ',
                        reply.startTime, ': ', reply.name || "undefined",
                        '</h3><div class="content">');
                    if ((reply.startTime + reply.duration) <= period.value) {
                        acc.push(reply.answer);
                    } else if (reply.startTime<=period.value) {
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

            // *** Private Methods *** /
            _onMenuClick: function (e, args) {
                var menuItem = args[1],
                    reply = menuItem.value.reply;

                Y.Wegas.app.dataSources.VariableDescriptor.rest.getRequest("MCQVariable/SelectReply/" + reply.id
                    + "/Player/" + Y.Wegas.app.get('currentPlayer') + "/StartTime/" + menuItem.value.startTime + "/");
            },
            _genMenuItems: function (question, startTime) {
                var ret = [], i, reply;
                for (i = 0; i < question.replies.length; i += 1) {
                    reply = question.replies[i];
                    ret.push({
                        text: reply.label || reply.name || "undefined",
                        value: {
                            reply: reply,
                            startTime: startTime
                        }
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