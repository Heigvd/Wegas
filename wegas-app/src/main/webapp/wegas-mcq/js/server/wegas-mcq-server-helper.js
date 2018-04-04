/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2018  School of Business and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
/* global Variable, self, gameModel, Event, Java, com */

/**
 * @fileoverview
 * @author Maxence Laurent <maxence.laurent@gmail.com>
 */

var MCQHelper = (function() {

    function _registerWhListener(inboxNameOrCb) {
        Event.on("whValidate", function(e) {
            "use strict";
            var whDescriptor = e.whDescriptor,
                whInstance = e.whInstance,
                values, v,
                items, i, item, whTitle, title,
                msg;

            whTitle = whDescriptor.getLabel();

            msg = "<b>" + whTitle + "</b>";
            msg += whDescriptor.getDescription() + "<br /><br />";

            msg += '<div class="whview-history-answers">';
            items = Java.from(whDescriptor.getItems());
            for (i in items) {
                msg += '<div class="whview-history-answer" style="margin-bottom: 10px;">';
                item = items[i];
                title = item.getLabel();
                msg += "<span class=\"whview-history-answer-title\"><b>" + title + "</b></span>";
                if (item instanceof com.wegas.core.persistence.variable.primitive.StringDescriptor &&
                    !item.getAllowedValues().isEmpty()) {
                    values = JSON.parse(item.getValue(self));
                    for (v in values) {
                        msg += "<div class=\"whview-history-answer-value\" style=\"margin-left : 10px;\">" + values[v] + "</div>";
                    }

                } else {
                    msg += "<div class=\"whview-history-answer-value\" style=\"margin-left : 10px;\">" + item.getValue(self) + "</div>";
                }
                msg += "</div>";
            }

            msg += "</div>";

            if (typeof inboxNameOrCb === "function") {
                inboxNameOrCb(whTitle, msg);
            } else {
                //sendDatedMessage(self, from, date, subject, body)
                Variable.find(gameModel, inboxNameOrCb).sendMessage(self, "", whTitle, msg);
            }
        });
    }

    return {
        registerWhListener: function(inboxNameOrCb) {
            return _registerWhListener(inboxNameOrCb);
        }
    };
}());

