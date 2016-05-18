/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013, 2014, 2015 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.core.ejb;

import com.wegas.core.exception.client.WegasErrorMessage;
import com.wegas.core.exception.client.WegasScriptException;
import com.wegas.core.persistence.game.Player;
import com.wegas.core.persistence.game.Script;
import java.util.Collection;
import javax.ejb.EJB;
import javax.enterprise.context.RequestScoped;
import javax.inject.Inject;
import javax.script.Invocable;
import javax.script.ScriptEngine;
import javax.script.ScriptException;
import org.apache.commons.collections.map.MultiValueMap;

/**
 *
 * @author Cyril Junod <cyril.junod at gmail.com>
 */
@RequestScoped
public class ScriptEventFacade {

    /**
     *
     */
    private final MultiValueMap eventsFired;
    /**
     *
     */
    private final MultiValueMap registeredEvents;
    /**
     *
     */
    private Boolean eventFired;
    /**
     *
     */
    @EJB
    private ScriptFacade scriptFacace;
    /**
     *
     */
    @Inject
    private RequestManager requestManager;

    /**
     *
     */
    public ScriptEventFacade() {
        this.eventFired = false;
        this.eventsFired = new MultiValueMap();
        this.registeredEvents = new MultiValueMap();
    }

    /**
     *
     */
    public void detachAll() {
        this.eventFired = false;
        this.eventsFired.clear();
        this.registeredEvents.clear();
    }

    /**
     *
     * @return
     */
    public Boolean isEventFired() {
        return eventFired;
    }

    /**
     *
     * @param player
     * @param eventName
     * @param param
     * @throws com.wegas.core.exception.client.WegasScriptException
     */
    public void fire(Player player, String eventName, Object param) throws WegasScriptException {
        this.doFire(player, eventName, param);
    }

    /**
     *
     * @param player
     * @param eventName
     * @throws com.wegas.core.exception.client.WegasScriptException
     */
    public void fire(Player player, String eventName) throws WegasScriptException {
        this.fire(player, eventName, null);
    }

    /**
     *
     * @param eventName
     * @param param
     * @throws com.wegas.core.exception.client.WegasScriptException
     */
    public void fire(String eventName, Object param) throws WegasScriptException {
        this.fire(requestManager.getPlayer(), eventName, param);
    }

    /**
     *
     * @param eventName
     * @throws com.wegas.core.exception.client.WegasScriptException
     */
    public void fire(String eventName) throws WegasScriptException {
        this.fire(eventName, null);
    }

    private void doFire(Player player, String eventName, Object params) throws WegasScriptException {
        this.eventFired = true;
        if (player == null && requestManager.getPlayer() == null) {
            throw WegasErrorMessage.error("An event '" + eventName + "' has been fired without a player defined. A player has to be defined.");
        }
        if (requestManager.getCurrentEngine() == null) {
            /* init script engine, declared eventListeners are not yet in memory */
            scriptFacace.eval(player, new Script(""), null);
        }
        ScriptEngine engine = requestManager.getCurrentEngine();
        this.eventsFired.put(eventName, params);

        if (this.registeredEvents.containsKey(eventName)) {
            Collection callbacks = this.registeredEvents.getCollection(eventName);
            for (Object cb : callbacks) {
                Object obj = ((Object[]) cb)[0];

                Object scope = (((Object[]) cb).length == 2 ? ((Object[]) cb)[1] : new EmptyObject());

                try {
                    ((Invocable) engine).invokeMethod(obj, "call", scope, params);
                } catch (ScriptException | NoSuchMethodException ex) {
                    throw new WegasScriptException("Event exception", ex);
                }
            }
        }
    }

    /**
     *
     * @param eventName
     * @return Object[] array of corresponding parameters fired. Length
     * correspond to number of times eventName has been fired.
     */
    public Object[] getFiredParameters(String eventName) {
        if (this.eventsFired.containsKey(eventName)) {
            return this.eventsFired.getCollection(eventName).toArray();
        } else {
            return new Object[]{};
        }
    }

    /**
     *
     * @param eventName
     * @return
     */
    public int firedCount(String eventName) {
        return this.getFiredParameters(eventName).length;
    }

    /**
     *
     * @param eventName
     * @return
     */
    public boolean fired(String eventName) {
        return this.firedCount(eventName) > 0;
    }

    /**
     *
     * @param eventName
     * @param func
     * @param scope
     */
    public void on(String eventName, Object func, Object scope) {
        this.registeredEvents.put(eventName, new Object[]{func, scope});
    }

    /**
     *
     * @param eventName
     * @param func
     */
    public void on(String eventName, Object func) {
        this.registeredEvents.put(eventName, new Object[]{func});
    }

    /**
     *
     */
    public static class EmptyObject {

        /**
         *
         */
        public EmptyObject() {
        }
    }
}
