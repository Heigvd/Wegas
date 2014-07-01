/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.core.ejb;

import com.wegas.core.event.internal.EngineInvocationEvent;
import com.wegas.core.exception.WegasException;
import com.wegas.core.persistence.AbstractEntity;
import com.wegas.core.persistence.game.GameModelContent;
import com.wegas.core.persistence.game.Player;
import com.wegas.core.persistence.game.Script;
import com.wegas.core.persistence.variable.VariableDescriptor;
import com.wegas.core.persistence.variable.VariableInstance;
import java.io.FileNotFoundException;
import java.io.Serializable;
import java.util.*;
import java.util.Map.Entry;
import javax.ejb.EJB;
import javax.ejb.LocalBean;
import javax.ejb.Stateless;
import javax.enterprise.event.Event;
import javax.enterprise.event.ObserverException;
import javax.enterprise.event.Observes;
import javax.inject.Inject;
import javax.persistence.EntityManager;
import javax.persistence.PersistenceContext;
import javax.script.ScriptEngine;
import javax.script.ScriptEngineManager;
import javax.script.ScriptException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 *
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
@Stateless
@LocalBean
public class ScriptFacade implements Serializable {

    private static final Logger logger = LoggerFactory.getLogger(ScriptFacade.class);
    /**
     *
     */
    @PersistenceContext(unitName = "wegasPU")
    private EntityManager em;
    /**
     *
     */
    @EJB
    private PlayerFacade playerEntityFacade;
    /**
     *
     */
    @EJB
    private VariableDescriptorFacade variableDescriptorFacade;
    /**
     *
     */
    @Inject
    private ScriptEventFacade event;
    /**
     *
     */
    @Inject
    private RequestManager requestManager;
    /**
     *
     */
    @Inject
    Event<EngineInvocationEvent> engineInvocationEvent;

    /**
     *
     * Fires an engineInvocationEvent, which should be intercepted to customize
     * engine scope.
     *
     * @param script
     * @param arguments
     * @return
     * @throws ScriptException
     * @throws WegasException
     */
    public Object eval(Script script, Map<String, AbstractEntity> arguments) throws ScriptException, WegasException {
        if (script == null) {
            return null;
        }
        ScriptEngine engine = requestManager.getCurrentEngine();
        if (engine == null) {
            ScriptEngineManager mgr = new ScriptEngineManager();                // Instantiate the corresponding script engine

            try {
                engine = mgr.getEngineByName(script.getLanguage());
                // Invocable invocableEngine = (Invocable) engine;
            } catch (NullPointerException ex) {
                logger.error("Could not find language", ex.getMessage(), ex.getStackTrace());
                throw new WegasException("Could not instantiate script engine for script" + script);
            }
            try {
                engineInvocationEvent.fire(
                        new EngineInvocationEvent(requestManager.getPlayer(), engine));// Fires the engine invocation event, to allow extensions

            } catch (ObserverException ex) {
                throw (WegasException) ex.getCause();
            }
            requestManager.setCurrentEngine(engine);
        }

        for (Entry<String, AbstractEntity> arg : arguments.entrySet()) {        // Inject the arguments
            engine.put(arg.getKey(), arg.getValue());
        }

        try {
            engine.put(ScriptEngine.FILENAME, script.getContent()); //@TODO: JAVA 8 filename in scope
            return engine.eval(script.getContent());
        } catch (ScriptException ex) {
//            requestManager.addException(
//                    new com.wegas.core.exception.ScriptException(script.getContent(), ex.getLineNumber(), ex.getMessage()));
//            throw new ScriptException(ex.getMessage(), script.getContent(), ex.getLineNumber());
            throw new com.wegas.core.exception.ScriptException(script.getContent(), ex.getLineNumber(), ex.getMessage());
        }
    }

    /**
     * Default customization of our engine: inject the script library, the root
     * variable instances and some libraries.
     *
     * @param evt
     * @throws ScriptException
     * @throws WegasException
     */
    public void onEngineInstantiation(@Observes EngineInvocationEvent evt) throws ScriptException {
        evt.getEngine().put("self", evt.getPlayer());                           // Inject current player
        evt.getEngine().put("gameModel", evt.getPlayer().getGameModel());       // Inject current gameModel
        evt.getEngine().put("Variable", variableDescriptorFacade);              // Inject the variabledescriptor facade
        evt.getEngine().put("VariableDescriptorFacade", variableDescriptorFacade);// @backwardcompatibility
        evt.getEngine().put("RequestManager", requestManager);                  // Inject the request manager
        evt.getEngine().put("Event", event);                                    // Inject the Event manager
        event.detachAll();
        this.injectStaticScript(evt);
        for (Entry<String, GameModelContent> arg
                : evt.getPlayer().getGameModel().getScriptLibrary().entrySet()) { // Inject the script library
            evt.getEngine().put(ScriptEngine.FILENAME, "Server script " + arg.getKey()); //@TODO: JAVA 8 filename in scope
            try {
                evt.getEngine().eval(arg.getValue().getContent());
            } catch (ScriptException ex) {
                throw new com.wegas.core.exception.ScriptException("Server script " + arg.getKey(), ex.getLineNumber(), ex.getMessage());
            }
        }

        for (VariableDescriptor vd
                : evt.getPlayer().getGameModel().getChildVariableDescriptors()) { // Inject the variable instances in the script
            VariableInstance vi = vd.getInstance(evt.getPlayer());
            try {
                evt.getEngine().put(vd.getName(), vi);
            } catch (IllegalArgumentException ex) {
                //logger.error("Missing name for Variable label [" + vd.getLabel() + "]");
            }
        }
    }

