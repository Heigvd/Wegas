/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.core.api;

import com.wegas.core.exception.client.WegasRuntimeException;

/**
 * Let scripts use events !
 *
 * @author maxence
 */
public interface ScriptEventFacadeI {

    /**
     * Fire an event with some payload
     *
     * @param eventName event to fire
     * @param param     payload
     *
     * @throws com.wegas.core.exception.client.WegasRuntimeException
     */
    void fire(String eventName, Object param) throws WegasRuntimeException;

    /**
     * Fire an event with some payload.
     *
     * @param eventName event to fire
     * @param param     payload
     *
     * @throws com.wegas.core.exception.client.WegasRuntimeException
     */
    void fireLoaded(String eventName, Object param) throws WegasRuntimeException;

    /**
     * Fire an event
     *
     * @param eventName event to fire
     *
     * @throws com.wegas.core.exception.client.WegasRuntimeException
     */
    void fire(String eventName) throws WegasRuntimeException;

    /**
     * Has an event been fired?
     *
     * @param eventName
     *
     * @return true id the event has been fired
     */
    boolean fired(String eventName);

    /**
     * Register a function to execute on an event
     *
     * @param eventName event name to attache the function to
     * @param func      the function to execute
     * @param scope     function scope
     */
    void on(String eventName, Object func, Object scope);

    /**
     * Register a function to execute on an event
     *
     * @param eventName event name to attache the function to
     * @param func      the function to execute
     *
     */
    void on(String eventName, Object func);
}
