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
/*global Event */

Event.on("replyValidate", function(e) {
    "use strict";
    var msg, type, replies, i, subject,
        hBox = Variable.find(gameModel, "history");

    type = e.choice.getDescriptor().getTitle() || " ";
    subject =  e.question.getDescriptor().getTitle();
    
    replies = e.question.getReplies();

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
        msg += "<b>Results</b><br />";
    } else {
        msg += "<b>Result</b><br />";
    }

    msg += '<div class="replies">';
    for (i = replies.size() - 1; i >= 0; i--) {
        msg += '<div class="replyDiv">';
        msg += replies.get(i).getResult().getAnswer();
        msg += "</div>";
    }
    msg += "</div>";

    hBox.sendMessage(self, type, subject, msg);
});