    /**
     * Inject script files specified in GameModel's property scriptFiles into
     * engine
     *
     * @param evt EngineInvocationEvent
     * @throws ScriptException
     */
    private void injectStaticScript(EngineInvocationEvent evt) throws ScriptException {
        String currentPath = getClass().getProtectionDomain().getCodeSource().getLocation().getPath();
        Integer index = currentPath.indexOf("WEB-INF");
        if (index < 1) { // @ TODO find an other way to get web app root currently war packaging required.
            return;
        }
        String root = currentPath.substring(0, index);
        String[] files = new String[0];
        if (evt.getPlayer().getGameModel().getProperties().getScriptUri() != null) { //@TODO : precompile? cache ?
            files = evt.getPlayer().getGameModel().getProperties().getScriptUri().split(";");
        }
        for (String f : files) {
            evt.getEngine().put(ScriptEngine.FILENAME, "Script file " + f); //@TODO: JAVA 8 filename in scope
            try {
                evt.getEngine().eval(new java.io.FileReader(root + f));
            } catch (FileNotFoundException ex) {
                logger.warn("File " + root + f + " was not found");
            } catch (ScriptException ex) {
                throw new com.wegas.core.exception.ScriptException(f, ex.getLineNumber(), ex.getMessage());
            }
        }
    }

    // *** Sugar *** //
    /**
     *
     * @param scripts
     * @param arguments
     * @return
     * @throws ScriptException
     * @throws WegasException
     */
    public Object eval(List<Script> scripts, Map<String, AbstractEntity> arguments) throws ScriptException, WegasException {
        if (scripts.isEmpty()) {
            return null;
        }
        while (scripts.remove(null)) {
        }                                                                        //remove null scripts
        // @fixme test the most performant version
        StringBuilder buf = new StringBuilder();
        for (Script s : scripts) {                                              // Evaluate each script
            try {
                buf.append(s.getContent());
                buf.append(";");
            } catch (NullPointerException ex) {
                //script does not exist
            }
            //result = engine.eval(s.getContent());
        }
        return this.eval(new Script(buf.toString()));
    }

    /**
     *
     * @param scripts
     * @return
     * @throws ScriptException
     * @throws WegasException
     */
    public Object eval(List<Script> scripts) throws ScriptException, WegasException {
        return this.eval(scripts, new HashMap<String, AbstractEntity>());
    }

    /**
     *
     * @param p
     * @param s
     * @return
     * @throws ScriptException
     * @throws WegasException
     */
    public Object eval(Player p, Script s) throws ScriptException, WegasException {
        requestManager.setPlayer(p);
        return this.eval(s);
    }

    /**
     *
     * @param p
     * @param s
     * @return
     * @throws ScriptException
     * @throws WegasException
     */
    public Object eval(Player p, List<Script> s) throws ScriptException, WegasException {
        requestManager.setPlayer(p);
        return this.eval(s);
    }

    /**
     *
     * @param player
     * @param s
     * @param arguments
     * @return
     * @throws ScriptException
     * @throws WegasException
     */
    public Object eval(Player player, Script s, Map<String, AbstractEntity> arguments) throws ScriptException, WegasException {
        requestManager.setPlayer(player);
        return this.eval(s, arguments);
    }

    /**
     *
     * @param player
     * @param scripts
     * @param arguments
     * @return
     * @throws ScriptException
     * @throws WegasException
     */
    public Object eval(Player player, List<Script> scripts, Map<String, AbstractEntity> arguments) throws ScriptException, WegasException {
        requestManager.setPlayer(player);                                       // Set up request's execution context
        return this.eval(scripts, arguments);
    }

    /**
     *
     * @param playerId
     * @param s
     * @return
     * @throws ScriptException
     * @throws WegasException
     */
    public Object eval(Long playerId, Script s) throws ScriptException, WegasException {
        requestManager.setPlayer(playerEntityFacade.find(playerId));
        return this.eval(s);
    }

    /**
     *
     * @param s
     * @return
     * @throws ScriptException
     * @throws WegasException
     */
    public Object eval(Script s) throws ScriptException, WegasException {
        return this.eval(s, new HashMap<String, AbstractEntity>());
    }
}
