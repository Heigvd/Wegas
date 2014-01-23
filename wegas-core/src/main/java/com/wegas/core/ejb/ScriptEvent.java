/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.core.ejb;

import java.util.Collection;
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

    public void fire(String eventName, Object param) throws ScriptException, NoSuchMethodException {
        this.eventsFired.put(eventName, param);
        this.doFire(eventName, param);
    }

    public void fire(String eventName) throws ScriptException, NoSuchMethodException {
        this.eventsFired.put(eventName, new EmptyObject());
        this.doFire(eventName, null);
    }

    private void doFire(String eventName, Object params) throws ScriptException, NoSuchMethodException {
        this.eventFired = true;
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
    public Object[] fired(String eventName) {
        if (this.eventsFired.containsKey(eventName)) {
            return this.eventsFired.getCollection(eventName).toArray(new Object[]{});
        } else {
            return new Object[]{};
        }
    }

    public int firedCount(String eventName) {
        return this.fired(eventName).length;
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
