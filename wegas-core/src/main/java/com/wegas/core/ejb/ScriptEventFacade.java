
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
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import javax.enterprise.context.RequestScoped;
import javax.inject.Inject;
import org.graalvm.polyglot.Context;
import org.graalvm.polyglot.PolyglotException;
import org.graalvm.polyglot.SourceSection;
import org.graalvm.polyglot.Value;
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
    private final Map<String, List<ScriptCallback>> registeredEvents;
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
        this.registeredEvents = new HashMap();
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
        this.doFire(player, eventName, Value.asValue(param));
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

    private void doFire(Player player, String eventName, Value param) throws WegasRuntimeException {
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
        this.eventsFired.put(eventName, param);

        if (this.registeredEvents.containsKey(eventName)) {
            List<ScriptCallback> callbacks = this.registeredEvents.get(eventName);
            for (ScriptCallback cb : callbacks) {
                try {
                    List<Value> args = cb.getArugments();
                    if (param != null) {
                        args.add(param);
                    }
                    Value[] arguments = args.toArray(new Value[0]);
                    cb.getFunction().executeVoid((Object[]) arguments);
                } catch (PolyglotException ex) {
                    if (ex.isHostException()) {
                        Throwable theEx = ex.asHostException();
                        if (theEx instanceof WegasRuntimeException) {
                            // throw our exception as-is
                            logger.error("ScriptException: {}", ex);
                            throw (WegasRuntimeException) theEx;
                        } else if (theEx instanceof RuntimeException) {
                            logger.error("ScriptException: {}", ex);
                            throw new WegasScriptException(cb.toString(), ex.getMessage(), ex);
                        }
                    } else {

                        SourceSection sourceLocation = ex.getSourceLocation();
                        int lineStart = -1;

                        if (sourceLocation != null) {
                            lineStart = sourceLocation.getStartLine();
                        }

                        throw new WegasScriptException(cb.getFunction().toString(), lineStart, ex.getMessage(), ex);
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
        Context scriptContext = requestManager.getCurrentScriptContext();
        if (requestManager.isTestEnv()) {
            // mark event as watched !!
            return true;
        } else {
            Object currentDescriptor = null;

            Value vCurrent = scriptContext.getPolyglotBindings().getMember(ScriptFacade.CONTEXT);
            if (vCurrent != null) {
                currentDescriptor = vCurrent.asHostObject();
            }

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
    public void on(String eventName, Object func, Object... arguments) {
        this.registeredEvents.putIfAbsent(eventName, new ArrayList<>());
        List<ScriptCallback> cbList = this.registeredEvents.get(eventName);
        cbList.add(new ScriptCallback(Value.asValue(func), Arrays
            .stream(arguments)
            .map(Value::asValue)
            .collect(Collectors.toList())));
    }

    public static class ScriptCallback {

        private final Value function;
        private final List<Value> arugments;

        public ScriptCallback(Value function, List<Value> arugments) {
            this.function = function;
            this.arugments = arugments;
        }

        public Value getFunction() {
            return function;
        }

        public List<Value> getArugments() {
            return arugments;
        }
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
