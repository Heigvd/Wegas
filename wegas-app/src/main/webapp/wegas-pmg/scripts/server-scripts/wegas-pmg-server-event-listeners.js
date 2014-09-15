/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
/**
 * @fileoverview
 * @author Maxence Laurent <maxence.laurent@gmail.com>
 */
Event.on("replyValidate", function(e) {
    var msg, type = e.choice.getDescriptor().getTitle();

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

    // Result:
    msg += "<b>Result</b><br />";
    msg += e.reply.getResult().getAnswer();                                     //Reply

    PMGHelper.sendHistory(type, e.question.getDescriptor().getTitle(), msg);
});

Event.on("addTaskPlannification", function() {
    PMGSimulation.plannedValueHistory();
});
Event.on("removeTaskPlannification", function() {
    PMGSimulation.plannedValueHistory();
});