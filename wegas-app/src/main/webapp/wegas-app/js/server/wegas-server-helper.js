/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2018  School of Business and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
/* global Variable, self, gameModel, Event, Java, com, QuestionFacade, I18n */

/**
 * @fileoverview
 * @author Maxence Laurent <maxence.laurent@gmail.com>
 */

var WegasHelper = (function() {

    function _registerWhValidateListener(inboxNameOrCb) {
        Event.on("whValidate", function(e) {
            "use strict";
            var message = QuestionFacade.buildWhValidateMessage(self, e, I18n);

            if (message) {
                if (typeof inboxNameOrCb === "function") {
                    inboxNameOrCb(message);
                } else {
                    //sendDatedMessage(self, from, date, subject, body)
                    Variable.find(gameModel, inboxNameOrCb).sendMessage(self, message);
                }
            }
        });
    }


    /**
     * 
     * @param {type} inboxNameOrCb
     * @param {type} config {includeHistory: boolean}
     * @returns {undefined}
     */
    function _registerReplyValidateListener(inboxNameOrCb, config) {
        Event.on("replyValidate", function(e) {
            "use strict";
            var message = QuestionFacade.buildReplyValidateMessage(self, e, I18n, config || {});

            if (message) {
                if (typeof inboxNameOrCb === "function") {
                    inboxNameOrCb(message);
                } else {
                    //sendDatedMessage(self, from, date, subject, body)
                    Variable.find(gameModel, inboxNameOrCb).sendMessage(self, message);
                }
            }
        });
    }

    return {
        /**
         * historize replyValidate as a message
         * @param {type} inboxNameOrCb either the name of a inboxDescriptor variable or a callback (function(message))
         */
        registerWhValidateListener: function(inboxNameOrCb) {
            _registerWhValidateListener(inboxNameOrCb);
        },
        registerReplyValidateListener: function(inboxNameOrCb, config) {
            return _registerReplyValidateListener(inboxNameOrCb, config);
        }
    };
}());

