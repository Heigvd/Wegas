
/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013, 2014, 2015 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
/**
 * @fileoverview
 * @author Maxence Laurent <maxence.laurent> <gmail.com>
 */
/*global YUI*/

YUI.add("wegas-i18n-global-en", function(Y) {
    Y.Wegas.I18n.register("wegas-i18n-global", "en", {
        wegas: {
            player: "player",
            team: "team"
        },
        global: {
            and: "and",
            description: "description",
            details: "details",
            delete: "delete",
            dunno: "I don't know",
            variableNotFound: "Unable to found \"{{name}}\" variable",
            logout: "logout"
        },
        errors: {
            conflict: "Your request could not be completed due to a conflict. This usually means you tried to update an outdated element.",
            greaterThan: "{{value}} is greater greater than {{max}}",
            lessThan: "{{value}} is less than {{min}}",
            limitReached: "You cannot select more than {{num}} values",
            prohibited: "\"{{value}}\" not allowed. It must be one of these: {{values}}",
            nan: "\"{{value}}\" is not a number",
            notAPositiveInteger: "\"{{value}}\" is not a positive integer",
            outOfBounds: "{{value}} not in [{{min}},{{max}}]"
        },
        inbox: {
            deleteEmailConfirmation: "The e-mail {{subject}} will be permanently deleted. Continue?",
            noMessages: "You have no messages",
            noMessageSelected: "Select an item on the left"
        }
    });
});

