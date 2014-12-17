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


function nextPeriod() {
    "use strict";
    PMGSimulation.nextPeriod();
}

function workOnProject(resourceInstance) {
    "use strict";
    return PMGHelper.workOnProject(resourceInstance.getDescriptor());
}

function addImpactDuration(a, b, c, d) {
    "use strict";
    PMGHelper.addImpactDuration(a, b, c, d);
}

function cancelEffect() {
    "use strict";
    PMGHelper.cancelEffect();
}