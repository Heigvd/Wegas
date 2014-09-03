/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
/**
 * @fileoverview
 * @author Yannick Lagger <lagger.yannick@gmail.com>
 */

function sendHistory(from, title, msg, date) {
    Variable.find(gameModel, "history").sendDatedMessage(self, from, date, title, msg);
}

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
    
    sendHistory(type, e.question.getDescriptor().getTitle(), msg, PMGSimulation.getCurrentPeriodFullName());
});