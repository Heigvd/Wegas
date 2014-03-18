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

importPackage(javax.naming);

Event.on("replySelect", function(e) {
    if (e.reply.startTime - period.value === -1) {
        humanResources.value -= e.reply.result.choiceDescriptor.cost;
    }
});

Event.on("replyCancel", function(e) {
    if (e.reply.startTime - period.value === -1) {
        humanResources.value += +e.reply.result.choiceDescriptor.cost;
    }
});
function lookupBean(name) {
    var ctx = new InitialContext();
    return ctx.lookup("java:module/" + name);
}

function nextWeek() {
    period.value += 1;

    var qdf = lookupBean("QuestionDescriptorFacade");

    humanResources.value = humanResources.descriptor.defaultInstance.value;

    var walkDescriptor = function(descriptor) {
        var desc, questionInstance;
        for (var i = 0; i < descriptor.items.size(); i += 1) {
            var desc = descriptor.items.get(i);

            if (desc instanceof com.wegas.mcq.persistence.QuestionDescriptor) {
                questionInstance = desc.getInstance(self);
                for (var j = 0; j < questionInstance.replies.size(); j += 1) {
                    var reply = questionInstance.replies.get(j);
                    if (+reply.startTime + +reply.result.choiceDescriptor.duration + 1 === period.value) {
                        reply.setUnread(true);
                        qdf.validateReply(self, reply);
                    }

                    if (+reply.startTime + 1 === +period.value) {
                        humanResources.value -= reply.result.choiceDescriptor.cost;
                    }
                }
            } else if (desc instanceof com.wegas.core.persistence.variable.ListDescriptor) {
                walkDescriptor(desc);
            }
        }
    };
    walkDescriptor(evidences.descriptor);
}
