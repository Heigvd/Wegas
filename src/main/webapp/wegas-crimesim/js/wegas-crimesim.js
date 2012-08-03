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

YUI.add('wegas-crimesim', function (Y) {
    "use strict";

    var CONTENTBOX = 'contentBox',
    ScheduleDisplay;

    /**
     *  The schedule display class.
     */
    ScheduleDisplay = Y.Base.create("wegas-crimesim-scheduledisplay", Y.Widget,
        [Y.WidgetChild, Y.Wegas.Widget], {

            CONTENT_TEMPLATE: '<div><div class="schedule-questions"></div><div class="schedule-detail"></div></div>',

            // *** Fields *** /
            menu: null,

            // *** Lifecycle Methods *** //
            renderUI: function () {
                this.menu = new Y.Wegas.Menu();
            },

            bindUI: function () {
                var cb = this.get(CONTENTBOX);

                cb.delegate("click", function (e) {                             // Show the available menu options on cell click
                    var questionId =  e.target.ancestor( "tr" ).getAttribute( "data-questionid" ),
                    startTime = e.target.ancestor( "td" ).getAttribute( "data-startTime" ) * 1,
                    question = Y.Wegas.VariableDescriptorFacade.rest.findById( questionId );

                    this.menu.removeAll();                                      // Populate the menu
                    this.menu.add( this.genMenuItems( question, startTime ) );
                    this.menu.attachTo( e.target );                             // Display the menu button next to the arrow
                }, ".schedule-available .icon", this);

                this.menu.on( "button:click", this.onMenuClick, this );         // Listen for the choice menu click event

                cb.delegate("click", function (e) {                             // Show the question detail on left label click
                    var questionId = e.target.ancestor("tr").getAttribute("data-questionid");
                    this.syncDetailsPanel(questionId);
                }, "td.schedule-leftcolum", this);

                cb.delegate("click", this.hideDetails,                         // Hide the question detail on close icon click
                    ".schedule-icon-close", this);

                cb.delegate("click", this.onCancelReplyClick,                   // Hide the question detail on close icon click
                    ".icon .close-icon", this);

                Y.Wegas.app.dataSources.VariableDescriptor.after("response",    // If data changes, refresh
                    this.syncUI, this);

                Y.Wegas.app.after('currentPlayerChange', this.syncUI, this);    // If current user changes, refresh (editor only)

            },

            syncUI: function () {
                this.syncSchedule();
                if ( this.currentQuestionId ) {
                    this.syncDetailsPanel( this.currentQuestionId );
                }
            },

            // *** Rendering methods *** //
            syncSchedule: function () {
                var perPeriodBudget = 15, perPeriodLoad = [], cIndex, choiceDescriptor, choiceInstance,
                questionInstance,  reply, i, j, k, question, cols, replies, names,
                questionsVarDesc = Y.Wegas.VariableDescriptorFacade.rest.find('name', "evidences").get("items"),
                questionInstances = [],
                period = Y.Wegas.VariableDescriptorFacade.rest.find('name', "period"),
                periodInstance = period.getInstance(),
                maxValue = period.get("maxValue"),
                totalPeriods = period.get("maxValue") - period.get("minValue"),
                acc = [ '<table class="schedule-table"><tr><th class="schedule-leftcolum">Evidences</th>' ],
                cb = this.get(CONTENTBOX).one(".schedule-questions"),
                currentTime = periodInstance.get( "value" ) - period.get( "minValue" );

                this._perPeriodLoad = perPeriodLoad;

                if (!period) {
                    cb.setContent("No time variable is set.");
                    return;
                }

                for (i = period.get("minValue"); i <= maxValue; i += 1) {
                    acc.push('<th class="schedule-maincolum"><div>' + i + '</div></th>'); // Generate table header
                    perPeriodLoad.push(0);                                      // Default value for perPeriodLoad calculation
                }
                acc.push("</tr>");

                for (i = 0; i < questionsVarDesc.length; i += 1) {              // First pass to compute remaining time budget per period
                    question = questionsVarDesc[i];
                    questionInstance = question.getInstance();
                    for (j = 0; j < questionInstance.get("replies").length; j += 1) {
                        reply = questionInstance.get("replies")[j];
                        choiceDescriptor = reply.getChoiceDescriptor();
                        perPeriodLoad[reply.get("startTime")] += choiceDescriptor.get("cost");
                    }
                    questionInstances.push(questionInstance);
                }

                for (i = 0; i < questionsVarDesc.length; i += 1) {              // Generate table body
                    question = questionsVarDesc[i];
                    questionInstance = questionInstances[i];

                    if (!questionInstance.get("active")) {                      // Do not render inactive questions
                        continue;
                    }

                    acc.push('<tr data-questionId="' + question.get("id") + '"><td class="schedule-leftcolum" >' +
                        (question.get("label") || question.get("name") || "undefined") + "</td>");
                    cols = [];
                    names = [];
                    replies = [];

                    for (j = 0; j <= totalPeriods; j += 1) {                    // Initially, all time slots are available
                        if (j >= currentTime) {
                            cols.push(["schedule-item", "schedule-available"]);
                        } else {
                            cols.push(["schedule-item"]);
                        }
                        replies.push(null);
                        names.push("");
                    }

                    for (j = 0; j < questionInstance.get("replies").length; j += 1) {
                        reply = questionInstance.get("replies")[j];
                        cIndex = reply.get("startTime");
                        choiceDescriptor = reply.getChoiceDescriptor(),
                        choiceInstance = choiceDescriptor.getInstance();

                        cols[cIndex] = ["schedule-unavailable", "schedule-task",
                        "schedule-unavailable-" + choiceDescriptor.get("duration")];

                        if (currentTime >= reply.get("startTime") && currentTime < reply.get("startTime") + choiceDescriptor.get("duration")) {
                            cols[cIndex].push("schedule-ongoingtask");
                        }

                        names[cIndex] = choiceDescriptor.get("name");
                        replies[cIndex] = reply;

                        for (k = 1; k < choiceDescriptor.get("duration"); k += 1) {
                            cols[cIndex + k] = ["schedule-unavailable"];
                        }

                        cols[cIndex].push((choiceInstance.get("active")) ? "schedule-active" : "schedule-inactive");
                    }

                    for (j = 0; j <= totalPeriods; j += 1) {
                        if (j > currentTime) {
                            cols[j].push("schedule-future");                    // Mark cells in the future
                        } else if (j < currentTime) {
                            cols[j].push("schedule-past");                      // Mark cells in the past
                        } else {
                            cols[j].push("schedule-present");                   // Mark cells in the past
                        }
                    }

                    for (j = 0; j < cols.length; j += 1) {
                        acc.push('<td data-startTime="' + j +
                            '" class="' + cols[j].join(" ") + '"><div><div class="icon" data-replyid="' +
                            ((replies[j]) ? replies[j].get("id") : '') + '">' +
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

            currentQuestionId: null,

            syncDetailsPanel: function (questionId) {
                var i, reply, choiceDescriptor, status,
                targetNode = this.get(CONTENTBOX).one(".schedule-detail"),
                question = Y.Wegas.VariableDescriptorFacade.rest.findById(questionId),
                questionInstance = question.getInstance(),
                periodDesc = Y.Wegas.VariableDescriptorFacade.rest.find('name', "period"),
                period = periodDesc.getInstance(),
                currentTime = period.get("value") - periodDesc.get("minValue"),
                acc = ['<div class="schedule-icon-close"></div><h1>',
                question.get("label") || question.get("name") || "undefined",
                '</h1><div class="content">',
                question.get("description") || "<em>No description</em>",
                '<div class="schedule-gallery"></div>',
                '</div>'];

                this.currentQuestionId = questionId;

                acc.push('<h2>Anaylses</h2>');
                if (questionInstance.get("replies").length === 0) {
                    acc.push('<div class="content"><em>No analyses planified</em></div>');
                }

                for (i = 0; i < questionInstance.get("replies").length; i += 1) {
                    reply = questionInstance.get("replies")[i];
                    choiceDescriptor = reply.getChoiceDescriptor();
                    status = reply.getStatus( currentTime );

                    acc.push('<div class="schedule-detail-reply"><h3>Period ',
                        currentTime + 1 , ': ', choiceDescriptor.get("name") || "undefined",
                        '</h3><div class="content">');

                    if (status === 0) {
                        acc.push(choiceDescriptor.answer);
                    } else if (status === 1) {
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

                // @todo @cyril Render gallery widget here
                targetNode.one(".schedule-gallery").setContent("Here is the gallery.");
            },
            hideDetails: function () {
                this.get(CONTENTBOX).one(".schedule-detail").setStyles({
                    position: 'display',
                    display: "none"
                });
                this.currentQuestionId = null;
            },

            // *** Events Methods *** /

            onCancelReplyClick: function(e, args) {
                var replyId =  e.target.ancestor(".icon").getAttribute("data-replyid");

                Y.Wegas.VariableDescriptorFacade.rest.sendRequest({
                    request: "/QuestionDescriptor/CancelReply/" + replyId
                });
            },
            onMenuClick: function (e) {
                var data = e.target.get( "entity" );

                Y.Wegas.VariableDescriptorFacade.rest.sendRequest({
                    request: "/QuestionDescriptor/SelectChoice/" + data.choice.get("id")
                    + "/Player/" + Y.Wegas.app.get('currentPlayer') + "/StartTime/" + data.startTime + "/"
                });
            },
            /**
            * Return a list of possible actions on a given action at a given time.
            */
            genMenuItems: function ( question, startTime ) {
                var perPeriodBudget = 15, ret = [], i, j, disabled, choice, choiceInstance;
                for ( i = 0; i < question.get("items").length; i += 1 ) {
                    choice = question.get("items")[i];
                    choiceInstance = choice.getInstance();

                    disabled = !choiceInstance.get("active") ||                 // Check if the choice is active
                    this._perPeriodLoad[startTime] + choice.get("cost")         // and if we have enough resources
                    > perPeriodBudget;

                    for ( j = 0; j < choice.get( "duration" ); j = j + 1 ) {
                        disabled = disabled                                     // finally we check if there is no other task assigned for this timeslot
                        || question.getRepliesByStartTime( startTime + j ).length > 0;
                    }
                    //this._perPeriodLoad[]
                    ret.push({
                        type: "Button",
                        label: choice.get( "label" ) || choice.get( "name" ) || "undefined",
                        entity: {
                            choice: choice,
                            startTime: startTime
                        },
                        disabled: disabled
                    });
                }
                return ret;
            }
        });

    Y.namespace('Wegas').ScheduleDisplay = ScheduleDisplay;
});