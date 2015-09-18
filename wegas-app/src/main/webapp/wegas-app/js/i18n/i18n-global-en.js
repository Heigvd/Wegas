
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
    Y.Wegas.I18n.register("en", {
        global: {
            and: "and",
            description: "description",
            details: "details",
            delete: "delete",
            variableNotFound: "Unable to found \"{{name}}\" variable",
            logout: "logout"
        },
        inbox: {
            deleteEmailConfirmation: "The e-mail {{subject}} will be permanently deleted. Continue?",
            noMessages: "You have no messages",
            noMessageSelected: "Select an item on the left"
        }
    });
});

