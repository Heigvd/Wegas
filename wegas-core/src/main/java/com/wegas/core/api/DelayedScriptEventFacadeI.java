/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2020 School of Business and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.core.api;

/**
 * DelayedEventFacade allows to delay events.
 *
 * @author maxence
 */
public interface DelayedScriptEventFacadeI {

    /**
     * Wait before firing and event
     *
     * @param minutes   number of minutes
     * @param seconds   number of seconds [s]
     * @param eventName event to fire
     */
    void delayedFire(long minutes, long seconds, String eventName);

}
