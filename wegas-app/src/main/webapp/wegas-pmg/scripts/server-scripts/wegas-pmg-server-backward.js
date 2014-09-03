/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
/**
 * @fileoverview
 * @author Maxence Laurent <maxence.laurent> <gmail.com>
 */


function nextPeriod(){
    PMGSimulation.nextPeriod();
}

function workOnProject(resourceInstance){
    return PMGHelper.workingOnProject(resourceInstance.getDescriptor());
}

function addImpactDuration(a, b, c, d){
    PMGHelper.addImpactDuration(a, b, c, d);
}

function cancelEffect() {
    PMGHelper.cancelEffect();
}