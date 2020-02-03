/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2020 School of Business and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */

/* global EventCounter, stateMachines, Java */

var FSMHelper = (function() {
    "use strict";

    /*
     * stateMachines := { fsmInstanceId: [Tansition]}
     * transition := { transitionId, script: "script"}
     */

    /* Returns transition to apply
     *  { fsmInstanceId: {
     *           transtionId: id, consumed: {eventName: count}
     *      }
     *  }
     */

    function evalTransitions() {
        var selectedTransitions = [];

        var fsms = Java.from(stateMachines)

        for (var k in fsms) {
            var transitions = Java.from(fsms[k]);
            for (var i in transitions) {
                EventCounter.clearCurrents();
                
                var transition = transitions[i];

                if (!transition.getCondition() || eval(transition.getCondition())) {
                    transition.setCounters(EventCounter.getCurrents());
                    selectedTransitions.push(transition);
                    // next stateMachine
                    break;
                }
            }
        }
        return selectedTransitions;
    }

    return {
        evalTransitions: evalTransitions
    };

}());