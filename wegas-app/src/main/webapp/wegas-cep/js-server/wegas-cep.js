/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
/**
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
importPackage(javax.naming);

function passPeriod() {
    var currentTime = phases.descriptor.items.get(currentPhase.value - 1),
            currentTimeInstance = currentTime.getInstance(self);
    if (currentTimeInstance.value == currentTime.maxValue) {
        phases.value += 1;
        currentPhase.value += 1;
        phases.descriptor.items.get(currentPhase.value - 1).getInstance(self).value += 1;
    } else {
        currentTimeInstance.value += 1;
    }
    humanResources.value = humanResources.descriptor.defaultInstance.value;
}
function checkMoral() {
    this.setTeamMotivation();
    this.changePicture();
}

function setTeamMotivation() {
    var i, gm = self.getGameModel(),
            listEmployees = VariableDescriptorFacade.findByName(gm, 'employees'),
            employeeInstance,
            teamMotivation = VariableDescriptorFacade.findByName(gm, 'teamMotivation'),
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
    for (i = 0; i < listEmployees.items.size(); i++) {
        employeeInstance = listEmployees.items.get(i).getInstance(self);
        if (employeeInstance.getActive() == true) {
            tmpVal = parseInt(employeeInstance.getMoral());
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
    for (i = 0; i < morals.length; i++) {
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

function boundConstrain(val, lowerBound, upperBound) {
    return Math.max(lowerBound, Math.min(val, upperBound));
}

/**
 * Set picture depending of resource's current moral.
 */
function changePicture() {
    var i, j, valueInst, valueDescr, gm = self.getGameModel(), oldImg, newImg, moral,
            listEmployees = VariableDescriptorFacade.findByName(gm, 'employees'),
            imgSuffixe = ['Triste', 'Neutre', 'Joie'];
    if (!listEmployees) {
        return;
    }
    for (i = 0; i < listEmployees.items.size(); i++) {
        valueDescr = listEmployees.items.get(i);
        valueInst = valueDescr.getInstance(self);
        moral = parseInt(valueInst.getMoral());
        oldImg = valueInst.getProperty('picture');
        newImg = null;
        switch (true) {
            case moral < 40 :
                for (j = 0; j < imgSuffixe.length; j++) {
                    if (oldImg.indexOf(imgSuffixe[j]) > -1) {
                        newImg = oldImg.replace(imgSuffixe[j], imgSuffixe[0]);
                        break;
                    }
                }
                break;
            case moral < 75 :
                for (j = 0; j < imgSuffixe.length; j++) {
                    if (oldImg.indexOf(imgSuffixe[j]) > -1) {
                        newImg = oldImg.replace(imgSuffixe[j], imgSuffixe[1]);
                        break;
                    }
                }
                break;
            default :
                for (j = 0; j < imgSuffixe.length; j++) {
                    if (oldImg.indexOf(imgSuffixe[j]) > -1) {
                        newImg = oldImg.replace(imgSuffixe[j], imgSuffixe[2]);
                        break;
                    }
                }
                break;
        }
        if (newImg) {
            valueInst.setProperty('picture', newImg);
        }
    }
}
/**
 * History
 **/
function sendHistory(type, title, msg) {
    var phase = phases.getDescriptor().item(currentPhase.value - 1),
            phaseText = type + " - " + phase.label + " (" + phase.getInstance().value + ")";
    VariableDescriptorFacade.find(gameModel, "history").sendMessage(self, phaseText, title, msg, []);
}

Event.on("replyValidate", function(e) {
    var msg = "", root;
    /* Assume third level*/
    root = VariableDescriptorFacade.findParentList(e.question.getDescriptor());
    root = VariableDescriptorFacade.findParentList(root);
    root = VariableDescriptorFacade.findParentList(root);
    msg += "<b>" + e.choice.getDescriptor().getTitle() + "</b><br>"; // Choice selected
    msg += e.choice.getDescriptor().getDescription() + "<br><hr><br>"; // choice description
    msg += e.reply.getResult().getAnswer(); //Reply

    sendHistory(root.label, e.question.getDescriptor().getTitle(), msg, []);
});
