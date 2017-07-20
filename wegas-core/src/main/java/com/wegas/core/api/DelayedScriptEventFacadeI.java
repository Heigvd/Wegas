/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013, 2014, 2015 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.core.api;

public interface DelayedScriptEventFacadeI {

    /**
     * @param minutes
     * @param seconds   [s]
     * @param eventName event to fire
     */
    void delayedFire(long minutes, long seconds, String eventName);
    
}