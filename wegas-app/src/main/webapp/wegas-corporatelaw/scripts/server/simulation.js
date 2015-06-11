/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013, 2014, 2015 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */


/**
 * PMGHelper module contains PMG related utility function
 * 
 * @fileoverview
 * 
 * @author Maxence Laurent <maxence.laurent@gmail.com>
 */
/*global Variable, gameModel, self, Y, PMGSimulation, debug */
var LawHelper = (function() {
    "use strict";

    var reviewFacade;

    /**
     * 
     * get the specified wegas bean.
     * @param {String} name, the name of the bean
     * @returns {Object} the bean
     */
    function lookupBean(name) {
        var ctx = new javax.naming.InitialContext();
        return ctx.lookup('java:module/' + name);
    }

    function loadReviewFacade() {
        if (!reviewFacade) {
            reviewFacade = lookupBean("ReviewingFacade");
        }
    }


    function increments(numDesc, maxValue) {
        var instance = numDesc.getInstance(self),
            newValue = instance.getValue() + 1;
        if (newValue > maxValue) {
            throw new com.wegas.core.exception.client.WegasOutOfBoundException(0, maxValue, newValue, numDesc.getLabel());
        } else {
            instance.setValue(instance.getValue() + 1);
        }
    }

    function countItems(folderDesc) {
        return folderDesc.items.size() - 1;
    }

    function nextClientInterview() {
        increments(Variable.findByName(gameModel, "currentClientInterview"),
            countItems(Variable.find(gameModel, "interviews")));
    }

    function nextActions() {
        increments(Variable.findByName(gameModel, "currentActions")),
            countItems(Variable.find(gameModel, "actions"));
    }

    function submit(prd_name) {
        var prd;
        loadReviewFacade();
        prd = Variable.findByName(gameModel, prd_name);
        return reviewFacade.submit(prd, self);
    }

    return {
        nextClientInterview: function() {
            return nextClientInterview();
        },
        nextActionFolder: function() {
            return nextActions();
        },
        submit: function(prd_name) {
            return submit(prd_name);
        }
    };
}());