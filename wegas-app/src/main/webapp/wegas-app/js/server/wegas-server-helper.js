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
                    inboxNameOrCb(message, e);
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
                    inboxNameOrCb(message, e);
                } else {
                    //sendDatedMessage(self, from, date, subject, body)
                    Variable.find(gameModel, inboxNameOrCb).sendMessage(self, message);
                }
            }
        });
    }

    function _getInboxInstanceContent(inboxInstance, inboxName, teamName) {
        var msgs = inboxInstance.getSortedMessages(),
            empty = msgs.length === 0,
            content = '';
        if (empty) {
            content = "<i>(0 messages)</i>";
        } else {
            for (var i = 0; i < msgs.length; i++) {
                var curmsg = msgs[i],
                    subj = curmsg.getSubject() && curmsg.getSubject().translateOrEmpty(self),
                    date = curmsg.getDate() && curmsg.getDate().translateOrEmpty(self),
                    body = curmsg.getBody() && curmsg.getBody().translateOrEmpty(self);
                if (subj && subj.length)
                    content += "<b>" + subj + "</b>&nbsp;&nbsp;";
                if (date && date.length)
                    content += "(" + date + ")";
                if (body && body.length)
                    content += "<br/>&nbsp;<br/>" + body;

                content += '<hr/><br/>';
            }
        }
        return {"title": teamName + ": " + inboxName, "body": content, "empty": empty};
    }


    // Text field presentation function: returns object { title, body, empty }
    function getTextContent(textInstance, textName, teamName) {
        var body = textInstance.getTrValue().translateOrEmpty(self),
            empty = body.length === 0 || !isModifiedText(textInstance, body);
        return {"title": teamName + ": " + textName, "body": body, "empty": empty};
    }


    // Tells if given text instance has been edited, i.e. if it's different from its default value:
    function isModifiedText(textInstance, value) {
        var defVal = textInstance.getDescriptor().getDefaultInstance().getTrValue().translateOrEmpty(self);
        return !value.trim().equals(defVal.trim());
    }

    // JSON view of a Wegas "object" (i.e. a hashmap).
    // Handles nested objects as well, i.e. when the value is a string representation of a JSON object.
    function getObjectContent(objectInstance, objectName, teamName) {
        var list = {},
            props = objectInstance.getProperties(),
            n = 0;
            for (var key in props) {
                try {
                    list[key] = JSON.parse(props[key]);
                } catch(e) {
                    list[key] = props[key];
                }
                n++;
            }
        return {"title": teamName + ": " + objectName, "body": JSON.stringify(list), "empty": n===0};
    }


    return {
        /**
         * historize replyValidate as a message
         * @param {type} inboxNameOrCb either the name of a inboxDescriptor variable or a callback (function(message, whValidate))
         */
        registerWhValidateListener: function(inboxNameOrCb) {
            _registerWhValidateListener(inboxNameOrCb);
        },
        registerReplyValidateListener: function(inboxNameOrCb, config) {
            return _registerReplyValidateListener(inboxNameOrCb, config);
        },
        getInboxInstanceContent: function(inboxInstance, inboxName, teamName) {
            return _getInboxInstanceContent(inboxInstance, inboxName, teamName);
        },
        getTextInstanceContent: function(textInstance, textName, teamName) {
            return getTextContent(textInstance, textName, teamName);
        },
        getObjectInstanceContent: function(objectInstance, objectName, teamName) {
            return getObjectContent(objectInstance, objectName, teamName);
        },
    };
}());

