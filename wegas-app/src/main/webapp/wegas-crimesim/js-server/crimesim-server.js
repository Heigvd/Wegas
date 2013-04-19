/*
 * Wegas
 * http://www.albasim.ch/wegas/
 *
 * Copyright (c) 2013 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
/**
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */

importPackage(javax.naming);

function EvtTarget() {
    this.evts = {};
}

EvtTarget.prototype = {
    on: function (evt, fn, scope) {
        this.evts[evt] = this.evts[evt] || [];
        this.evts[evt].push({
            fn: fn,
            scope: scope || this
        });
    },
    fire: function (evt, args) {
        var i, evts = this.evts[evt];
        if (evts) {
            for (i = 0; i < evts.length; i += 1) {
                evts[i].fn(args);
            }
        }
    }
};
var eventManager = new EvtTarget();

eventManager.on("replySelect", function(e) {
    if (e.reply.startTime - period.value === -1) {
        humanResources.value -= e.reply.result.choiceDescriptor.cost;
    }
});

eventManager.on("replyCancel", function (e) {
    if (e.reply.startTime - period.value === -1) {
        humanResources.value += +e.reply.result.choiceDescriptor.cost;
    }
});

function lookupBean(name) {
    var ctx = new InitialContext();
    return ctx.lookup("java:module/" + name);
}
/*eventManager.on("replyValidate", function(e) {
    println("replyValidate"+ e.reply);
});*/

function nextWeek() {
    period.value += 1;

    var qdf = lookupBean("QuestionDescriptorFacade");

    humanResources.value = humanResources.descriptor.defaultInstance.value;

    var walkDescriptor = function (descriptor) {
        var desc, questionInstance;
        for (var i = 0; i < descriptor.items.size(); i += 1) {
            var desc = descriptor.items.get(i);

            if (desc instanceof com.wegas.mcq.persistence.QuestionDescriptor) {
                questionInstance = desc.getInstance(self);
                for (var j = 0; j< questionInstance.replies.size(); j += 1) {
                    var reply = questionInstance.replies.get(j);
                    if (+reply.startTime + +reply.result.choiceDescriptor.duration + 1 === period.value) {
                        reply.setUnread(true);
                        qdf.validateReply(self, reply);
                    }

                    if (+reply.startTime + 1  === +period.value ) {
                        humanResources.value -= reply.result.choiceDescriptor.cost;
                    }
                }
            } else  if (desc instanceof com.wegas.core.persistence.variable.ListDescriptor) {
                walkDescriptor(desc);
            }
        }
    };
    walkDescriptor(evidences.descriptor);
}
