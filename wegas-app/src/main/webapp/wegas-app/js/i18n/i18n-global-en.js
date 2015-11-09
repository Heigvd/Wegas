
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
        global: {
            and: "and",
            description: "description",
            details: "details",
            delete: "delete",
            variableNotFound: "Unable to found \"{{name}}\" variable",
            logout: "logout"
        },
        errors: {
            notAPositiveInteger : "\"{{value}}\" is not a positive integer",
            nan : "\"{{value}}\" is not a number",
            outOfBounds: "{{value}} not in [{{min}},{{max}}]",
            lessThan: "{{value}} is less than {{min}}",
            greaterThan: "{{value}} is greater greater than {{max}}",
			prohibited: "\"{{value}}\" not allowed. It must be one of these: {{values}}"
        },
        inbox: {
            deleteEmailConfirmation: "The e-mail {{subject}} will be permanently deleted. Continue?",
            noMessages: "You have no messages",
            noMessageSelected: "Select an item on the left"
        }
    });
});

