/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.core.ejb;

import com.wegas.core.event.EngineInvocationEvent;
import com.wegas.core.exception.WegasException;
import com.wegas.core.persistence.AbstractEntity;
import com.wegas.core.persistence.game.GameModelContent;
import com.wegas.core.persistence.game.Player;
import com.wegas.core.persistence.game.Script;
import com.wegas.core.persistence.variable.VariableDescriptor;
import com.wegas.core.persistence.variable.VariableInstance;
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
    private RequestManager requestManager;
    /**
     *
     */
    @Inject
    Event<EngineInvocationEvent> engineInvocationEvent;

    /**
     *
     */
    //@PostConstruct
    //public void onConstruct() {
    //}
    /**
     *
     * Fires an engineInvocationEvent, which should be intercepted to customize
     * engine scope.
     *
     * @param scripts A list of ScriptEntities to evaluate, all programming
     * language should be the same
     * @param arguments
     * @return
     * @throws ScriptException
     * @throws WegasException
     */
    public Object eval(Script script, Map<String, AbstractEntity> arguments) throws ScriptException, WegasException {
        ScriptEngineManager mgr = new ScriptEngineManager();                    // Instantiate the corresponding script engine
        ScriptEngine engine;
        try {
            engine = mgr.getEngineByName(script.getLanguage());
        } catch (NullPointerException ex) {
            logger.error("Could not find language", ex.getMessage(), ex.getStackTrace());
            throw new WegasException("Could not instantiate script engine for script" + script);
        }
        // Invocable invocableEngine = (Invocable) engine;

        try {
            engineInvocationEvent.fire(new EngineInvocationEvent(requestManager.getPlayer(), engine));// Fires the engine invocation event, to allow extensions

        } catch (ObserverException ex) {
            throw (WegasException) ex.getCause();
        } finally {                                                             //Try finishing evaluation
            for (Entry<String, AbstractEntity> arg : arguments.entrySet()) {    // Inject the arguments
                engine.put(arg.getKey(), arg.getValue());
            }

            try {
                return engine.eval(script.getContent());
            } catch (ScriptException ex) {
                logger.warn("{} in\n{}", ex.getMessage(), script.getContent());
                requestManager.addException(
                        new com.wegas.core.exception.ScriptException(script.getContent(), ex.getLineNumber(), ex.getMessage()));
                throw new ScriptException(ex.getMessage(), script.getContent(), ex.getLineNumber());
            }
        }
    }

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
     * Default customization of our engine: inject the script library, the root
     * variable instances and some libraries.
     *
     * @param evt
     * @throws ScriptException
     * @throws WegasException
     */
    public void onEngineInstantiation(@Observes EngineInvocationEvent evt) throws ScriptException, WegasException {
        evt.getEngine().put("self", evt.getPlayer());                           // Inject current player
        evt.getEngine().put("gameModel", evt.getPlayer().getGameModel());       // Inject current gameModel
        evt.getEngine().put("VariableDescriptorFacade", variableDescriptorFacade); // Inject the variabledescriptor facade
        evt.getEngine().put("RequestManager", requestManager);                  // Inject the request manager

        List<String> errorVariable = new ArrayList<>();

        for (Entry<String, GameModelContent> arg
                : evt.getPlayer().getGameModel().getScriptLibrary().entrySet()) { // Inject the script library
            try {
                evt.getEngine().eval(arg.getValue().getContent());
            } catch (ScriptException ex) {
                logger.warn("Error injecting script library: {} in\n{}", ex.getMessage(), arg.getValue());
                throw new ScriptException(ex.getMessage(), arg.getValue().getContent(), ex.getLineNumber());
            }
        }

        for (VariableDescriptor vd
                : evt.getPlayer().getGameModel().getChildVariableDescriptors()) { // Inject the variable instances in the script
            VariableInstance vi = vd.getInstance(evt.getPlayer());
            try {
                evt.getEngine().put(vd.getName(), vi);
            } catch (IllegalArgumentException ex) {
                errorVariable.add(vd.getLabel());

            }
        }
        if (errorVariable.size() > 0) {
            StringBuilder allVars = new StringBuilder();
            Iterator<String> si = errorVariable.iterator();
            while (si.hasNext()) {
                allVars.append(si.next());
                if (si.hasNext()) {
                    allVars.append(",");
                }
            }
            logger.error("Missing name for Variable label [" + allVars.toString() + "]");
            //throw new WegasException("Missing name for Variable label [" + allVars.toString() + "]");
        }
    }

    // *** Sugar *** //
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
    public Object eval(Long playerId, Script s)
            throws ScriptException, WegasException {
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
