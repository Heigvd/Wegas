/*
 * Wegas.
 * http://www.albasim.com/wegas/
 *
 * School of Business and Engineering Vaud, http://www.heig-vd.ch/
 * Media Engineering :: Information Technology Managment :: Comem
 *
 * Copyright (C) 2012
 */
package com.wegas.core.script;

import com.wegas.core.ejb.PlayerFacade;
import com.wegas.core.ejb.VariableInstanceManager;
import com.wegas.core.persistence.AbstractEntity;
import com.wegas.core.persistence.game.GameModel;
import com.wegas.core.persistence.game.Player;
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
import javax.inject.Inject;
import javax.persistence.EntityManager;
import javax.persistence.PersistenceContext;
import javax.script.ScriptEngine;
import javax.script.ScriptEngineFactory;
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
//    @EJB
//    private MessagingManager messagingManager;
    /**
     *
     */
    @Inject
    private VariableInstanceManager variableInstanceManager;

    /**
     *
     */
    @PostConstruct
    public void onConstruct() {
    }

    /**
     *
     * @param player
     * @param scripts A list of ScriptEntities to evaluate, all programming
     * language should be the same
     * @param arguments
     * @return
     * @throws ScriptException
     */
    public Object eval(Player player, List<ScriptEntity> scripts, Map<String, AbstractEntity> arguments) throws ScriptException {
        if (scripts.isEmpty()) {
            return null;
        }
        arguments = (Map<String, AbstractEntity>) (arguments != null ? arguments : new HashMap<>());
        ScriptEngineManager mgr = new ScriptEngineManager();
        ScriptEngine engine = mgr.getEngineByName(scripts.get(0).getLanguage());
        // Invocable invocableEngine = (Invocable) engine;
        GameModel gm = player.getGameModel();
        List<VariableInstance> vis = new ArrayList<VariableInstance>();

        variableInstanceManager.setCurrentPlayer(player);                                // Set up request execution context
        variableInstanceManager.setGameModel(gm);
        engine.put("self", player);                                             // Inject constants

        for (Entry<String, AbstractEntity> arg : arguments.entrySet()) {        // Inject the arguments
            engine.put(arg.getKey(), arg.getValue());
        }

        for (VariableDescriptor vd : gm.getVariableDescriptors()) {       // We inject the variable instances in the script
            VariableInstance vi = vd.getVariableInstance(player);
            engine.put(vd.getName(), vi);
        }
        String script = "";
        for (ScriptEntity scriptEntity : scripts) {
            script += scriptEntity.getContent() + ";";
        }

        Object result = engine.eval(script);
        em.flush();

        variableInstanceManager.commit();

        return result;
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
    public Object eval(Player player, ScriptEntity s, Map<String, AbstractEntity> arguments) throws ScriptException {
        List<ScriptEntity> scripts = new ArrayList<>();
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
    public Object eval(Long playerId, ScriptEntity s)
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
    public Object eval(Player p, ScriptEntity s) throws ScriptException {
        return this.eval(p, s, new HashMap<String, AbstractEntity>());
    }
    /*
     * Object invokeFunction = invocableEngine.invokeFunction("sayHello");
     * InputStream is = this.getClass().getResourceAsStream("/scripts/F1.js");
     * try { Reader reader = new InputStreamReader(is); engine.eval(reader); }
     * catch (ScriptException ex) { ex.printStackTrace(); }
     */
    /*
     * List<String> namesList = new ArrayList<String>(); namesList.add("Jill");
     * namesList.add("Bob"); namesList.add("Laureen"); namesList.add("Ed");
     * engine.put("namesListKey", namesList); System.out.println("Executing in
     * script environment..."); try { engine.eval("var x;" + "var names =
     * namesListKey.toArray();" + "for(x in names) {" + " println(names[x]);" +
     * "}" + "namesListKey.add(\"Dana\");"); } catch (ScriptException ex) {
     * ex.printStackTrace(); } System.out.println("Executing in Java
     * environment..."); for (String name : namesList) {
     * System.out.println(name); }
     *
     * try { engine.eval("function printNames1(namesList) {" + " var x;" + " var
     * names = namesList.toArray();" + " for(x in names) {" + "
     * println(names[x]);" + " }" + "}" + "function addName(namesList, name) {"
     * + " namesList.add(name);" + "}");
     * invocableEngine.invokeFunction("printNames1", namesList);
     * invocableEngine.invokeFunction("addName", namesList, "Dana"); } catch
     * (ScriptException ex) { ex.printStackTrace(); } catch
     * (NoSuchMethodException ex) { ex.printStackTrace(); }
     *
     * try { engine.eval("importPackage(javax.swing);" + "var optionPane = " + "
     * JOptionPane.showMessageDialog(null, 'Hello, world!');"); } catch
     * (ScriptException ex) { ex.printStackTrace(); }
     */

    /**
     *
     * @param s
     */
    public static void getAvailableScripts(ScriptEntity s) {
        ScriptEngineManager mgr = new ScriptEngineManager();
        List<ScriptEngineFactory> factories = mgr.getEngineFactories();
        ScriptEngine engine;

        for (ScriptEngineFactory factory : factories) {
            System.out.println("ScriptEngineFactory Info");
            String engName = factory.getEngineName();
            String engVersion = factory.getEngineVersion();
            String langName = factory.getLanguageName();
            String langVersion = factory.getLanguageVersion();
            System.out.printf("\tScript Engine: %s (%s)\n",
                    engName, engVersion);
            List<String> engNames = factory.getNames();
            for (String name : engNames) {
                System.out.printf("\tEngine Alias: %s\n", name);
            }
            System.out.printf("\tLanguage: %s (%s)\n",
                    langName, langVersion);
        }

        /*
         * List<ScriptEngineFactory> scriptFactories = mgr.getEngineFactories();
         * for (ScriptEngineFactory factory : scriptFactories) { String langName
         * = factory.getLanguageName(); String langVersion =
         * factory.getLanguageVersion(); if (langName.equals("ECMAScript") &&
         * langVersion.equals("1.6")) { engine = factory.getScriptEngine();
         * break; } } * langVersion.equals("1.6")
         *
         *
         * ) { engine = factory.getScriptEngine(); break; } }
         *
         */
    }
}
