/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
/**
 * @fileoverview
 * @author Benjamin Gerber <ger.benjamin@gmail.com>
 * @author Yannick Lagger <lagger.yannick@gmail.com>
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
var gm = self.getGameModel(), TempImpact;

/**
 * Call all necessary method to pass a period and calculate all variable.
 * set phase (if period egal max period) and set period.
 * if enter in phase 2, change pageGantt and pageTask then call function setWeekliesVariables
 * to calculate values like gauges and EV, AC, ...
 * if period is passed in phase realisation, calculate task progress (call
 *  function completeRealizationPeriod) and check the end of the project (if true, pass to phase 4).
 */
function nextPeriod() {
    var currentPhase = getCurrentPhase(),
        currentPeriod = getCurrentPeriod();

    allPhaseQuestionAnswered();                                                 // First Check if all questions are answered
    advancementLimit();

    Variable.find(gm, "currentTime").add(self, 1);

    if (currentPhase.getValue(self) === 3) {                                    // If current phase is the 'realisation' phase
        runSimulation();
        currentPeriod.add(self, 1);
        if (checkEndOfProject()) {                                              // If the project is over
            currentPhase.add(self, 1);
            Event.fire("nextPhase");
            Event.fire("nextWeek");
        } else {
            Event.fire("nextWeek");
        }

    } else if (currentPeriod.getValue(self) === currentPeriod.maxValueD) {      // If end of phase
        currentPhase.add(self, 1);
        //currentPeriod.setValue(self, 1);                                      // Why?
        if (currentPhase.getValue(self) === 3) {                                // Execution period
            Variable.findByName(gm, 'ganttPage').setValue(self, 11);
            Variable.findByName(gm, 'taskPage').setValue(self, 12);
        }
        Event.fire("nextPhase");
        Event.fire("nextWeek");

    } else {                                                                    // Otherwise pass to next period
        currentPeriod.add(self, 1);
        Event.fire("nextWeek");
    }
    if (currentPhase.getValue(self) > 1) {
        updateVariables();
    }
}

/**
 * Check if all active task is complete (Completeness > 100).
 * @returns {Boolean} true if the project is ended
 */
function checkEndOfProject() {
    return !Y.Array.find(Variable.findByName(gm, 'tasks').items, function(t) {
        return t.getInstance(self).active && t.getInstance(self).getPropertyD('completeness') < 100;
    });
}

/**
 * Check if an advancement limit existe
 */
function advancementLimit() {
    var phaseLimit, periodLimit, executionPeriods;
    if (Variable.find(gm, "advancementLimit").getValue(self)) {
        phaseLimit = Variable.find(gm, "phaseLimit").getValue(self);
        periodLimit = Variable.find(gm, "periodLimit").getValue(self);
        executionPeriods = Variable.find(gm, "executionPeriods").getValue(self);
        if (!(getCurrentPhase().getValue(self) === 3 && getCurrentPeriod().getValue(self) > executionPeriods)) {
            if (getCurrentPhase().getValue(self) >= phaseLimit && getCurrentPeriod().getValue(self) >= periodLimit) {
                throw new Error("StringMessage: Ask your course leader for permissions to continue.");
            }
        }
    }
}

/**
 * Check if all questions from a phase are answered
 */
function allPhaseQuestionAnswered() {
    var i, question, questions, forceQuestion = Variable.findByName(gm, "forceQuestionReplies").getValue(self);

    if (!forceQuestion) {
        return;
    }

    try {
        questions = Variable.findByName(gm, "questions").items.get(getCurrentPhase().getValue(self) - 1)
            .items.get(getCurrentPeriod().getValue(self) - 1).items;
    } catch (e) {
        // Unable to find question list for current phase
    }
    if (questions) {
        for (i = 0; i < questions.size(); i++) {
            question = questions.get(i);
            if (!question.isReplied(self) && question.isActive(self)) {
                throw new Error("StringMessage: You have not answered all questions from this week.");
            }
        }
    }
}
/**
 * This function calculate the planned value for a given time
 * @param {Number} period
 * @returns {Number} Planned value
 */
