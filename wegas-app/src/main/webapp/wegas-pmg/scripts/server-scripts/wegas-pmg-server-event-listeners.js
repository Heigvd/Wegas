/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013, 2014, 2015 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
/**
 * @fileoverview
 * @author Maxence Laurent <maxence.laurent@gmail.com>
 */
/*global println, Event, PMGSimulation, PMGHelper */
Event.on("replyValidate", function(e) {
    "use strict";
    var msg, type = e.choice.getDescriptor().getTitle(),
        replies = e.question.getReplies(), i, result;

    //root = Variable.findParentList(e.question.getDescriptor());
    //root = Variable.findParentList(root);

    // Question 
    msg = "<b>" + e.question.getDescriptor().getTitle() + "</b>";
    msg += e.question.getDescriptor().getDescription() + "<br /><br />";

    // Selected Choice
    if (e.choice.getDescriptor().getTitle() && !e.choice.getDescriptor().getTitle().trim().equals("")) {
        msg += "<b>" + e.choice.getDescriptor().getTitle() + "</b><br>";
        if (!e.choice.getDescriptor().getDescription().trim().equals("")) {
            msg += e.choice.getDescriptor().getDescription() + "<br><br>";
        }
    }

    // result(s)
    if (replies.size() > 1) {
        msg += "<b>" + I18n.t("question.result") + "s</b><br />";
    } else {
        msg += "<b>" + I18n.t("question.result") + "</b><br />";
    }

    msg += '<div class="replies">';
    for (i = replies.size() - 1; i >= 0; i--) {
        msg += '<div class="replyDiv">';
        msg += replies.get(i).getResult().getAnswer();
        msg += "</div>";
    }
    msg += "</div>";

    PMGHelper.sendHistory(type, e.question.getDescriptor().getTitle(), msg);
});

Event.on("addTaskPlannification", function() {
    "use strict";
    PMGSimulation.plannedValueHistory();
});
Event.on("removeTaskPlannification", function() {
    "use strict";
    PMGSimulation.plannedValueHistory();
});