/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013, 2014, 2015 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.core.ejb;

import com.wegas.core.ejb.statemachine.StateMachineEventCounter;
import com.wegas.core.exception.client.WegasErrorMessage;
import com.wegas.core.exception.client.WegasScriptException;
import com.wegas.core.persistence.game.Player;
import com.wegas.core.persistence.game.Script;
import com.wegas.core.persistence.variable.statemachine.StateMachineDescriptor;
import com.wegas.core.persistence.variable.statemachine.StateMachineInstance;
import jdk.nashorn.api.scripting.ScriptObjectMirror;
import org.apache.commons.collections.map.MultiValueMap;
import org.apache.commons.lang3.ArrayUtils;

import javax.ejb.EJB;
import javax.enterprise.context.RequestScoped;
import javax.inject.Inject;
import java.util.Collection;
import javax.script.ScriptContext;

/**
 * @author Cyril Junod (cyril.junod at gmail.com)
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
     * @return
     */
    public Boolean isEventFired() {
        return eventFired;
    }

    /**
     * @param player
     * @param eventName
     * @param param
     * @throws com.wegas.core.exception.client.WegasScriptException
     */
    public void fire(Player player, String eventName, Object param) throws WegasScriptException {
        this.doFire(player, eventName, param);
    }

    /**
     * @param player
     * @param eventName
     * @throws com.wegas.core.exception.client.WegasScriptException
     */
    public void fire(Player player, String eventName) throws WegasScriptException {
        this.fire(player, eventName, null);
    }

    /**
     * @param eventName
     * @param param
     * @throws com.wegas.core.exception.client.WegasScriptException
     */
    public void fire(String eventName, Object param) throws WegasScriptException {
        this.fire(requestManager.getPlayer(), eventName, param);
    }

    /**
     * @param eventName
     * @throws com.wegas.core.exception.client.WegasScriptException
     */
    public void fire(String eventName) throws WegasScriptException {
        this.fire(eventName, null);
    }

    private void doFire(Player player, String eventName, Object params) throws WegasScriptException {
        if (player == null && requestManager.getPlayer() == null) {
            throw WegasErrorMessage.error("An event '" + eventName + "' has been fired without a player defined. A player has to be defined.");
        }
        if (requestManager.getCurrentScriptContext() == null) {
            /* init script context, declared eventListeners are not yet in memory */
            scriptFacace.eval(player, new Script(""), null);
        }
        /*
         * Make sure to set eventFired after context initiation because events 
         * are detached by instantiation process
         */
        this.eventFired = true;
        this.eventsFired.put(eventName, params);

        if (this.registeredEvents.containsKey(eventName)) {
            Collection callbacks = this.registeredEvents.getCollection(eventName);
            for (Object cb : callbacks) {
                ScriptObjectMirror obj = (ScriptObjectMirror) ((Object[]) cb)[0];

                Object scope = (((Object[]) cb).length == 2 ? ((Object[]) cb)[1] : new EmptyObject());
                obj.call(scope, params);
            }
        }
    }

    /**
     * @param eventName
     * @return Object[] array of corresponding parameters fired. Length
     *         correspond to number of times eventName has been fired.
     */
    public Object[] getFiredParameters(String eventName) {
        if (this.eventsFired.containsKey(eventName)) {
            return this.eventsFired.getCollection(eventName).toArray();
        } else {
            return ArrayUtils.EMPTY_OBJECT_ARRAY;
        }
    }

    /**
     * @param eventName
     * @return
     */
    public int firedCount(String eventName) {
        return this.getFiredParameters(eventName).length;
    }

    /**
     * @param eventName
     * @return
     */
    public boolean fired(String eventName) {
        ScriptContext scriptContext = requestManager.getCurrentScriptContext();
        if (requestManager.isTestEnv()) {
            // mark event as watched !!
            return true;
        } else {

            Object currentDescriptor = scriptContext.getBindings(ScriptContext.ENGINE_SCOPE).get(ScriptFacade.CONTEXT);

            if (currentDescriptor instanceof StateMachineDescriptor) {
                int count;
                StateMachineInstance smi = ((StateMachineDescriptor) currentDescriptor).getInstance(requestManager.getPlayer());
                StateMachineEventCounter eventCounter = this.requestManager.getEventCounter();
                count = eventCounter.count(smi, eventName);
                count += eventCounter.countCurrent(eventName);

                if (this.firedCount(eventName) > count) {
                    eventCounter.registerEvent(eventName);
                    return true;
                } else {
                    return false;
                }
            } else {
                return this.firedCount(eventName) > 0;
            }
        }
    }

    /**
     * @param eventName
     * @param func
     * @param scope
     */
    public void on(String eventName, Object func, Object scope) {
        this.registeredEvents.put(eventName, new Object[]{func, scope});
    }

    /**
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
