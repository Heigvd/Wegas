package com.wegas.core.ejb.api;

import com.wegas.core.exception.client.WegasScriptException;

public interface ScriptEventFacadeI {

    /**
     * @param eventName
     * @param param
     * @throws com.wegas.core.exception.client.WegasScriptException
     */
    void fire(String eventName, Object param) throws WegasScriptException;

    /**
     * @param eventName
     * @throws com.wegas.core.exception.client.WegasScriptException
     */
    void fire(String eventName) throws WegasScriptException;

    /**
     * @param eventName
     * @return
     */
    boolean fired(String eventName);

    /**
     * @param eventName
     * @param func
     * @param scope
     */
    void on(String eventName, Object func, Object scope);

    /**
     * @param eventName
     * @param func
     */
    void on(String eventName, Object func);
    
}