/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */

/**
 * @author Benjamin Gerber <ger.benjamin@gmail.com>
 */

YUI.add('wegas-crimesim-choicesrepliesunreadcount', function(Y) {
    "use strict";

    /**
     * Plugin which count replies from choices and adds an unread message
     * counter to a widget.
     *
     * @class Y.Wegas.ChoicesRepliesUnreadCount
     * @extends Y.Plugin.UnreadCount
     * @borrows Y.Wegas.Editable
     */
    var ChoicesRepliesUnreadCount = Y.Base.create("wegas-crimesim-choicesRepliesUnreadCount", Y.Plugin.UnreadCount, [Y.Wegas.Plugin], {
        getUnreadCount: function() {
            var i, j, count = 0, questionInstance, reply,
                    questions = Y.Wegas.Facade.VariableDescriptor.cache.find('name', "evidences");

            if (!questions) {
                return;
            }
            questions = questions.flatten();

            for (i = 0; i < questions.length; i = i + 1) {
                questionInstance = questions[i].getInstance();
                if (questionInstance instanceof Y.Wegas.persistence.QuestionInstance) {
                    for (j = 0; j < questionInstance.get("replies").length; j = j + 1) {
                        reply = questionInstance.get("replies")[j];
                        if (reply.getAttrs() && reply.getAttrs().unread) {
                            count++;
                        }
                    }
                }
            }
            return count;
        }
    }, {
        NS: "ChoicesRepliesUnreadCount",
        NAME: "ChoicesRepliesUnreadCount"
    });
    Y.namespace('Plugin').ChoicesRepliesUnreadCount = ChoicesRepliesUnreadCount;

});