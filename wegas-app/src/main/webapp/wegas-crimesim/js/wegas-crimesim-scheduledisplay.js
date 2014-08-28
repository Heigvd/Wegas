/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
/**
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
YUI.add('wegas-crimesim-scheduledisplay', function(Y) {
    "use strict";

    var CONTENTBOX = 'contentBox', ScheduleDisplay;

    /**
     *  The schedule display class.
     */
    ScheduleDisplay = Y.Base.create("wegas-crimesim-scheduledisplay", Y.Widget, [Y.Wegas.Widget, Y.WidgetChild, Y.Wegas.Editable], {
        CONTENT_TEMPLATE: '<div><div class="schedule-questions"></div>'
                + '<div class="schedule-detail"><div class="schedule-icon-close"></div><h1></h1><div class="content"></div>'
                + '<div class="schedule-gallery"></div><h2>Anaylses</h2><div class="schedule-analysis"></div>'
                + '</div></div>',
        // *** Fields *** /
        currentQuestionId: null,
        // *** Lifecycle Methods *** //
        initializer: function() {
            this.data = [];
            this.handlers = {};
            this.translator = new Y.Wegas.Translator();
        },
        renderUI: function() {
            this.menu = new Y.Wegas.Menu();
            this.menuDetails = new Y.Wegas.Menu({
                width: "250px"
            });

            this.renderDetailsPanel(this.get(CONTENTBOX).one(".schedule-analysis"));

            this.gallery = new Y.Wegas.util.FileLibraryGallery({
                selectedHeight: 150,
                selectedWidth: 235
            }).render(this.get(CONTENTBOX).one(".schedule-gallery"));
        },
        bindUI: function() {
            var cb = this.get(CONTENTBOX);

            // cb.on("clickoutside", this.hideMenu, this);

            this.menu.on("button:mouseenter", function(e) {                     // Display tooltip on menu mouse over
                if (!ScheduleDisplay.EXTENDEDQUESTIONS) {
                    return;                                                     // @fixme @hack
                }
                var choice = e.target.get("data").choice,
                        extendedChoice = ScheduleDisplay.EXTENDEDQUESTIONS.find(choice.get("id"));

                this.menuDetails.set("align", {
                    node: this.menu.get("boundingBox"),
                    points: (e.details[0].domEvent.clientX > Y.DOM.winWidth() / 2) ? ["tr", "tl"] : ["tl", "tr"]
                });
                this.menuDetails.get("contentBox").setHTML('<div style="padding:5px 10px">'
                        //+ (choice.get("description") || "<em>" + this.translator.getRB().No_description + "</em>")// Removed cause description is dynamic
                        + (extendedChoice.get("description") || "<em>" + this.translator.getRB().No_description + "</em>")// Removed cause description is dynamic
                        + "<br /><br />" + this.translator.getRB().Human_resources_needed + ": " + choice.get("cost")
                        + "<br />" + this.translator.getRB().Duration + ": " + choice.get("duration")
                        + '</div>');
                this.menuDetails.show();
            }, this);

            this.menu.on("visibleChange", function(e) {                         // When the menu is hidden, hide the details panel
                if (!e.newVal) {
                    this.menuDetails.hide();
                }
            }, this);

            this.menu.on("button:click", this.onMenuClick, this);               // Listen for the choice menu click event

            cb.delegate("click", function(e) {                                  // Show the available menu options on cell click
                var questionId = e.target.ancestor("tr").getAttribute("data-questionid"),
                        startTime = +e.target.ancestor("td").getAttribute("data-startTime"),
                        question = Y.Wegas.Facade.Variable.cache.findById(questionId);

                this.menu.destroyAll();
                this.menu.add(this.genMenuItems(question, startTime));          // Populate the menu
                this.menu.attachTo(e.target);                                   // Display the menu button next to the arrow
            }, ".schedule-available .icon", this);

            cb.delegate("click", this.onCancelReplyClick, ".icon .close-icon", this);// Cancel question on close icon click

            cb.delegate("click", function(e) {                                  // Show the question details on left label click
                var questionId = e.target.ancestor("tr").getAttribute("data-questionid");
                this.currentQuestionId = +questionId;
                this.get("contentBox").all(".schedule-leftcolum-selected").removeClass("schedule-leftcolum-selected");
                e.target.addClass("schedule-leftcolum-selected");
                this.syncDetailsPanel();
            }, "td.schedule-leftcolum", this);

            cb.delegate("click", this.hideDetails, ".schedule-icon-close", this);// Hide the question details on close icon click

            this.handlers.response = // If data changes, refresh
                    Y.Wegas.Facade.Variable.after("update", this.syncUI, this);
        },
        /**
         *
         */
        syncUI: function() {
            var cb = this.get(CONTENTBOX).one(".schedule-questions"),
                    evidences = Y.Wegas.Facade.Variable.cache.find('name', "evidences");

            if (!this.get("timeVariable")) {
                cb.setContent("Unable to find time variable.");
                return;
            }
            if (!evidences) {
                cb.setContent("Unable to find evidences variable.");
                return;
            }

            this.syncSchedule();

            Y.Wegas.Facade.Variable.cache.getWithView(evidences, "Extended", {// Retrieve the question/choice description from the server
                on: {
                    success: Y.bind(function(e) {
                        ScheduleDisplay.EXTENDEDQUESTIONS = e.response.entity;
                        if (this.currentQuestionId) {
                            this.syncDetailsPanel();
                        }
                        this.hideOverlay();
                        this.datatable.syncUI();
                    }, this),
                    failure: Y.bind(function(e) {
                        this.hideOverlay();
                    }, this)
                }});
        },
        /**
         *
         */
        destructor: function() {
            var i;
            this.menu.destroy();
            this.menuDetails.destroy();
            this.gallery.destroy();
            this.datatable.destroy();
            for (i in this.handlers) {
                this.handlers[i].detach();
            }
        },
        // *** Rendering methods *** //
        syncSchedule: function() {
            var perPeriodLoad = [], cIndex, choiceDescriptor, choiceInstance,
                    questionInstance, reply, i, j, k, question, cols, replies, names,
                    questionsVarDesc = Y.Wegas.Facade.Variable.cache.find('name', "evidences").flatten(),
                    questionInstances = [],
                    period = this.get("timeVariable"),
                    maxValue = period.get("maxValue"),
                    totalPeriods = period.get("maxValue") - period.get("minValue"),
                    acc = ['<table class="schedule-table"><tr><th class="schedule-leftcolum">' + this.translator.getRB().Evidence + '</th>'],
                    cb = this.get(CONTENTBOX).one(".schedule-questions"),
                    currentTime = period.get("value") - period.get("minValue");

            this.currentTime = currentTime;
            this.perPeriodLoad = perPeriodLoad;

            if (!period) {
                cb.setContent("No time variable is set.");
                return;
            }

            for (i = period.get("minValue"); i <= maxValue; i += 1) {
                acc.push('<th class="schedule-maincolum"><div>' + i + '</div></th>'); // Generate table header
                perPeriodLoad.push(0);                                          // Default value for perPeriodLoad calculation
            }
            acc.push("</tr>");

            for (i = 0; i < questionsVarDesc.length; i += 1) {                  // First pass to compute remaining time budget per period
                question = questionsVarDesc[i];
                questionInstance = question.getInstance();
                for (j = 0; j < questionInstance.get("replies").length; j += 1) {
                    reply = questionInstance.get("replies")[j];
                    choiceDescriptor = reply.getChoiceDescriptor();
                    perPeriodLoad[reply.get("startTime")] += choiceDescriptor.get("cost");
                }
                questionInstances.push(questionInstance);
            }

            for (i = 0; i < questionsVarDesc.length; i += 1) {                  // Generate table body
                question = questionsVarDesc[i];
                questionInstance = questionInstances[i];

                if (!questionInstance.get("active")) {                          // Do not render inactive questions
                    continue;
                }

                acc.push('<tr data-questionId="', question.get("id"), '"><td class="schedule-leftcolum',
                        (question.get("id") === this.currentQuestionId) ? " schedule-leftcolum-selected" : "",
                        '" >', question.get("title") || "undefined", "</td>");
                cols = [];
                names = [];
                replies = [];

                for (j = 0; j <= totalPeriods; j += 1) {                        // Initially, all time slots are available
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
                    choiceDescriptor = reply.getChoiceDescriptor();
                    choiceInstance = choiceDescriptor.getInstance();

                    cols[cIndex] = ["schedule-unavailable", "schedule-task",
                        "schedule-unavailable-" + choiceDescriptor.get("duration")];

                    if (currentTime >= reply.get("startTime")
                            && currentTime < reply.get("startTime") + choiceDescriptor.get("duration")) {
                        cols[cIndex].push("schedule-ongoingtask");
                    }

                    names[cIndex] = choiceDescriptor.get("title");
                    replies[cIndex] = reply;

                    for (k = 1; k < choiceDescriptor.get("duration"); k += 1) {
                        cols[cIndex + k] = ["schedule-unavailable"];
                    }

                    cols[cIndex].push((choiceInstance.get("active")) ? "schedule-active" : "schedule-inactive");
                }

                for (j = 0; j <= totalPeriods; j += 1) {
                    if (j > currentTime) {
                        cols[j].push("schedule-future");                        // Mark cells in the future
                    } else if (j < currentTime) {
                        cols[j].push("schedule-past");                          // Mark cells in the past
                    } else {
                        cols[j].push("schedule-present");                       // Mark cells in the past
                    }
                }

                for (j = 0; j < cols.length; j += 1) {                          // Render each cell
                    acc.push('<td data-startTime="', j,
                            '" class="', cols[j].join(" "), '"><div>');
                    if (replies[j]) {
                        acc.push('<div ' +
                                ' class="icon wegas-tooltip-trigger" title="', // Tooltip
                                escape(this.renderDetails(replies[j])), '"',
                                ' data-replyid="', replies[j].get("id"), '">', names[j],
                                '<div class="close-icon"></div></div>');
                    } else {
                        acc.push('<div class="icon"> <div class="close-icon"></div></div>');
                    }
                    acc.push('</div></td>');
                }
                acc.push("</tr>");
            }

            acc.push('<tfoot><tr>', // Generate table footer
                    //'<td class="schedule-leftcolum">Available human resources</td>');
                    '<td class="schedule-leftcolum">' + this.translator.getRB().Total_human_resources + '</td>');

            for (i = 0; i < perPeriodLoad.length; i += 1) {
                //acc.push('<td>' + (perPeriodBudget - perPeriodLoad[i]) + '/' + perPeriodBudget + '</td>');
                acc.push('<td>' + perPeriodLoad[i] + '</td>');
            }
            acc.push("</tr></tfoot></table>");

            if (cb) {
                cb.set("innerHTML", acc.join(""));                                  // Update ContentBox
            }
        },
        renderDetailsPanel: function(node) {
            var columns = [{
                    key: "id", //evidence id
                    className: "hidden"
                }, {
                    //sortable: true, don't sort with treeble
                    key: "startTime",
                    //className: 'hidden',
                    label: this.translator.getRB().Period,
                    className: "period"
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
                    label: this.translator.getRB().File,
                    allowHTML: true,
                    emptyCellValue: this.translator.getRB().NoFiles
                }];
            this.datatable = new Y.Wegas.CrimeSimTreeble({
                columns: columns,
                isTreeble: true,
                node: node,
                descriptionColumn: "analyis"
            });
            this.datatable.render(this.get(CONTENTBOX).one(".schedule-analysis"));
        },
        syncDetailsPanel: function() {
            if (!ScheduleDisplay.EXTENDEDQUESTIONS) {   // sync will be sent on reply received
                return;
            }
            var i, k, reply, status, replyData, cb = this.get(CONTENTBOX),
                    question = Y.Wegas.Facade.Variable.cache.findById(this.currentQuestionId),
                    questionInstance = question.getInstance(), topValue, maxWidth,
                    extendedQuestion = ScheduleDisplay.EXTENDEDQUESTIONS.find(this.currentQuestionId);
            this.data.length = 0;

            cb.one("h1").setContent(question.get("title") || "undefined");
            cb.one(".content").setContent(extendedQuestion.get("description") || "<em>" + this.translator.getRB().No_description + "</em>");

            while (this.datatable.datatable.getRow(0)) {
                this.datatable.datatable.removeRow(0);
            }

            for (i = 0; i < questionInstance.get("replies").length; i += 1) {
                reply = questionInstance.get("replies")[i];
                replyData = Y.mix(reply.getAttrs(), reply.get("result").getAttrs());
                replyData.choiceDescriptorId = reply.get('result').get('choiceDescriptorId');
                status = reply.getStatus(this.currentTime);

                if (status === 1) {
                    replyData.answer = this.translator.getRB().Analysis_in_progress;
                } else if (status === 2) {
                    replyData.answer = this.translator.getRB().Analysis_planified;
                } else {
                    replyData.fileLinks = "";
                    for (k = 0; k < replyData.files.length; k = k + 1) {
                        replyData.fileLinks += '<a target="_blank" href="' +
                                Y.Wegas.Facade.File.getPath() + replyData.files[k] + '">' +
                                Y.Wegas.Helper.getFilename(replyData.files[k]) + '</a><br />';
                    }
                    if (!replyData.fileLinks) {
                        delete replyData.fileLinks;
                    }
                }
                replyData.analyis = reply.getChoiceDescriptor().get("title");
                replyData.startTime = replyData.startTime + 1;
                this.data.push(replyData);
            }
            this.data.reverse();
            this.datatable.syncUI(this.data);

            //Set width and Y position of the ".schedule-detail".
            topValue = cb.one(".schedule-leftcolum-selected").getDOMNode().getBoundingClientRect().top - cb.one(".schedule-leftcolum-selected").ancestor("table").getDOMNode().getBoundingClientRect().top;
            if (topValue > cb.one(".schedule-leftcolum-selected").ancestor("table").getDOMNode().getBoundingClientRect().height - cb.one(".schedule-detail").getDOMNode().getBoundingClientRect().height) {
                topValue = cb.one(".schedule-leftcolum-selected").ancestor("table").getDOMNode().getBoundingClientRect().height - cb.one(".schedule-detail").getDOMNode().getBoundingClientRect().height;
            }
            maxWidth = cb.one(".schedule-item").getDOMNode().getBoundingClientRect().width * this.get("timeVariable").get("maxValue");
            cb.one(".schedule-detail").setStyles({
                position: 'display',
                display: "block",
                overflowX: "auto",
                top: topValue,
                width: maxWidth
            }, this);

            /* gallery : [{srcUrl:'url', description:'text'},{}, ...]*/
            this.gallery.set("gallery", Y.clone(extendedQuestion.get("pictures")));     // @hack clone since Gallery will replace the string by an object
        },
        renderDetails: function(reply) {
            var choiceDescriptor = reply.getChoiceDescriptor(),
                    status = reply.getStatus(this.currentTime),
                    ret = ['<div class="schedule-detail-reply"><h3>Period ',
                        reply.get("startTime") + 1, ': ', choiceDescriptor.get("title") || "undefined",
                        '</h3><div class="content">'];

            if (status === 0) {
                ret.push(reply.get("result").get("answer"));
            } else if (status === 1) {
                ret.push(this.translator.getRB().Analysis_in_progress);
            } else {
                ret.push(this.translator.getRB().Analysis_planified);
            }
            ret.push("</div>");
            return ret.join("");
        },
        hideDetails: function() {
            var cb = this.get(CONTENTBOX);
            cb.one(".schedule-detail").setStyles({
                position: 'display',
                display: "none"
            });
            cb.all(".schedule-leftcolum-selected").removeClass("schedule-leftcolum-selected");
            this.currentQuestionId = null;
        },
        // *** Events Methods *** /

        onCancelReplyClick: function(e, args) {
            var replyId = e.target.ancestor(".icon").getAttribute("data-replyid");

            this.showOverlay();
            Y.Wegas.Facade.Variable.sendRequest({
                request: "/QuestionDescriptor/CancelReply/" + replyId + "/Player/" + Y.Wegas.Facade.Game.get('currentPlayerId'),
                on: {failure: Y.bind(function(e) {
                        this.hideOverlay();
                    }, this)
                }});
        },
        onMenuClick: function(e) {
            if (e.target.get("disabled")) {                                     // Prevent click on disabled buttons
                return;
            }
            var data = e.target.get("data");

            this.showOverlay();
            Y.Wegas.Facade.Variable.sendRequest({
                request: "/QuestionDescriptor/SelectChoice/" + data.choice.get("id")
                        + "/Player/" + Y.Wegas.Facade.Game.get('currentPlayerId') + "/StartTime/" + data.startTime + "/",
                on: {failure: Y.bind(function(e) {
                        this.hideOverlay();
                    }, this)
                }});
        },
        /**
         * Return a list of possible actions on a given action at a given time.
         */
        genMenuItems: function(question, startTime) {
            var ret = [], i, j, disabled, choice, choiceInstance, perPeriodBudget

            if (startTime + 1 === this.get("timeVariable").get("value")) {      // If the clicked cell is in current period,
                perPeriodBudget = this.get("resourceVariable").get("value");    // use current resource variable value has a limit
            } else {                                                            // Otherwise, use variable default value
                perPeriodBudget = this.get("resourceVariable").get("defaultValue") - this.perPeriodLoad[startTime];
            }

            for (i = 0; i < question.get("items").length; i += 1) {
                choice = question.get("items")[i];
                choiceInstance = choice.getInstance();

                if (!choiceInstance.get("active")) {                            // Check if the choice is active
                    continue;
                }

                disabled = choice.get("cost") > perPeriodBudget;                // and if we have enough resources

                for (j = 0; j < choice.get("duration"); j = j + 1) {
                    disabled = disabled                                         // finally we check if there is no other task assigned for this timeslot
                            || question.getRepliesByStartTime(startTime + j).length > 0;
                }
                ret.push({
                    type: "Button",
                    label: '<span ' +
                            //'class="wegas-tooltip-trigger" title="' +
                            //escape( choice.get("description")) + '"' +
                            '>' + (choice.get("title") || "undefined") + "</span>",
                    data: {
                        choice: choice,
                        startTime: startTime
                    },
                    disabled: disabled
                });
            }
            return ret;
        }
    }, {
        EXTENDEDQUESTIONS: null,
        ATTRS: {
            timeVariable: {
                getter: function() {
                    return Y.Wegas.Facade.Variable.cache.find("name", "period");
                }
            },
            resourceVariable: {
                getter: function() {
                    return Y.Wegas.Facade.Variable.cache.find("name", "humanResources");
                }
            }

        }
    });
    Y.Wegas.ScheduleDisplay = ScheduleDisplay;
});