function calculatePlanedValue(period) {
    return Y.Array.sum(getActiveTasks(), function(t) {
        if (t.plannification.size() === 0) {                                    // If the user did not provide a planfication
            return t.getPropertyD('bac');                                       // return budget at completion as it is

        } else {                                                                // Otherwise
            return Y.Array.sum(t.plannification, function(p) {                  // return a ratio of the bac and the already passed periods in plannification
                if (parseInt(p) < period) {
                    return t.getPropertyD('bac') / t.plannification.size();
                } else
                    return 0;
            });
        }
    });
}
/**
 * Calculate planedValue, earnedValue, actualCost, projectCompleteness, cpi, spi, save
 * history for variable the same variable and for costs, delay and quality.
 */
function updateVariables() {
    var i, task, employeesRequired,
        ev = 0, ac = 0, tasksQuality = 0, tasksScale = 0, qualityJaugeValue = 0,
        costs = Variable.findByName(gm, 'costs'),
        delay = Variable.findByName(gm, 'delay'),
        quality = Variable.findByName(gm, 'quality'),
        planedValue = Variable.findByName(gm, 'planedValue'),
        earnedValue = Variable.findByName(gm, 'earnedValue'),
        actualCost = Variable.findByName(gm, 'actualCost'),
        projectUnworkedHours = Variable.findByName(gm, 'projectUnworkedHours'),
        tasks = getActiveTasks(),
        pv = calculatePlanedValue(Variable.findByName(gm, 'periodPhase3').getValue(self));// pv = for each task, sum -> bac * task completeness / 100

    for (i = 0; i < tasks.length; i++) {
        task = tasks[i];
        //debug("calc ev: " + task.getPropertyD('bac') + "*" + task.getPropertyD('completeness'));
        ev += task.getPropertyD('bac') * task.getPropertyD('completeness') / 100;
        //pv += parseInt(task.getProperty('bac')) * (getPlannifiedCompleteness(v) / 100);
        //ac += parseInt(task.getProperty('wages')) + (parseInt(task.getProperty('completeness')) / 100) * parseInt(task.getProperty('fixedCosts')) + parseInt(task.getProperty('unworkedHoursCosts'));

        tasksScale += task.duration * Y.Array.sum(task.requirements, function(r) {
            return r.quantity;
        });

        employeesRequired = Y.Array.sum(task.requirements, function(r) {
            return r.quantity;
        });
        task.setProperty("wages", Math.round(task.getPropertyD("wages")));
        if (task.getPropertyD('completeness') > 0) {                            //...and started
            //debug("calc ac" + task + "*" + task.getPropertyD('wages') + "*" + task.getPropertyD('fixedCosts') + "*" + task.getPropertyD('unworkedHoursCosts'))
            ac += task.getPropertyD('wages') + task.getPropertyD('fixedCosts') + task.getPropertyD('unworkedHoursCosts');
            tasksQuality += task.getPropertyD('quality') * task.duration * employeesRequired; //TO check
        } else {
            tasksQuality += (100 + task.getPropertyD('quality')) * task.duration * employeesRequired;
        }
    }

    Variable.findByName(gm, 'projectCompleteness')
        .setValue(self, Y.Array.sum(tasks, function(t) {
        return t.getPropertyD('completeness');
    }) / tasks.length);                                                     // completness = average of all task's completeness in %

    ac += projectUnworkedHours.getValue(self);

    planedValue.setValue(self, pv);

    earnedValue.setValue(self, ev);                                             // ev = for each task, sum -> bac * planified task completeness / 100

    actualCost.setValue(self, ac);                                              // ac = project fixe costs + for each task, sum -> wages + (completeness / 100) * fixed costs + unworkedHoursCosts
    //actualCost.setValue(self, ac + parseInt(projectFixCosts.getValue(self)));

    debug("updateVariables(): pv: " + pv + ", ac: " + ac + ", ev: " + ev);

    // Costs
    var cpi = 100;
    if (ac > 0) {
        cpi = ev / ac * 100;                                                    // cpi = ev / ac * 100
    }
    costs.setValue(self, Math.min(Math.max(Math.round(cpi), costs.minValueD), costs.maxValueD));
    Variable.findByName(gm, 'cpi').setValue(self, cpi);

    // Delay
    var spi = 100;
    if (pv > 0) {
        var spi = ev / pv * 100;                                                // spi = ev / pv * 100
    }
    delay.setValue(self, Math.min(Math.max(Math.round(spi), delay.minValueD), delay.maxValueD));
    Variable.findByName(gm, 'spi').setValue(self, spi);

    // Quality
    if (tasksScale > 0) {
        qualityJaugeValue = tasksQuality / tasksScale;                          //with weighting of task's scale = sum each task -> task quality / task scale
    }
    //if (activeTasks > 0) {
    //    qualityJaugeValue = tasksQuality / activeTasks;                       //whitout weighting of task's scale
    //}
    qualityJaugeValue += Variable.findByName(gm, 'qualityImpacts').getValue(self) / 2;
    qualityJaugeValue = Math.min(Math.max(qualityJaugeValue, quality.minValueD), quality.maxValueD);
    quality.setValue(self, Math.round(qualityJaugeValue));

    costs.getInstance(self).saveHistory();
    delay.getInstance(self).saveHistory();
    quality.getInstance(self).saveHistory();
    //  planedValue.getInstance(self).saveHistory();
    earnedValue.getInstance(self).saveHistory();
    actualCost.getInstance(self).saveHistory();
    Variable.findByName(gm, 'managementApproval').getInstance(self).saveHistory();
    Variable.findByName(gm, 'userApproval').getInstance(self).saveHistory();
}

