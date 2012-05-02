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
import com.wegas.core.ejb.VariableDescriptorFacade;
import com.wegas.core.persistence.AbstractEntity;
import com.wegas.core.persistence.game.GameModelEntity;
import com.wegas.core.persistence.game.PlayerEntity;
import com.wegas.core.persistence.variable.VariableDescriptorEntity;
import com.wegas.core.persistence.variable.VariableInstanceEntity;
import com.wegas.messaging.ejb.MessagingManager;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Map.Entry;
import java.util.logging.Level;
import java.util.logging.Logger;
import javax.ejb.EJB;
import javax.ejb.LocalBean;
import javax.ejb.Stateless;
import javax.script.ScriptEngine;
import javax.script.ScriptEngineFactory;
import javax.script.ScriptEngineManager;
import javax.script.ScriptException;

/**
 *
 * @author Francois-Xavier Aeberhard <francois-xavier.aeberhard@red-agent.com>
 */
@Stateless
@LocalBean
public class ScriptManager {
    /**
     *
     */
    @EJB
    private VariableDescriptorFacade variableDescriptorFacade;

    /**
     *
     */
    @EJB
    private PlayerFacade playerEntityFacade;
    /**
     *
     */
    @EJB
    private MessagingManager messagingManager;

    /**
     *
     * @param playerId
     * @param s
     * @return
     */
    public List<VariableInstanceEntity> eval(Long playerId, ScriptEntity s)
            throws ScriptException {
        return this.eval(playerEntityFacade.find(playerId), s);
    }

    /**
     *
     * @param p
     * @param s
     * @param arguments
     * @return
     */
    public List<VariableInstanceEntity> eval(PlayerEntity p, ScriptEntity s) throws ScriptException {
        return this.eval(p, s, new HashMap<String, AbstractEntity>());
    }

    /**
     *
     * @param player
     * @param s
     * @param arguments
     * @return
     */
    public List<VariableInstanceEntity> eval(PlayerEntity player, ScriptEntity s, Map<String, AbstractEntity> arguments)
            throws ScriptException {
        ScriptEngineManager mgr = new ScriptEngineManager();
        ScriptEngine engine = mgr.getEngineByName(s.getLanguage());
        // Invocable invocableEngine = (Invocable) engine;
        GameModelEntity gm = player.getTeam().getGame().getGameModel();
        List<VariableInstanceEntity> vis = new ArrayList<>();

        engine.put("self", player);                                              // Inject constants

        for (Entry<String, AbstractEntity> arg : arguments.entrySet()) {    // Inject the arguments
            engine.put(arg.getKey(), arg.getValue());
        }

       // for (VariableDescriptorEntity vd : gm.getVariableDescriptors()) {   // We inject the variable instances in the script
          for (VariableDescriptorEntity vd : variableDescriptorFacade.findByRootGameModelId(gm.getId())) {   // We inject the variable instances in the script
            VariableInstanceEntity vi = vd.getVariableInstance(player);
            engine.put(vd.getName(), vi);
            vis.add(vi);
        }

        engine.eval(s.getContent());
        return vis;
    }

    /**
     *
     * @param gameModelId
     * @param playerId
     * @param s
     * @return
     */
    public Object eval(Long gameModelId, Long playerId, ScriptEntity s) {
        ScriptEngineManager mgr = new ScriptEngineManager();
        ScriptEngine engine = mgr.getEngineByName(s.getLanguage());
        // Invocable invocableEngine = (Invocable) engine;
        // GameModelEntity gm = gameModelEntityFacade.find(gameModelId);
        PlayerEntity p = playerEntityFacade.find(playerId);
        GameModelEntity gm = p.getTeam().getGame().getGameModel();
        Object result = null;

        try {
            engine.put("self", p);                                              // Inject the constants
            engine.put("messaging", messagingManager);

            for (VariableDescriptorEntity vd : gm.getVariableDescriptors()) {   // We inject the variable instances in the script
                VariableInstanceEntity vi = vd.getVariableInstance(p);
                engine.put(vd.getName(), vi);
            }
            result = engine.eval(s.getContent());                    // Then we evaluate the script
            Logger.getLogger(ScriptManager.class.getName()).log(Level.INFO, "Evaluation result: {0}", result);

        }
        catch (ScriptException ex) {
            Logger.getLogger(ScriptManager.class.getName()).log(Level.SEVERE, null, ex);
        }
        return result;
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
