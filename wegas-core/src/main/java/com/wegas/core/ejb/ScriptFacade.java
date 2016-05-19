/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013, 2014, 2015 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.core.ejb;

import com.wegas.core.Helper;
import com.wegas.core.event.internal.EngineInvocationEvent;
import com.wegas.core.exception.WegasErrorMessageManager;
import com.wegas.core.exception.client.WegasErrorMessage;
import com.wegas.core.exception.client.WegasRuntimeException;
import com.wegas.core.exception.client.WegasScriptException;
import com.wegas.core.persistence.AbstractEntity;
import com.wegas.core.persistence.game.GameModel;
import com.wegas.core.persistence.game.GameModelContent;
import com.wegas.core.persistence.game.Player;
import com.wegas.core.persistence.game.Script;
import com.wegas.core.persistence.variable.VariableDescriptor;
import com.wegas.core.persistence.variable.VariableInstance;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.ejb.EJB;
import javax.ejb.LocalBean;
import javax.ejb.Stateless;
import javax.enterprise.event.Event;
import javax.enterprise.event.ObserverException;
import javax.enterprise.event.Observes;
import javax.inject.Inject;
import javax.script.*;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileNotFoundException;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.util.*;
import java.util.Map.Entry;

/**
 * @author Francois-Xavier Aeberhard (fx at red-agent.com)
 */
@Stateless
@LocalBean
public class ScriptFacade {

    private static final Logger logger = LoggerFactory.getLogger(ScriptFacade.class);

    /**
     * name
     */
    public static final String CONTEXT = "currentDescriptor";

    /**
     *
     */
    @EJB
    private PlayerFacade playerFacade;

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
    @EJB
    DelayedScriptEventFacade delayedEvent;

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

    public ScriptEngine instanciateEngine(Player player, String language) {
        ScriptEngine engine = requestManager.getCurrentEngine();
        if (engine == null) {
            ScriptEngineManager mgr = new ScriptEngineManager();                // Instantiate the corresponding script engine

            try {
                engine = mgr.getEngineByName(language);
                // Invocable invocableEngine = (Invocable) engine;
            } catch (NullPointerException ex) {
                logger.error("Could not find language", ex.getMessage(), ex.getStackTrace());
                throw WegasErrorMessage.error("Could not instantiate script engine for script" + language);
            }
            try {
                engineInvocationEvent.fire(
                        new EngineInvocationEvent(player, engine));// Fires the engine invocation event, to allow extensions

            } catch (ObserverException ex) {
                throw (WegasRuntimeException) ex.getCause();
            }
            requestManager.setCurrentEngine(engine);
        }
        return engine;
    }

    /**
     * Fires an engineInvocationEvent, which should be intercepted to customize
     * engine scope.
     *
     * @param script
     * @param arguments
     * @return
     */
    private Object eval(Script script, Map<String, AbstractEntity> arguments) throws WegasScriptException {
        if (script == null) {
            return null;
        }
        ScriptEngine engine = instanciateEngine(requestManager.getPlayer(), script.getLanguage());

        for (Entry<String, AbstractEntity> arg : arguments.entrySet()) {        // Inject the arguments
            engine.put(arg.getKey(), arg.getValue());
        }

        try {
            engine.getContext().setAttribute(ScriptEngine.FILENAME, script.getContent(), ScriptContext.ENGINE_SCOPE);
            return engine.eval(script.getContent());
        } catch (ScriptException ex) {
            throw new WegasScriptException(script.getContent(), ex.getLineNumber(), ex.getMessage());
        } catch (WegasRuntimeException ex) { // throw our exception as-is
            throw ex;
        } catch (RuntimeException ex) { // Java exception (Java -> JS -> Java -> throw)
            throw new WegasScriptException(script.getContent(), ex.getMessage(), ex);
        }
    }

