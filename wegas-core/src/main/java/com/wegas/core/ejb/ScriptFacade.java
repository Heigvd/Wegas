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
import java.io.File;
import java.io.FileInputStream;
import java.io.FileNotFoundException;
import java.io.InputStreamReader;
import java.io.Serializable;
import java.io.UnsupportedEncodingException;
import java.nio.file.Files;
import java.util.*;
import java.util.Map.Entry;
import java.util.logging.Level;
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

    private static final long serialVersionUID = 1L;
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
     * @throws WegasException
     */
    public Object eval(Script script, Map<String, AbstractEntity> arguments) throws WegasException {
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
     */
    public void onEngineInstantiation(@Observes EngineInvocationEvent evt) {
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
    private void injectStaticScript(EngineInvocationEvent evt) {
        String currentPath = getClass().getProtectionDomain().getCodeSource().getLocation().getPath();
        Integer index = currentPath.indexOf("WEB-INF");
        if (index < 1) { // @ TODO find an other way to get web app root currently war packaging required.
            return;
        }
        String root = currentPath.substring(0, index);

        String[] files = new String[0];
        String scriptURI = evt.getPlayer().getGameModel().getProperties().getScriptUri();
        if (scriptURI != null && !scriptURI.equals("")) {
            files = evt.getPlayer().getGameModel().getProperties().getScriptUri().split(";");
        }

        for (String f : getJavaScriptsRecursively(root, files)) {
            evt.getEngine().put(ScriptEngine.FILENAME, "Script file " + f); //@TODO: JAVA 8 filename in scope
            try {

                java.io.FileInputStream fis = new FileInputStream(f);
                java.io.InputStreamReader isr = new InputStreamReader(fis, "UTF8");

                evt.getEngine().eval(isr);
                logger.info("File " + f + " successfully injected");
            } catch (FileNotFoundException ex) {
                logger.warn("File " + f + " was not found");
            } catch (UnsupportedEncodingException ex) {
                throw new com.wegas.core.exception.ScriptException(f, ex.getMessage());
            } catch (ScriptException ex) {
                throw new com.wegas.core.exception.ScriptException(f, ex.getLineNumber(), ex.getMessage());
            }
        }
    }

    /**
     * extract all javascript files from the files list. If one of the files is
     * a directory, recurse through it and fetch *.js.
     *
     * Note: When iterating, if a script and its minified version stands in the
     * directory, the minified is ignored (debugging purpose)
     *
     * @param root
     * @param files
     * @return
     */
    private Collection<String> getJavaScriptsRecursively(String root, String[] files) {
        List<File> queue = new LinkedList<>();
        List<String> result = new LinkedList<>();

        for (String file : files) {
            File f = new File(root + "/" + file);
            // Put directories in the recurse queue and files in result list
            // this test may look redundant with the one done bellow... but...
            // actually, it ensures a -min.js script given by the user is never ignored
            if (f.isDirectory()) {
                queue.add(f);
            } else {
                result.add(f.getPath());
            }
        }

        while (queue.size() > 0) {
            File current = queue.remove(0);

            if (!Files.isSymbolicLink(current.toPath()) && current.canRead()) {
                if (current.isDirectory()) {
                    File[] listFiles = current.listFiles();
                    if (listFiles == null) {
                        break;
                    } else {
                        queue.addAll(Arrays.asList(listFiles));
                    }
                } else {
                    if (current.isFile()
                            && current.getName().endsWith(".js") // Is a javascript
                            && !isMinifedDuplicata(current)) { // avoid minified version when original exists
                        result.add(current.getPath());
                    }
                }
            }
        }
        return result;
    }

    /**
     * check if the given file is a minified version of an existing one
     *
     * @param file
     * @return
     */
    private boolean isMinifedDuplicata(File file) {
        if (file.getName().endsWith("-min.js")) {
            String siblingPath = file.getPath().replaceAll("-min.js$", ".js");
            File f = new File(siblingPath);
            return f.exists();
        }
        return false;
    }

    // *** Sugar *** //
    /**
     *
     * @param scripts
     * @param arguments
     * @return
     * @throws WegasException
     */
    public Object eval(List<Script> scripts, Map<String, AbstractEntity> arguments) throws WegasException {
        Object ret;
        if (scripts.isEmpty()) {
            return null;
        }
        while (scripts.remove(null)) {
        }                                                                        //remove null scripts
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
     * @throws WegasException
     */
    public Object eval(List<Script> scripts) throws WegasException {
        return this.eval(scripts, new HashMap<String, AbstractEntity>());
    }

    /**
     *
     * @param p
     * @param s
     * @return
     * @throws WegasException
     */
    public Object eval(Player p, Script s) throws WegasException {
        requestManager.setPlayer(p);
        return this.eval(s);
    }

    /**
     *
     * @param p
     * @param s
     * @return
     * @throws WegasException
     */
    public Object eval(Player p, List<Script> s) throws WegasException {
        requestManager.setPlayer(p);
        return this.eval(s);
    }

    /**
     *
     * @param player
     * @param s
     * @param arguments
     * @return
     * @throws WegasException
     */
    public Object eval(Player player, Script s, Map<String, AbstractEntity> arguments) throws WegasException {
        requestManager.setPlayer(player);
        return this.eval(s, arguments);
    }

    /**
     *
     * @param player
     * @param scripts
     * @param arguments
     * @return
     * @throws WegasException
     */
    public Object eval(Player player, List<Script> scripts, Map<String, AbstractEntity> arguments) throws WegasException {
        requestManager.setPlayer(player);                                       // Set up request's execution context
        return this.eval(scripts, arguments);
    }

    /**
     *
     * @param playerId
     * @param s
     * @return
     * @throws WegasException
     */
    public Object eval(Long playerId, Script s) throws WegasException {
        requestManager.setPlayer(playerEntityFacade.find(playerId));
        return this.eval(s);
    }

    /**
     *
     * @param s
     * @return
     * @throws WegasException
     */
    public Object eval(Script s) throws WegasException {
        return this.eval(s, new HashMap<String, AbstractEntity>());
    }
}
