package com.wegas.core.ejb.api;

public interface DelayedScriptEventFacadeI {

    /**
     * @param minutes
     * @param seconds   [s]
     * @param eventName event to fire
     */
    void delayedFire(long minutes, long seconds, String eventName);
    
}