    /**
     * Default customization of our engine: inject the script library, the root
     * variable instances and some libraries.
     *
     * @param evt
     */
    public void onEngineInstantiation(@Observes EngineInvocationEvent evt) throws WegasScriptException {
        evt.getEngine().put("self", evt.getPlayer());                           // Inject current player
        evt.getEngine().put("gameModel", evt.getPlayer().getGameModel());       // Inject current gameModel
        evt.getEngine().put("Variable", variableDescriptorFacade);              // Inject the variabledescriptor facade
        evt.getEngine().put("VariableDescriptorFacade", variableDescriptorFacade);// @backwardcompatibility
        evt.getEngine().put("RequestManager", requestManager);                  // Inject the request manager
        evt.getEngine().put("Event", event);                                    // Inject the Event manager
        evt.getEngine().put("DelayedEvent", delayedEvent);
        evt.getEngine().put("ErrorManager", new WegasErrorMessageManager());    // Inject the MessageErrorManager
        event.detachAll();
        this.injectStaticScript(evt);
        for (Entry<String, GameModelContent> arg
                : evt.getPlayer().getGameModel().getScriptLibrary().entrySet()) { // Inject the script library
            evt.getEngine().getContext().setAttribute(ScriptEngine.FILENAME, "Server script " + arg.getKey(), ScriptContext.ENGINE_SCOPE);
            try {
                evt.getEngine().eval(arg.getValue().getContent());
            } catch (ScriptException ex) { // script exception (Java -> JS -> throw)
                throw new WegasScriptException("Server script " + arg.getKey(), ex.getLineNumber(), ex.getMessage());
            } catch (Exception ex) { // Java exception (Java -> JS -> Java -> throw)
                throw new WegasScriptException("Server script " + arg.getKey(), ex.getMessage());
            }
        }
//        injectNamedInstances(evt.getEngine(), evt.getPlayer().getGameModel());
        injectRootNamedInstances(evt.getEngine(), evt.getPlayer());
    }

    /**
     * Inject GameModel's named instance into engine's global scope.
     * instance are available on their script alias
     *
     * @param engine    engine to populate
     * @param gameModel GameModel containing variables to inject
     * @throws WegasScriptException
     */
    private void injectNamedInstances(ScriptEngine engine, GameModel gameModel) throws WegasScriptException {
        /**
         * Fastest function I've found out to have every variables available on their name.
         * Still needs some test
         */
        /*
        (function(global){
            function configFor(name) {
                return {
                    set:function(v){
                        this.val = v;
                        this.set = true;
                    },
                    get:function(){
                        return this.set ? this.val : Variable.find(gameModel, name).getInstance(self);
                    }
                }
            }
            for(var i in _distinctNames){
                Object.defineProperty(global, _distinctNames[i], configFor(_distinctNames[i]))
            }
        })(this)
        */

        final List<String> distinctNames = variableDescriptorFacade.findDistinctNames(gameModel);
        final ScriptContext ctx = new SimpleScriptContext();
        ctx.setBindings(engine.getBindings(ScriptContext.ENGINE_SCOPE), ScriptContext.ENGINE_SCOPE);
        final Bindings bindings = new SimpleBindings();
        bindings.put("_distinctNames", distinctNames);
        ctx.setBindings(bindings, ScriptContext.GLOBAL_SCOPE);
        try {

            engine.eval("(function(global){\n" +
                    "    function configFor(name) {\n" +
                    "        return {\n" +
                    "            set:function(v){\n" +
                    "                this.val = v;\n" +
                    "                this.set = true;\n" +
                    "            },\n" +
                    "            get:function(){\n" +
                    "                return this.set ? this.val : Variable.find(gameModel, name).getInstance(self);\n" +
                    "            }\n" +
                    "        }\n" +
                    "    }\n" +
                    "    for(var i in _distinctNames){\n" +
                    "        Object.defineProperty(global, _distinctNames[i], configFor(_distinctNames[i]))\n" +
                    "    }\n" +
                    "})(this)", ctx);
        } catch (ScriptException e) {
            throw new WegasScriptException("Variables injection script failed", e.getMessage());
        }
    }

    /**
     * Inject GameModel's named root instance into engine's global scope.
     * instance are available on their script alias
     *
     * @param engine engine to populate
     * @param player Player to find instance from
     */
    private void injectRootNamedInstances(ScriptEngine engine, Player player) {
        for (VariableDescriptor vd
                : player.getGameModel().getChildVariableDescriptors()) { // Inject the variable instances in the script
            VariableInstance vi = vd.getInstance(player);
            engine.put(vd.getName(), vi);
        }
    }

