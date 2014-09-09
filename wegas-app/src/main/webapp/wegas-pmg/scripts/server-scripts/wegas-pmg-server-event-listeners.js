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
    var msg = "", root, type;

    root = Variable.findParentList(e.question.getDescriptor());
    root = Variable.findParentList(root);
    
    if (root.name == "actions") {
        type = I18n.t("question.action");
        msg += e.question.getDescriptor().getDescription() + "<br><hr><br>";    // choice description
    } else {
        type = I18n.t("question.question");
        msg += "<b>" + e.choice.getDescriptor().getTitle() + "</b><br>";        // Choice selected
        msg += e.choice.getDescriptor().getDescription() + "<br><hr><br>";      // choice description
    }
    msg += e.reply.getResult().getAnswer();                                     //Reply
    
    PMGHelper.sendHistory(type, e.question.getDescriptor().getTitle(), msg);
});

Event.on("addTaskPlannification", function() {
    PMGSimulation.plannedValueHistory();
});
Event.on("removeTaskPlannification", function() {
    PMGSimulation.plannedValueHistory();
});