/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.core.ejb;

import com.wegas.core.exception.WegasException;
import com.wegas.core.persistence.game.Player;
import com.wegas.core.persistence.game.Script;
import java.util.Collection;
import javax.ejb.EJB;
import javax.enterprise.context.RequestScoped;
import javax.inject.Inject;
import javax.script.Invocable;
import javax.script.ScriptException;
import org.apache.commons.collections.map.MultiValueMap;

/**
 *
 * @author Cyril Junod <cyril.junod at gmail.com>
 */
@RequestScoped
public class ScriptEvent {

    private final MultiValueMap eventsFired;
    private final MultiValueMap registeredEvents;
    private Boolean eventFired;
    @EJB
    private ScriptFacade scriptFacace;
    @Inject
    private RequestManager requestManager;

    public ScriptEvent() {
        this.eventFired = false;
        this.eventsFired = new MultiValueMap();
        this.registeredEvents = new MultiValueMap();
    }

    public void detachAll() {
        this.eventFired = false;
        this.eventsFired.clear();
        this.registeredEvents.clear();
    }

    public Boolean isEventFired() {
        return eventFired;
    }

    public void fire(Player player, String eventName, Object param) throws ScriptException, NoSuchMethodException {
        this.eventsFired.put(eventName, param);
        this.doFire(player, eventName, param);
    }

    public void fire(Player player, String eventName) throws ScriptException, NoSuchMethodException {
        this.eventsFired.put(eventName, new EmptyObject());
        this.doFire(player, eventName, null);
    }

    public void fire(String eventName, Object param) throws ScriptException, NoSuchMethodException {
        this.eventsFired.put(eventName, param);
        this.doFire(requestManager.getPlayer(), eventName, param);
    }

    public void fire(String eventName) throws ScriptException, NoSuchMethodException {
        this.eventsFired.put(eventName, new EmptyObject());
        this.doFire(requestManager.getPlayer(), eventName, null);
    }

    private void doFire(Player player, String eventName, Object params) throws ScriptException, NoSuchMethodException {
        this.eventFired = true;
        if (player == null && requestManager.getPlayer() == null) {
            throw new WegasException("An event '" + eventName + "' has been fired without a player defined. A player has to be defined.");
        }
        if (requestManager.getCurrentEngine() == null) {
            /* init script engine, declared eventListeners are not yet in memory */
            scriptFacace.eval(player, new Script(""));
        }

        if (this.registeredEvents.containsKey(eventName)) {
            Collection callbacks = this.registeredEvents.getCollection(eventName);
            for (Object cb : callbacks) {
                ((Invocable) requestManager.getCurrentEngine()).invokeMethod(((Object[]) cb)[0], "call", ((Object[]) cb)[1], params);
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
            return this.eventsFired.getCollection(eventName).toArray(new Object[]{});
        } else {
            return new Object[]{};
        }
    }

    public int firedCount(String eventName) {
        return this.getFiredParameters(eventName).length;
    }

    public boolean fired(String eventName) {
        return this.firedCount(eventName) > 0;
    }

    public void on(String eventName, Object func, Object scope) throws ScriptException, NoSuchMethodException {
        this.registeredEvents.put(eventName, new Object[]{func, scope});
    }

    public void on(String eventName, Object func) throws ScriptException, NoSuchMethodException {
        this.registeredEvents.put(eventName, new Object[]{func, func});
    }

    public static class EmptyObject {

        public EmptyObject() {
        }
    }
}
