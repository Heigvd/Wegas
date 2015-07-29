/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2015 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */

/*global Variable, gameModel, self, Y, PMGSimulation, debug, com, java, Java */
var PMGDashboard = (function() {
    "use strict";
    var Long = Java.type("java.lang.Long");

    function questionAnswered(teamId, currentPhase, currentPeriod) {
        if (Variable.find(gameModel, 'questions').size() < currentPhase) {
            return "0/0";
        }
        var q = Variable.find(gameModel, 'questions').item(currentPhase - 1),
            i = 0, items = new java.util.LinkedList(), questions, item, inst, count = 0, total = 0;
        if (q) {
            for (i = 0; i < q.size(); i += 1) {
                item = q.item(i);
                if (item instanceof com.wegas.mcq.persistence.QuestionDescriptor) {
                    items.add(item);
                } else if (i === currentPeriod - 1 &&
                           item instanceof com.wegas.core.persistence.variable.ListDescriptor) {
                    items.addAll(item.flatten());
                }
            }
        }

        for (i = 0; i < items.length; i += 1) {
            inst = items[i].getScope().getVariableInstances()[teamId];
            if (inst instanceof com.wegas.mcq.persistence.QuestionInstance) {
                count += (inst.getReplies().size() > 0 && inst.getActive()) ? 1 : 0;
                total += inst.getActive() ? 1 : 0;
            }
        }
        return count + "/" + total;
    }

    function getInstances(name) {
        return Variable.find(gameModel, name).getScope().getVariableInstances();
    }

    function getLabel(name) {
        return Variable.find(gameModel, name).getLabel();
    }

    function dashboard() {
        var teams = self.getGame().getTeams(),
            currentPhase = getInstances("currentPhase"),
            currentPeriod = getInstances("currentPeriod"),
            management = getInstances("managementApproval"),
            user = getInstances("userApproval"),
            quality = getInstances("quality"),
            cost = getInstances("costs"),
            schedule = getInstances("delay"),
            arr = [], teamId, t,
            phaseName = ['Initiation', 'Planning', 'Executing', 'Closing'],
            managementLabel = getLabel("managementApproval"),
            userLabel = getLabel("userApproval"),
            obj;
        for (t = 0; t < teams.size(); t++) {
            teamId = new Long(teams.get(t).getId());
            currentPeriod = Variable.find(gameModel, 'currentPeriod').item(currentPhase[teamId].getValue() -
                                                                           1).getScope().getVariableInstances()[teamId].getValue();
            obj = {
                "id": teamId,
                "data":{
                    "Phase": {"value": phaseName[currentPhase[teamId].getValue() - 1], "colorize" : false},
                    "Period": {"value": currentPeriod, "colorize" : false},
                    "Questions": {"value": questionAnswered(teamId, currentPhase[teamId].getValue(), currentPeriod), "colorize" : false},
                    "Quality": {"value": quality[teamId].getValue(), "colorize" : true},
                    "Costs": {"value": cost[teamId].getValue(), "colorize" : true},
                    "Schedule": {"value": schedule[teamId].getValue(), "colorize" : true},
                    "Management": {"value": management[teamId].getValue(), "colorize" : true, "label": managementLabel},
                    "User": {"value": user[teamId].getValue(), "colorize" : true, "label": userLabel}
                }
            };
            arr.push(obj);
        }
        return JSON.stringify(arr);
    }

    return {
        dashboard: dashboard
    };
})();
