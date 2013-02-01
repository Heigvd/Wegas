/*
 * Wegas
 * http://www.albasim.com/wegas/
 *
 * Copyright (c) 2013 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.core.ejb;

import com.wegas.core.persistence.AbstractEntity;
import com.wegas.core.persistence.game.Player;
import com.wegas.core.persistence.game.Script;
import com.wegas.core.persistence.variable.VariableDescriptor;
import com.wegas.core.persistence.variable.VariableInstance;
import com.wegas.exception.WegasException;
import com.wegas.exception.WegasScriptException;
import java.util.*;
import java.util.Map.Entry;
import javax.annotation.PostConstruct;
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
public class ScriptFacade {

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
    @PostConstruct
    public void onConstruct() {
    }

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
    public Object eval(List<Script> scripts, Map<String, AbstractEntity> arguments) throws ScriptException, WegasException {
        while (scripts.remove(null)) {
        }                                           //remove null scripts
        if (scripts.isEmpty()) {
            return null;
        }

        ScriptEngineManager mgr = new ScriptEngineManager();                    // Instantiate the corresponding script engine
        ScriptEngine engine;
        try {
            engine = mgr.getEngineByName(scripts.get(0).getLanguage());
        } catch (NullPointerException ex) {
            logger.error("Wrong language ?", ex.getMessage(), ex.getStackTrace());
            return null;
        }
        // Invocable invocableEngine = (Invocable) engine;

        engine.put("self", requestManager.getPlayer());                         // Inject current player
        Object result = null;
        try {
            engineInvocationEvent.fire(
                    new EngineInvocationEvent(requestManager.getPlayer(), engine)); // Fires the engine invocation event, to allow extensions
        } catch (ObserverException ex) {
            throw (WegasException) ex.getCause();
        } finally {                                                               //Try finishing evaluation
            for (Entry<String, AbstractEntity> arg : arguments.entrySet()) {    // Inject the arguments
                engine.put(arg.getKey(), arg.getValue());
            }

            // @fixme test the most performant version

            String script = "";
            for (Script s : scripts) {                                          // Evaluate each script
                try {
                    script += s.getContent() + ";";
                } catch (NullPointerException ex) {
                    //script does not exist
                }
                //result = engine.eval(s.getContent());
            }
            try {
                result = engine.eval(script);
            } catch (ScriptException ex) {
                logger.warn("{} in\n{}", ex.getMessage(), script);
                requestManager.addException(new WegasScriptException(script, ex.getLineNumber(), ex.getMessage()));
                throw new ScriptException(ex.getMessage(), script, ex.getLineNumber());
            }
        }
        return result;
    }

    /**
     * Default customization of our engine: inject the script library, the root
     * variable instances and some libraries.
     *
     * @param evt
     * @throws ScriptException
     * @throws WegasException
     */
    public void onEngineInstantiation(@Observes ScriptFacade.EngineInvocationEvent evt) throws ScriptException, WegasException {
        evt.getEngine().put("VariableDescriptorFacade", variableDescriptorFacade); // Inject the variabledescriptor facade

        List<String> errorVariable = new ArrayList<>();

        for (Entry<String, String> arg
                : evt.getPlayer().getGameModel().getScriptLibrary().entrySet()) { // Inject the script library
            try {
                evt.getEngine().eval(arg.getValue());
            } catch (ScriptException ex) {
                logger.warn("Error injecting script library: {} in\n{}", ex.getMessage(), arg.getValue());
                throw new ScriptException(ex.getMessage(), arg.getValue(), ex.getLineNumber());
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
     * @param s
     * @param arguments
     * @return
     * @throws ScriptException
     * @throws WegasException
     */
    public Object eval(Script s, Map<String, AbstractEntity> arguments) throws ScriptException, WegasException {
        List<Script> scripts = new ArrayList<>();
        scripts.add(s);
        return this.eval(scripts, arguments);
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

    /**
     *
     */
    public class EngineInvocationEvent {

        private Player player;
        private ScriptEngine engine;

        /**
         *
         * @param player
         * @param engine
         */
        public EngineInvocationEvent(Player player, ScriptEngine engine) {
            this.player = player;
            this.engine = engine;
        }

        /**
         * @return the engine
         */
        public ScriptEngine getEngine() {
            return engine;
        }

        /**
         * @param engine the engine to set
         */
        public void setEngine(ScriptEngine engine) {
            this.engine = engine;
        }

        /**
         * @return the player
         */
        public Player getPlayer() {
            return player;
        }

        /**
         * @param player the player to set
         */
        public void setPlayer(Player player) {
            this.player = player;
        }
    }
}
