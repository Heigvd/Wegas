/*
 * Wegas
 * http://www.albasim.com/wegas/
 *
 * School of Business and Engineering Vaud, http://www.heig-vd.ch/
 * Media Engineering :: Information Technology Managment :: Comem
 *
 * Copyright (C) 2012
 */

/**
 * @author Benjamin Gerber <ger.benjamin@gmail.com>
 */

//YUI.add('wegas-crimesim-choicesRepliesUnreadCount', function (Y) {
//    "use strict";
//
//    /**
//     * Plugin which count replies from choices and adds an unread message
//     * counter to a widget.
//     *
//     * @class Y.Wegas.ChoicesRepliesUnreadCount
//     * @extends Y.Plugin.UnreadCount
//     * @borrows Y.Wegas.Editable
//     */
//    var ChoicesRepliesUnreadCount = Y.Base.create("wegas-crimesim-choicesRepliesUnreadCount", Y.Plugin.UnreadCount, [Y.Wegas.Plugin], {
//        syncUI: function () {
//            ChoicesRepliesUnreadCount.superclass.syncUI.apply(this);
//        },
//        getUnreadCount: function () {
//            var i, j, count = 0, questionInstance, reply,
//                    questions = Y.Wegas.VariableDescriptorFacade.rest.find('name', "evidences").get("items");
//            for (i = 0; i < questions.length; i = i + 1) {
//                questionInstance = questions[i].getInstance();
//                for (j = 0; j < questionInstance.get("replies").length; j = j + 1) {
//                    reply = questionInstance.get("replies")[j];
//                    if (reply.getAttrs() && reply.getAttrs().unread) {
//                        count++;
//                    }
//                }
//            }
//            return count;
//        }
//    }, {
//        NS: "ChoicesRepliesUnreadCount",
//        NAME: "ChoicesRepliesUnreadCount"
//    });
//    Y.namespace('Plugin').ChoicesRepliesUnreadCount = ChoicesRepliesUnreadCount;
//});