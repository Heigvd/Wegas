/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */

/**
 *                ,*************************************.
 *                |         PM-GAME TEST  UTILS         |
 *                '~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~'
 *
 * @fileoverview
 * @author Maxence Laurent <maxence.laurent@gmail.com>
 */

var resourceFacade,
    questionFacade;

/**
 * @param {string} name the variable descriptor's name (i.e. scriptAlias) to look for
 * @return the variable descriptor based and its name.
 * @throw NotFound
 */
function getVariableDescriptor(name) {
    var vd;
    try {
        vd = Variable.findByName(gameModel, name);
    } catch (e) {
        vd = null;
    }
    assertNotNull(vd, name, "not found");
    return vd;
}


function assertNotNull(variable, varname, msg) {
    if (!variable) {
        throw new Error(varname + " " + msg);
    }
}

function assertEquals(expected, found, msg) {
    if (expected != found) {  // DO NOT USE === 
//        debug("ERROR: assert equals does not match");
        throw new Error(msg + " (expected " + expected + ", found " + found + ")");
    }
}

function checkChoiceHasBeenSelected(choice) {
    assertEquals(true, choice.hasBeenSelected(self),
        choice.getQuestion().getLabel()
        + " ==> " + choice.getLabel() + " has not been selected");
}

function checkProperty(vd, property, expected, callee) {
    assertEquals(expected, vd.instance.getProperty(property),
        callee + ": " + vd.getLabel() + " " + property + " does not match");
}

function checkDescriptorProperty(vd, property, expected, callee) {
    assertEquals(expected, vd.getProperty(property),
        callee + ": " + vd.getLabel() + " " + property + " does not match");
}

function loadResourceFacade() {
    if (!resourceFacade) {
        debug("Load ResourceFacade");
        resourceFacade = lookupBean("ResourceFacade");
        debug("Load ResourceFacade: DONE");
    }
}

function loadQuestionFacade() {
    if (!questionFacade) {
        debug("Load QuestionFacade...");
        questionFacade = lookupBean("QuestionDescriptorFacade");
        debug("Load QuestionFacade: DONE");
    }
}

/**
 * Make a choice 
 * @param {type} choice
 * @returns {undefined}
 */
function selectChoice(choice) {
    debug("select choice");
    loadQuestionFacade();
    if (choice.getClass().toString() == "class com.wegas.mcq.persistence.ChoiceDescriptor" ||
        choice.getClass().toString() == "class com.wegas.mcq.persistence.SingleResultChoiceDescriptor") {
        questionFacade.selectAndValidateChoiceTEST(choice.id, self.id);
    } else {
        throw new Error("Given choice \"" + choice + "\" is not a choice");
    }
    debug("select choice : DONE");
}

/**
 *  usage : plan(task01, 1, 2, 3, 4, 5) 
 * @param {TaskDescriptor} task
 * @returns {undefined}
 */
function plan(task) {
    debug("Plan task " + task);
    loadResourceFacade();
    for (var i = 1; i < arguments.length; i++) {
        resourceFacade.addTaskPlannification(self.id, task.instance.id, arguments[i]);
    }
    debug("Plan task: DONE");
}

/**
 * Assign the specified resource to the given tasks
 * Usage: assign(George, task01, task02, task11)
 * 
 * @param {ResourceDescriptor} resource
 * @returns {undefined}
 */
function assign(resource) {
    debug("Assign: " + resource);
    loadResourceFacade();
    for (var i = 1; i < arguments.length; i++) {
        resourceFacade.assign(resource.instance, arguments[i]);
    }
    debug("Assign: DONE");
}

function clearAssignments(resource) {
    var i, toRemove = [];
    for (i = 0; i < resource.instance.assignments.size(); i++) {
        toRemove.push(resource.instance.assignments.get(i));
    }

    Y.Array.each(toRemove, function(a) {
        resource.instance.assignments.remove(a);
    });
}

/**
 * Reserve the specified resources for the fiven periods
 * Example : reserve(Georges, 1, 2, 10, 11)
 * @param {ResourceDescriptor} resource
 * @returns {undefined}
 */
function reserve(resource) {
    debug("Reserve: " + resource);
    loadResourceFacade();
    for (var i = 1; i < arguments.length; i++) {
        resourceFacade.reserve(resource.instance, arguments[i]);
    }
    debug("reserve: DONE");
}

/**
 * Do next serveral times
 * 
 * @param {type} times number of period to go through
 * @returns {undefined}
 */
function doNextPeriod(times) {
    times = Math.min(Math.max(0, times), 20);
    while (times--) {
        nextPeriod();
    }
}

function nextPeriod() {
    PMGSimulation.nextPeriod();
}


/**
 * Println the time (in [ms]) elasped since the given param
 * @param {string} msg
 * @param {timestamp} since 
 * @returns {undefined}
 */
function printDuration(msg, since) {
    var d = Date.now() - since;
    debug(msg + ": " + d + " [ms]");
}


function addPredecessor(descName, listPredName) {
    Y.Array.each(listPredName, function(predName) {
        Variable.findByName(gameModel, descName).predecessors.add(Variable.findByName(gameModel, predName));
    });
}