    /**
     * Inject script files specified in GameModel's property scriptFiles into
     * engine
     *
     * @param evt EngineInvocationEvent
     */
    private void injectStaticScript(EngineInvocationEvent evt) throws WegasScriptException {
        String currentPath = getClass().getProtectionDomain().getCodeSource().getLocation().getPath();
        Integer index = currentPath.indexOf("WEB-INF");
        String root;
        if (index < 1) {
            // Seems we're not on a real deployed application
            // smells like such an integration test
            root = Helper.getWegasRootDirectory();
            if (root == null) {
                logger.error("Wegas Lost In The Sky... [Static Script Injection Not Available]");
                return;
            }
        } else {
            root = currentPath.substring(0, index);
        }

        String[] files = new String[0];
        String scriptURI = evt.getPlayer().getGameModel().getProperties().getScriptUri();
        if (scriptURI != null && !scriptURI.equals("")) {
            files = evt.getPlayer().getGameModel().getProperties().getScriptUri().split(";");
        }

        for (String f : getJavaScriptsRecursively(root, files)) {
            evt.getEngine().getContext().setAttribute(ScriptEngine.FILENAME, "Script file " + f, ScriptContext.ENGINE_SCOPE);
            try {

                java.io.FileInputStream fis = new FileInputStream(f);
                java.io.InputStreamReader isr = new InputStreamReader(fis, StandardCharsets.UTF_8);

                evt.getEngine().eval(isr);
                logger.info("File " + f + " successfully injected");
            } catch (FileNotFoundException ex) {
                logger.warn("File " + f + " was not found");
            } catch (ScriptException ex) { // script exception (Java -> JS -> throw)
                throw new WegasScriptException(f, ex.getLineNumber(), ex.getMessage());
            } catch (RuntimeException ex) { // Unwrapped Java exception (Java -> JS -> Java -> throw)
                throw new WegasScriptException(f, ex.getMessage());
            }
        }
    }

    /**
     * extract all javascript files from the files list. If one of the files is
     * a directory, recurse through it and fetch *.js.
     * <p>
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
                } else if (current.isFile()
                        && current.getName().endsWith(".js") // Is a javascript
                        && !isMinifedDuplicata(current)) { // avoid minified version when original exists
                    result.add(current.getPath());
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
     * Concatenate scripts
     *
     * @param scripts
     * @param arguments
     * @return
     */
    private Object eval(Player player, List<Script> scripts, Map<String, AbstractEntity> arguments) throws WegasScriptException {
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
        return this.eval(player, new Script(buf.toString()), arguments);
    }

    public Object eval(Player player, List<Script> scripts, VariableDescriptor context) {
        Map<String, AbstractEntity> arguments = new HashMap<>();
        arguments.put(ScriptFacade.CONTEXT, context);
        return this.eval(player, scripts, arguments);
    }

    /**
     * @param p
     * @param s
     * @param context
     * @return
     */
    public Object eval(Player p, Script s, VariableDescriptor context) throws WegasScriptException {
        Map<String, AbstractEntity> arguments = new HashMap<>();
        arguments.put(ScriptFacade.CONTEXT, context);
        return this.eval(p, s, arguments);
    }

    /**
     * @param player
     * @param s
     * @param arguments
     * @return
     */
    private Object eval(Player player, Script s, Map<String, AbstractEntity> arguments) throws WegasScriptException {
        requestManager.setPlayer(player);
        return this.eval(s, arguments);
    }

    /**
     * @param playerId
     * @param s
     * @param context
     * @return
     * @throws WegasScriptException
     */
    public Object eval(Long playerId, Script s, VariableDescriptor context) throws WegasScriptException { // ICI CONTEXT
        Map<String, AbstractEntity> arguments = new HashMap<>();
        arguments.put(ScriptFacade.CONTEXT, context);
        return this.eval(playerFacade.find(playerId), s, arguments);
    }
}
