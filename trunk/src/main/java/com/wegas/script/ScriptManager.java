/*
 * Wegas. 
 * http://www.albasim.com/wegas/
 * 
 * School of Business and Engineering Vaud, http://www.heig-vd.ch/
 * Media Engineering :: Information Technology Managment :: Comem⁺
 *
 * Copyright (C) 2011 
 */
package com.wegas.script;

import com.wegas.ejb.GameModelManager;
import com.wegas.ejb.VariableDescriptorManager;
import com.wegas.ejb.VariableInstanceManager;
import com.wegas.persistence.GameModelEntity;
import com.wegas.persistence.variabledescriptor.VariableDescriptorEntity;
import com.wegas.persistence.variableinstance.VariableInstanceEntity;
import java.util.ArrayList;
import java.util.List;
import java.util.logging.Level;
import java.util.logging.Logger;
import javax.ejb.EJB;
import javax.ejb.LocalBean;
import javax.ejb.Stateless;
import javax.script.Invocable;
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

    @EJB
    private GameModelManager gmm;
    @EJB
    private VariableInstanceManager vim;
    @EJB
    private VariableDescriptorManager vdm;

    /**
     * 
     * @param gameModelId
     * @param playerId
     * @param s
     */
    public void runScript(Long gameModelId, Long playerId, ScriptEntity s) {
        ScriptEngineManager mgr = new ScriptEngineManager();
        ScriptEngine engine = mgr.getEngineByName("JavaScript");
        Invocable invocableEngine = (Invocable) engine;

        try {
            GameModelEntity gm = gmm.getGameModel(gameModelId);
            List<VariableInstanceEntity> vis = new ArrayList<VariableInstanceEntity>();
            for (VariableDescriptorEntity vd : gm.getVariableDescriptors()) {
                VariableInstanceEntity vi = vd.getVariableInstance(playerId);
                engine.put(vd.getName(), vi);                                   // We inject the variable instances in the script
                vis.add(vi);
            }
            engine.eval("println(timeCards);");
            engine.eval("println(timeCards.content);");
            engine.eval(s.getContent());                                        // Then we evaluate the script itself
            
            engine.eval("println(timeCards);");
            
            engine.eval("println(timeCards.content);");
        } catch (ScriptException ex) {
            Logger.getLogger(ScriptManager.class.getName()).log(Level.SEVERE, null, ex);
        }
    }
    /*
    Object invokeFunction = invocableEngine.invokeFunction("sayHello");
    InputStream is = this.getClass().getResourceAsStream("/scripts/F1.js");
    try {
    Reader reader = new InputStreamReader(is);
    engine.eval(reader);
    } catch (ScriptException ex) {
    ex.printStackTrace();
    }
     */
    /*
    List<String> namesList = new ArrayList<String>();
    namesList.add("Jill");
    namesList.add("Bob");
    namesList.add("Laureen");
    namesList.add("Ed");
    engine.put("namesListKey", namesList);
    System.out.println("Executing in script environment...");
    try {
    engine.eval("var x;"
    + "var names = namesListKey.toArray();"
    + "for(x in names) {"
    + "  println(names[x]);"
    + "}"
    + "namesListKey.add(\"Dana\");");
    } catch (ScriptException ex) {
    ex.printStackTrace();
    }
    System.out.println("Executing in Java environment...");
    for (String name : namesList) {
    System.out.println(name);
    }
    
    try {
    engine.eval("function printNames1(namesList) {"
    + "  var x;"
    + "  var names = namesList.toArray();"
    + "  for(x in names) {"
    + "    println(names[x]);"
    + "  }"
    + "}"
    + "function addName(namesList, name) {"
    + "  namesList.add(name);"
    + "}");
    invocableEngine.invokeFunction("printNames1", namesList);
    invocableEngine.invokeFunction("addName", namesList, "Dana");
    } catch (ScriptException ex) {
    ex.printStackTrace();
    } catch (NoSuchMethodException ex) {
    ex.printStackTrace();
    }
    
    try {
    engine.eval("importPackage(javax.swing);"
    + "var optionPane = "
    + "  JOptionPane.showMessageDialog(null, 'Hello, world!');");
    } catch (ScriptException ex) {
    ex.printStackTrace();
    }
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
        List<ScriptEngineFactory> scriptFactories =
        mgr.getEngineFactories();
        for (ScriptEngineFactory factory : scriptFactories) {
        String langName = factory.getLanguageName();
        String langVersion = factory.getLanguageVersion();
        if (langName.equals("ECMAScript")
        && langVersion.equals("1.6")) {
        engine = factory.getScriptEngine();
        break;
        }
        }*/
    }
}
