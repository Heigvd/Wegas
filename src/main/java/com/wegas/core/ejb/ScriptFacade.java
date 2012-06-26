/*
 * Wegas.
 * http://www.albasim.com/wegas/
 *
 * School of Business and Engineering Vaud, http://www.heig-vd.ch/
 * Media Engineering :: Information Technology Managment :: Comem
 *
 * Copyright (C) 2012
 */
package com.wegas.core.ejb;

import com.wegas.core.persistence.AbstractEntity;
import com.wegas.core.persistence.game.Player;
import com.wegas.core.persistence.game.Script;
import com.wegas.core.persistence.variable.VariableDescriptor;
import com.wegas.core.persistence.variable.VariableInstance;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Map.Entry;
import javax.annotation.PostConstruct;
import javax.ejb.EJB;
import javax.ejb.LocalBean;
import javax.ejb.Stateless;
import javax.enterprise.event.Event;
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
 * @author Francois-Xavier Aeberhard <francois-xavier.aeberhard@red-agent.com>
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
    private VariableInstanceManager variableInstanceManager;
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
     * @param player
     * @param scripts A list of ScriptEntities to evaluate, all programming
     * language should be the same
     * @param arguments
     * @return
     * @throws ScriptException
     */
    public Object eval(Player player, List<Script> scripts, Map<String, AbstractEntity> arguments) throws ScriptException {
        if (scripts.isEmpty()) {
            return null;
        }

        ScriptEngineManager mgr = new ScriptEngineManager();                    // Instantiate the corresponding script engine
        ScriptEngine engine = mgr.getEngineByName(scripts.get(0).getLanguage());
        // Invocable invocableEngine = (Invocable) engine;

        variableInstanceManager.setCurrentPlayer(player);                       // Set up request's execution context
        engine.put("self", player);                                             // Inject current player

        engineInvocationEvent.fire(new EngineInvocationEvent(player, engine));  // Fires the engine invocation event, to allow extensions

        for (Entry<String, AbstractEntity> arg : arguments.entrySet()) {        // Inject the arguments
            engine.put(arg.getKey(), arg.getValue());
        }

        // @fixme test the most performant version
        Object result = null;
        String script = "";
        for (Script s : scripts) {                                              // Evaluate each script
            script += s.getContent() + ";";
            //result = engine.eval(s.getContent());
        }
        result = engine.eval(script);

        em.flush();                                                             // Commit the transaction
        variableInstanceManager.commit();

        return result;
    }

    /**
     * Default customization of our engine: inject the script library, the root
     * variable instances and some libraries.
     *
     * @param messageEvent
     */
    public void onEngineInstantiation(@Observes ScriptFacade.EngineInvocationEvent evt) throws ScriptException {
        evt.getEngine().put("VariableDescriptorFacade", variableDescriptorFacade); // Inject the variabledescriptor facade
        evt.getEngine().eval("importPackage(com.wegas.core.script)");           // Inject factory object

        for (Entry<String, String> arg : evt.getPlayer().getGameModel().getScriptLibrary().entrySet()) {        // Inject the arguments
            evt.getEngine().eval(arg.getValue());
        }

        for (VariableDescriptor vd : evt.getPlayer().getGameModel().getVariableDescriptors()) { // We inject the variable instances in the script
            VariableInstance vi = vd.getInstance(evt.getPlayer());
            evt.getEngine().put(vd.getName(), vi);
        }
    }

    // *** Sugar *** //
    /**
     *
     * @param player
     * @param s
     * @param arguments
     * @return
     * @throws ScriptException
     */
    public Object eval(Player player, Script s, Map<String, AbstractEntity> arguments) throws ScriptException {
        List<Script> scripts = new ArrayList<>();
        scripts.add(s);
        return this.eval(player, scripts, arguments);
    }

    /**
     *
     * @param playerId
     * @param s
     * @return
     * @throws ScriptException
     */
    public Object eval(Long playerId, Script s)
            throws ScriptException {
        return this.eval(playerEntityFacade.find(playerId), s);
    }

    /**
     *
     * @param p
     * @param s
     * @return
     * @throws ScriptException
     */
    public Object eval(Player p, List<Script> s) throws ScriptException {
        return this.eval(p, s, new HashMap<String, AbstractEntity>());
    }

    /**
     *
     * @param p
     * @param s
     * @return
     * @throws ScriptException
     */
    public Object eval(Player p, Script s) throws ScriptException {
        return this.eval(p, s, new HashMap<String, AbstractEntity>());
    }

    public class EngineInvocationEvent {

        private Player player;
        private ScriptEngine engine;

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
