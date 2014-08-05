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
function sendHistory(from, title, msg) {
    Variable.find(gameModel, "history").sendMessage(self, from, title, msg);
}

Event.on("replyValidate", function(e) {
    var msg = "", root, type,
        currentPhase = Variable.find(gameModel, "currentPhase").getValue(self);

    root = Variable.findParentList(e.question.getDescriptor());
    root = Variable.findParentList(root);
    
    if (root.name == "actions") {
        type = "Action";
        msg += e.question.getDescriptor().getDescription() + "<br><hr><br>";    // choice description
    } else {
        type = "Question";
        msg += "<b>" + e.choice.getDescriptor().getTitle() + "</b><br>";        // Choice selected
        msg += e.choice.getDescriptor().getDescription() + "<br><hr><br>";      // choice description
    }
    msg += e.reply.getResult().getAnswer();                                     //Reply
    
    type += " " + currentPhaseName(currentPhase);
    type += " period " + Variable.find(gameModel, "currentPeriod").item(currentPhase -1).getValue(self);

    sendHistory(type, e.question.getDescriptor().getTitle(), msg, []);
});

function currentPhaseName(currentPhase) {
    switch (currentPhase) {
        case 1:
            return "Initiation";
        case 2:
            return "Planning";
        case 3:
            return "Execution";
        case 4:
            return "Closing";
    }
}