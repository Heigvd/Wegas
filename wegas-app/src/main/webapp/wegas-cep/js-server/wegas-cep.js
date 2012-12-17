/*
 * Wegas
 * http://www.albasim.com/wegas/
 *
 * School of Business and Engineering Vaud, http://www.heig-vd.ch/
 * Media Engineering :: Information Technology Managment :: Comem
 *
 * Copyright (C) 2012
 */
/**
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
importPackage(javax.naming);

function lookupBean(name) {
var ctx = new InitialContext();
return ctx.lookup("java:module/" + name);
 }

function passPeriod() {var currentTime = phases.descriptor.items.get(phases.value),
    currentTimeInstance = currentTime.getInstance(self);
    if (currentTimeInstance.value == currentTime.maxValue) {
        phases.value += 1;
    } else {
        currentTimeInstance.value += 1;
    }
    humanResources.value = humanResources.descriptor.defaultInstance.value;
}