function addPredecessor(descName, listPredName) {
    Y.Array.each(listPredName, function(predName) {
        Variable.findByName(gameModel, descName).predecessors.add(Variable.findByName(gameModel, predName));
    });
}
function updateBAC(taskName, value) {
    Variable.findByName(self.getGameModel(), taskName).getInstance(self).setProperty('bac', value);
    planedValueHistory();
}
function planedValueHistory() {
    var len = Variable.find(gameModel, "executionPeriods").getValue(self),
        history = Variable.find(gameModel, "planedValue").getInstance(self).getHistory();
    history.clear();
    for (var i = 0; i < len; i++) {
        history.add(calculatePlanedValue(i + 1));
    }
}
Event.on("addTaskPlannification", function() {
    planedValueHistory();
});
Event.on("removeTaskPlannification", function() {
    planedValueHistory();
});

function addImpactDuration(name, method, arguments, inTime) {
    var factorsDesc = Variable.findByName(gm, "factors"),
        currentTime = Variable.findByName(gm, "currentTime").getInstance().getValue(),
        endTim = inTime + currentTime,
        object = {
        n: name,
        m: method,
        a: arguments,
        t: endTim
    };
    factorsDesc.setProperty(self, Date.now(), JSON.stringify(object));
}

function cancelEffect() {
    var factorsDesc = Variable.findByName(gm, "factors"),
        propertiesKey = factorsDesc.getInstance().getProperties().keySet().toArray(), i,
        currentTime = Variable.findByName(gm, "currentTime").getInstance().getValue(), object,
        args;
    for (i = 0; i < propertiesKey.length; i++) {
        object = JSON.parse(factorsDesc.getProperty(self, propertiesKey[i]));
        args = JSON.stringify(object.a).substr(1, JSON.stringify(object.a).length - 2);
        if (currentTime === object.t) {
            eval("Variable.find(gm, '" + object.n + "')." + object.m + "(self, " + args + ")");
            factorsDesc.removeProperty(self, propertiesKey[i]);
        }
    }
}
TempImpact = {
    addImpactDuration: addImpactDuration,
    cancelEffect: cancelEffect
};
