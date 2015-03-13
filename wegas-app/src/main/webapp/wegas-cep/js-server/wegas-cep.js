/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013, 2014, 2015 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
/**
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */

/*global self, Variable, Event, gameModel */

function passPeriod() {
    "use strict";
    var currentPhase = Variable.find(gameModel, "currentPhase"),
        phases = Variable.find(gameModel, "phases"),
        currentTime = phases.items.get(currentPhase.getValue(self) - 1),
        currentTimeInstance = currentTime.getInstance(self),
        humanResources = Variable.find(gameModel, "humanResources");
    if (currentTimeInstance.value === currentTime.maxValue) {
        phases.getInstance(self).value += 1;
        currentPhase.getInstance(self).value += 1;
        //phases.descriptor.items.get(currentPhase.value - 1).getInstance(self).value += 1;
    } else {
        currentTimeInstance.value += 1;
    }

    humanResources.setValue(self, humanResources.defaultInstance.value);
}

function boundConstrain(val, lowerBound, upperBound) {
    "use strict";
    return Math.max(lowerBound, Math.min(val, upperBound));
}

function setTeamMotivation() {
    "use strict";
    var i,
        listEmployees = Variable.findByName(gameModel, 'employees'),
        employeeInstance,
        teamMotivation = Variable.findByName(gameModel, 'teamMotivation'),
        morals = [],
        mSum = 0,
        mAverage,
        mGap = [],
        tmpVal,
        SumOfSquareOfMGap = 0,
        standardDeviation,
        newTeamMotivation;
    if (!listEmployees || !teamMotivation) {
        return;
    }

    // calcul arithmetic average of morals (on actives employees only)
    for (i = 0; i < listEmployees.items.size(); i += 1) {
        employeeInstance = listEmployees.items.get(i).getInstance(self);
        if (employeeInstance.getActive() === true) {
            tmpVal = parseInt(employeeInstance.getMoral(), 10);
            //Bound moral between teamMotivation Min val and max val
            if (boundConstrain(tmpVal, teamMotivation.getMinValue(), teamMotivation.getMaxValue()) !== tmpVal) {
                tmpVal = boundConstrain(tmpVal, teamMotivation.getMinValue(), teamMotivation.getMaxValue());
                employeeInstance.setMoral(tmpVal);
            }
            morals.push(tmpVal);
            mSum += tmpVal;
        }
    }
    mAverage = mSum / morals.length;

    //For each moral calcul gap between moral and average (= moral - average);
    //take the sum of each square of gaps (= Sum(n_gaps * n_gaps)).
    for (i = 0; i < morals.length; i += 1) {
        mGap.push(morals[i] - mAverage);
        SumOfSquareOfMGap += Math.pow(mGap[i], 2);
    }

    // calcul the standard deviation
    standardDeviation = Math.sqrt(SumOfSquareOfMGap / morals.length);

    //calcul the new Team Motivation
    newTeamMotivation = (mAverage + (mAverage - standardDeviation)) / 2;
    if (newTeamMotivation < 0) { //in extrems cases
        newTeamMotivation = 0;
    }

    //set teamMotivation
    teamMotivation.getInstance(self).setValue(Math.round(newTeamMotivation));
}

/**
 * Set picture depending of resource's current moral.
 */
function changePicture() {
    "use strict";
    var i, j, valueInst, valueDescr, oldImg, newImg, moral,
        listEmployees = Variable.findByName(gameModel, 'employees'),
        imgSuffixe = ['Triste', 'Neutre', 'Joie'];
    if (!listEmployees) {
        return;
    }
    for (i = 0; i < listEmployees.items.size(); i += 1) {
        valueDescr = listEmployees.items.get(i);
        valueInst = valueDescr.getInstance(self);
        moral = parseInt(valueInst.getMoral(), 10);
        oldImg = valueInst.getProperty('picture');
        newImg = null;
        if (moral < 40) {
            for (j = 0; j < imgSuffixe.length; j += 1) {
                if (oldImg.indexOf(imgSuffixe[j]) > -1) {
                    newImg = oldImg.replace(imgSuffixe[j], imgSuffixe[0]);
                    break;
                }
            }
        } else if (moral < 75) {
            for (j = 0; j < imgSuffixe.length; j += 1) {
                if (oldImg.indexOf(imgSuffixe[j]) > -1) {
                    newImg = oldImg.replace(imgSuffixe[j], imgSuffixe[1]);
                    break;
                }
            }
        } else {
            for (j = 0; j < imgSuffixe.length; j += 1) {
                if (oldImg.indexOf(imgSuffixe[j]) > -1) {
                    newImg = oldImg.replace(imgSuffixe[j], imgSuffixe[2]);
                    break;
                }
            }
        }
        if (newImg) {
            valueInst.setProperty('picture', newImg);
        }
    }
}

function checkMoral() {
    "use strict";
    setTeamMotivation();
    changePicture();
}

/**
 * History
 * @param {string} type type of the historical record
 * @param {string} title title of the record
 * @param {text} msg record content
 * @returns {null}
 */
function sendHistory(type, title, msg) {
    "use strict";
    var currentPhase = Variable.find(gameModel, "currentPhase"),
        phases = Variable.find(gameModel, "phases"),
        phase = phases.item(currentPhase.getValue(self) - 1),
        phaseText = type + " - " + phase.label + " (" + phase.getInstance().value + ")";
    Variable.find(gameModel, "history").sendMessage(self, phaseText, title, msg, []);
}

Event.on("replyValidate", function(e) {
    "use strict";
    var msg = "", root;
    /* Assume third level*/
    root = Variable.findParentList(e.question.getDescriptor());
    root = Variable.findParentList(root);
    root = Variable.findParentList(root);
    msg += "<b>" + e.choice.getDescriptor().getTitle() + "</b><br>"; // Choice selected
    msg += e.choice.getDescriptor().getDescription() + "<br><hr><br>"; // choice description
    msg += e.reply.getResult().getAnswer(); //Reply

    sendHistory(root.label, e.question.getDescriptor().getTitle(), msg, []);
});
