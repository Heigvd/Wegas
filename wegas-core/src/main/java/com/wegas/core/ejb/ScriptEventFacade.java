
/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.core.ejb;

import com.wegas.core.api.ScriptEventFacadeI;
import com.wegas.core.ejb.statemachine.StateMachineEventCounter;
import com.wegas.core.exception.client.WegasErrorMessage;
import com.wegas.core.exception.client.WegasRuntimeException;
import com.wegas.core.exception.client.WegasScriptException;
import com.wegas.core.persistence.game.Player;
import com.wegas.core.persistence.game.Script;
import com.wegas.core.persistence.variable.statemachine.StateMachineDescriptor;
import com.wegas.core.persistence.variable.statemachine.StateMachineInstance;
import com.wegas.core.security.util.ScriptExecutionContext;
import java.util.Collection;
import jakarta.enterprise.context.RequestScoped;
import jakarta.inject.Inject;
import javax.script.ScriptContext;
import jdk.nashorn.api.scripting.ScriptObjectMirror;
import org.apache.commons.collections.map.MultiValueMap;
import org.apache.commons.lang3.ArrayUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * @author Cyril Junod (cyril.junod at gmail.com)
 */
@RequestScoped
public class ScriptEventFacade extends WegasAbstractFacade implements ScriptEventFacadeI {

    private static final Logger logger = LoggerFactory.getLogger(ScriptEventFacade.class);

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
    @Inject
    private ScriptFacade scriptFacace;

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
     * @return true if at least an evant has been fired
     */
    public Boolean isEventFired() {
        return eventFired;
    }

    /**
     * @param player
     * @param eventName
     * @param param
     *
     * @throws com.wegas.core.exception.client.WegasRuntimeException
     */
    public void fire(Player player, String eventName, Object param) throws WegasRuntimeException {
        this.doFire(player, eventName, param);
    }

    /**
     * @param player
     * @param eventName
     *
     * @throws com.wegas.core.exception.client.WegasRuntimeException
     */
    public void fire(Player player, String eventName) throws WegasRuntimeException {
        this.fire(player, eventName, null);
    }

    /**
     * @param eventName
     * @param param
     *
     * @throws com.wegas.core.exception.client.WegasRuntimeException
     */
    @Override
    public void fire(String eventName, Object param) throws WegasRuntimeException {
        this.fire(requestManager.getPlayer(), eventName, param);
    }

    /**
     * @param eventName
     * @param param
     *
     * @throws com.wegas.core.exception.client.WegasRuntimeException
     */
    @Override
    public void fireLoaded(String eventName, Object param) throws WegasRuntimeException {
        this.fire(requestManager.getPlayer(), eventName, param);
    }

    /**
     * @param eventName
     *
     * @throws com.wegas.core.exception.client.WegasRuntimeException
     */
    @Override
    public void fire(String eventName) throws WegasRuntimeException {
        this.fire(eventName, null);
    }

    private void doFire(Player player, String eventName, Object params) throws WegasRuntimeException {
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

            // event callback are always internal
            try (ScriptExecutionContext ctx = requestManager.switchToInternalExecContext(true)) {
                for (Object cb : callbacks) {
                    ScriptObjectMirror obj = (ScriptObjectMirror) ((Object[]) cb)[0];

                    Object scope = (((Object[]) cb).length == 2 ? ((Object[]) cb)[1] : new EmptyObject());

                    try {
                        obj.call(scope, params);
                    } catch (WegasRuntimeException ex) { // throw our exception as-is
                        logger.error("ScriptException: {}", ex);
                        throw ex;
                    } catch (RuntimeException ex) { // Java exception (Java -> JS -> Java -> throw)
                        logger.error("ScriptException: {}", ex);
                        throw new WegasScriptException(obj.toString(), ex.getMessage(), ex);
                    }
                }
            }
        }

    }

    /**
     * @param eventName
     *
     * @return Object[] array of corresponding parameters fired. Length correspond to number of
     *         times eventName has been fired.
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
     *
     * @return how many time the event has been fired
     */
    public int firedCount(String eventName) {
        return this.getFiredParameters(eventName).length;
    }

    /**
     * check if the event has been fired. If it's the case, count this event consumption within
     * eventCounter
     *
     * @param eventName
     *
     * @return check if the event has been fired
     */
    @Override
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
    @Override
    public void on(String eventName, Object func, Object scope) {
        if (requestManager.getCurrentContext() != RequestManager.RequestContext.INTERNAL_SCRIPT) {
            throw WegasErrorMessage.error("The registration of callback is forbidden");
        }
        this.registeredEvents.put(eventName, new Object[]{func, scope});
    }

    /**
     * @param eventName
     * @param func
     */
    @Override
    public void on(String eventName, Object func) {
        if (requestManager.getCurrentContext() != RequestManager.RequestContext.INTERNAL_SCRIPT) {
            throw WegasErrorMessage.error("The registration of callback is forbidden");
        }
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
            // empty constructor of empty object: design 2 dot zero
        }
    }
}
