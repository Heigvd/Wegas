/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2018 School of Business and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.core.ejb;

import com.wegas.core.Delay;
import com.wegas.core.Helper;
import com.wegas.core.api.DelayedScriptEventFacadeI;
import com.wegas.core.api.GameModelFacadeI;
import com.wegas.core.api.I18nFacadeI;
import com.wegas.core.api.IterationFacadeI;
import com.wegas.core.api.QuestionDescriptorFacadeI;
import com.wegas.core.api.RequestManagerI;
import com.wegas.core.api.ResourceFacadeI;
import com.wegas.core.api.ReviewingFacadeI;
import com.wegas.core.api.ScriptEventFacadeI;
import com.wegas.core.api.StateMachineFacadeI;
import com.wegas.core.api.VariableDescriptorFacadeI;
import com.wegas.core.api.VariableInstanceFacadeI;
import com.wegas.core.ejb.nashorn.JSTool;
import com.wegas.core.ejb.nashorn.JavaObjectInvocationHandler;
import com.wegas.core.ejb.nashorn.NHClassFilter;
import com.wegas.core.ejb.nashorn.NHClassLoader;
import com.wegas.core.ejb.statemachine.StateMachineFacade;
import com.wegas.core.exception.WegasErrorMessageManager;
import com.wegas.core.exception.client.WegasErrorMessage;
import com.wegas.core.exception.client.WegasRuntimeException;
import com.wegas.core.exception.client.WegasScriptException;
import com.wegas.core.i18n.ejb.I18nFacade;
import com.wegas.core.persistence.AbstractEntity;
import com.wegas.core.persistence.game.GameModel;
import com.wegas.core.persistence.game.GameModelContent;
import com.wegas.core.persistence.game.Player;
import com.wegas.core.persistence.game.Populatable;
import com.wegas.core.persistence.game.Script;
import com.wegas.core.persistence.variable.VariableDescriptor;
import com.wegas.core.persistence.variable.statemachine.AbstractTransition;
import com.wegas.log.xapi.Xapi;
import com.wegas.log.xapi.XapiI;
import com.wegas.mcq.ejb.QuestionDescriptorFacade;
import com.wegas.resourceManagement.ejb.IterationFacade;
import com.wegas.resourceManagement.ejb.ResourceFacade;
import com.wegas.reviewing.ejb.ReviewingFacade;
import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;
import java.io.InputStreamReader;
import java.io.Reader;
import java.lang.reflect.InvocationTargetException;
import java.lang.reflect.UndeclaredThrowableException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.util.*;
import java.util.Map.Entry;
import javax.annotation.Resource;
import javax.ejb.LocalBean;
import javax.ejb.Stateless;
import javax.enterprise.concurrent.ManagedExecutorService;
import javax.inject.Inject;
import javax.script.*;
import jdk.nashorn.api.scripting.NashornScriptEngineFactory;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * @author Francois-Xavier Aeberhard (fx at red-agent.com)
 */
@Stateless
@LocalBean
public class ScriptFacade extends WegasAbstractFacade {

    private static final Logger logger = LoggerFactory.getLogger(ScriptFacade.class);

    /**
     * name
     */
    /* package */ static final String CONTEXT = "currentDescriptor";
    /**
     * A single, thread safe, javascript engine (only language currently supported)
     */
    private static final ScriptEngine engine;
    /**
     * Pre-compiled script. nashorn specific __noSuchProperty__ hijacking : find a
     * variableDescriptor's scriptAlias. Must be included in each Bindings.
     */
    private static final CompiledScript noSuchProperty;

    /**
     * Keep static scripts pre-compiled
     */
    private static final Helper.LRUCache<String, CachedScript> staticCache = new Helper.LRUCache<>(250);

    private static class CachedScript {

        private CompiledScript script;

        private String version;

        private String language;

        private String name;

        public CachedScript(CompiledScript script, String name, String version, String language) {
            this.name = name;
            this.script = script;
            this.version = version;
            this.language = language;
        }
    }

    /*
     * Initialize noSuchProperty and other nashorn stuff
     */
    static {
        //engine = new ScriptEngineManager().getEngineByName("JavaScript");
        NashornScriptEngineFactory factory = new NashornScriptEngineFactory();
        //engine = factory.getScriptEngine(new NHClassLoader());

        engine = factory.getScriptEngine(new String[0], new NHClassLoader(), new NHClassFilter());
        //engine = factory.getScriptEngine(new String[] {} , new NHClassLoader(), new NHClassFilter());

        CompiledScript compile = null;
        try {
            compile = ((Compilable) engine).compile(
                "(function(global){"
                + "  var defaultNoSuchProperty = global.__noSuchProperty__;" // Store nashorn's implementation
                + "  Object.defineProperty(global, '__noSuchProperty__', {"
                + "    value: function(prop){"
                + "      try{"
                + "        var ret = Variable.find(gameModel, prop).getInstance(self);"
                + "        print('SCRIPT_ALIAS_CALL: [GM]' + gameModel.getId() + ' [alias]' + prop);" // log usage if var exists
                + "        return ret;" // Try to find a VariableDescriptor's instance for that given prop
                + "      }catch(e){"
                + "        return defaultNoSuchProperty.call(global, prop);" // Use default implementation if no VariableDescriptor
                + "    }}"
                + "  });"
                + "  if (!Math._random) { Math._random = Math.random; Math.random = function random(){if (RequestManager.isTestEnv()) {return 0} else {return Math._random()} }}"
                + "})(this);"); // Run on Bindings
        } catch (ScriptException e) {
            logger.error("noSuchProperty script compilation failed", e);
        }
        noSuchProperty = compile;
    }

    /**
     *
     */
    @Inject
    private PlayerFacade playerFacade;

    @Inject
    private GameModelFacade gameModelFacade;

    /**
     *
     */
    @Inject
    private VariableDescriptorFacade variableDescriptorFacade;

    /**
     *
     */
    @Inject
    private VariableInstanceFacade variableInstanceFacade;

    @Inject
    private ResourceFacade resourceFacade;

    @Inject
    private IterationFacade iterationFacade;

    @Inject
    private QuestionDescriptorFacade questionDescriptorFacade;

    @Inject
    private StateMachineFacade stateMachineFacade;

    @Inject
    private ReviewingFacade reviewingFacade;

    @Inject
    private I18nFacade i18nFacade;

    /**
     *
     */
    @Inject
    private ScriptEventFacade event;

    /**
     *
     */
    @Inject
    private DelayedScriptEventFacade delayedEvent;

    /**
     *
     */
    @Inject
    private RequestManager requestManager;

    @Inject
    private Xapi xapi;

    @Resource(lookup = "timeoutExecutorService")
    private ManagedExecutorService timeoutExecutorService;

    public ScriptContext instantiateScriptContext(Player player, String language) {
        final ScriptContext currentContext = requestManager.getCurrentScriptContext();
        if (currentContext == null) {
            final ScriptContext scriptContext = this.populate(player);
            requestManager.setCurrentScriptContext(scriptContext);
            return scriptContext;
        }
        return currentContext;

    }

    private <T> void putBinding(Bindings bindings, String name, Class<T> klass, T object) {
        bindings.put(name, JavaObjectInvocationHandler.wrap(object, klass));
    }

    private ScriptContext populate(Player player) {
        final Bindings bindings = engine.createBindings();
        if (player == null) {
            throw WegasErrorMessage.error("ScriptFacade.populate requires a player !!!");
        }

        if (player.getStatus() != Populatable.Status.LIVE
            && player.getStatus() != Populatable.Status.INITIALIZING) {
            throw WegasErrorMessage.error("ScriptFacade.populate requires a LIVE player !!!");
        }

        bindings.put("self", player);                           // Inject current player
        bindings.put("gameModel", player.getGameModel());       // Inject current gameModel

        putBinding(bindings, "GameModelFacade", GameModelFacadeI.class, gameModelFacade);
        putBinding(bindings, "I18nFacade", I18nFacadeI.class, i18nFacade);

        putBinding(bindings, "Variable", VariableDescriptorFacadeI.class, variableDescriptorFacade);
        putBinding(bindings, "VariableDescriptorFacade", VariableDescriptorFacadeI.class, variableDescriptorFacade);

        putBinding(bindings, "Instance", VariableInstanceFacadeI.class, variableInstanceFacade);

        putBinding(bindings, "ResourceFacade", ResourceFacadeI.class, resourceFacade);
        putBinding(bindings, "IterationFacade", IterationFacadeI.class, iterationFacade);

        putBinding(bindings, "QuestionFacade", QuestionDescriptorFacadeI.class, questionDescriptorFacade);
        putBinding(bindings, "StateMachineFacade", StateMachineFacadeI.class, stateMachineFacade);
        putBinding(bindings, "ReviewingFacade", ReviewingFacadeI.class, reviewingFacade);

        putBinding(bindings, "RequestManager", RequestManagerI.class, requestManager);
        putBinding(bindings, "Event", ScriptEventFacadeI.class, event);
        putBinding(bindings, "DelayedEvent", DelayedScriptEventFacadeI.class, delayedEvent);
        putBinding(bindings, "xapi", XapiI.class, xapi);

        bindings.put("ErrorManager", new WegasErrorMessageManager());    // Inject the MessageErrorManager

        bindings.remove("exit");
        bindings.remove("quit");
        bindings.remove("loadWithNewGlobal");

        event.detachAll();
        ScriptContext ctx = new SimpleScriptContext();
        ctx.setBindings(bindings, ScriptContext.ENGINE_SCOPE);

        try {
            noSuchProperty.eval(bindings);
        } catch (ScriptException e) {
            logger.error("noSuchProperty injection", e);
        }

        /**
         * Inject hard server scripts first
         */
        this.injectStaticScript(ctx, player.getGameModel());

        /**
         * Then inject soft ones. It means a soft script may override methods defined in a hard
         * coded one
         */
        for (GameModelContent script : player.getGameModel().getScriptLibraryList()) {
            ctx.setAttribute(ScriptEngine.FILENAME, "Server script " + script.getContentKey(), ScriptContext.ENGINE_SCOPE);

            String cacheFileName = "soft:" + player.getGameModel().getId() + ":" + script.getContentKey();
            String version = script.getVersion().toString();

            CachedScript cached = getCachedScript(cacheFileName, version, script.getContent());

            try {
                cached.script.eval(ctx);
            } catch (ScriptException ex) { // script exception (Java -> JS -> throw)
                throw new WegasScriptException("Server script " + script.getContentKey(), ex.getLineNumber(), ex.getMessage());
            } catch (Exception ex) { // Java exception (Java -> JS -> Java -> throw)
                throw new WegasScriptException("Server script " + script.getContentKey(), ex.getMessage());
            }
        }
        return ctx;
    }

    private CachedScript getCachedScript(String name, String version, String script) {

        CachedScript cached = staticCache.get(name);

        if (cached == null) {
            // since putIfAbsent is synchronised, check existence first to reduce locking
            cached = staticCache.putIfAbsentAndGet(name, new CachedScript(null, name, version, "JavaScript"));
        }

        if (cached.version == null
            || !cached.version.equals(version)
            || cached.script == null) {

            CompiledScript compile;
            try {
                compile = ((Compilable) engine).compile(script);
            } catch (ScriptException ex) {
                throw new WegasScriptException(name, ex.getLineNumber(), ex.getMessage());
            }
            cached.script = compile;
            cached.version = version;
        }

        return cached;
    }

    /**
     * Eval without any player related context (no server scripts, no API, etc)
     *
     * @param script
     * @param args
     *
     * @return
     *
     * @throws ScriptException
     */
    public Object nakedEval(String script, Map<String, Object> args, ScriptContext ctx) throws ScriptException {
        if (ctx == null) {
            ctx = new SimpleScriptContext();
        }
        if (args != null) {
            for (Entry<String, Object> arg : args.entrySet()) {
                if (arg.getValue() != null) {
                    ctx.getBindings(ScriptContext.ENGINE_SCOPE).put(arg.getKey(), arg.getValue());
                }
            }
        }

        return engine.eval(script, ctx);
    }

    public Object nakedEval(CompiledScript script, Map<String, Object> args, ScriptContext ctx) throws ScriptException {
        if (ctx == null) {
            ctx = new SimpleScriptContext();
        }
        if (args != null) {
            for (Entry<String, Object> arg : args.entrySet()) {
                if (arg.getValue() != null) {
                    ctx.getBindings(ScriptContext.ENGINE_SCOPE).put(arg.getKey(), arg.getValue());
                }
            }
        }

        return script.eval(ctx);
    }

    /**
     * Inject script files specified in GameModel's property scriptFiles into engine
     *
     * @param ctx ScriptContext to populate
     * @param gm  GameModel from which scripts are taken
     */
    private void injectStaticScript(ScriptContext ctx, GameModel gm) {
        String scriptURI = gm.getProperties().getScriptUri();
        if (scriptURI == null || scriptURI.equals("")) {
            return;
        }

        String currentPath = getClass().getProtectionDomain().getCodeSource().getLocation().getPath();
        Integer index = currentPath.indexOf("WEB-INF");
        String root;
        if (index < 1) {
            // Seems we're not on a real deployed application
            // smells like such an integration test
            root = Helper.getWegasRootDirectory();
            if (root == null) {
                logger.error("Wegas Lost In The Sky... [Static Script Injection Not Available] ->  {}", currentPath);
                return;
            }
        } else {
            root = currentPath.substring(0, index);
        }
        String cacheFileName;
        String version;

        for (File f : getJavaScriptsRecursively(root, scriptURI.split(";"))) {
            cacheFileName = "hard:" + f.getPath();
            version = Long.toString(f.lastModified());

            CachedScript cached = staticCache.get(cacheFileName);

            if (cached == null) {
                // since putIfAbsent is synchronised, check existence first to reduce locking
                cached = staticCache.putIfAbsentAndGet(cacheFileName, new CachedScript(null, cacheFileName, version, "JavaScript"));
            }

            if (cached.version == null
                || !cached.version.equals(version)
                || cached.script == null) {

                try (FileInputStream fis = new FileInputStream(f); InputStreamReader isr = new InputStreamReader(fis, StandardCharsets.UTF_8)) {
                    cached.script = this.compile(isr);
                    cached.version = version;
                } catch (IOException e) {
                    logger.warn("File {} was not found", f.getPath());
                } catch (ScriptException ex) {
                    throw new WegasScriptException(f.getPath(), ex.getLineNumber(), ex.getMessage());
                }
            }

            try {
                ctx.setAttribute(ScriptEngine.FILENAME, "Static Scripts " + f.getPath(), ScriptContext.ENGINE_SCOPE);
                cached.script.eval(ctx);
                logger.info("File {} successfully injected", f);
            } catch (ScriptException ex) { // script exception (Java -> JS -> throw)
                throw new WegasScriptException(scriptURI, ex.getLineNumber(), ex.getMessage());
            } catch (RuntimeException ex) { // Unwrapped Java exception (Java -> JS -> Java -> throw)
                throw new WegasScriptException(scriptURI, ex.getMessage());
            }
        }
    }

    public CompiledScript compile(Reader script) throws ScriptException {
        return ((Compilable) engine).compile(script);
    }

    public void clearCache() {
        staticCache.clear();
    }

    /**
     * Instantiate script context, inject arguments and eval the given script
     *
     * @param script
     * @param arguments
     *
     * @return whatever the script has returned
     */
    private Object eval(Script script, Map<String, AbstractEntity> arguments) throws WegasScriptException {
        if (script == null) {
            return null;
        }
        ScriptContext ctx = instantiateScriptContext(requestManager.getPlayer(), script.getLanguage());

        for (Entry<String, AbstractEntity> arg : arguments.entrySet()) {        // Inject the arguments
            if (arg.getValue() != null) {
                ctx.getBindings(ScriptContext.ENGINE_SCOPE).put(arg.getKey(), arg.getValue());
            }
        }

        try {
            ctx.setAttribute(ScriptEngine.FILENAME, script.getContent(), ScriptContext.ENGINE_SCOPE);
            return engine.eval(script.getContent(), ctx);
        } catch (ScriptException ex) {
            logger.error("ScriptException: {}", ex);
            throw new WegasScriptException(script.getContent(), ex.getLineNumber(), ex.getMessage(), ex);
        } catch (WegasRuntimeException ex) { // throw our exception as-is
            logger.error("ScriptException: {}", ex);
            throw ex;
        } catch (UndeclaredThrowableException ex) { // Java exception (Java -> JS -> Java -> throw)
            Throwable cause = ex.getCause();
            if (cause instanceof InvocationTargetException) {
                Throwable subCause = cause.getCause();
                if (subCause instanceof WegasRuntimeException) {
                    throw (WegasRuntimeException) subCause;
                } else {
                    if (subCause != null) {
                        throw new WegasScriptException(script.getContent(), subCause.getMessage(), ex);
                    } else {
                        throw new WegasScriptException(script.getContent(), cause.getMessage(), ex);
                    }
                }
            } else {
                throw new WegasScriptException(script.getContent(), ex.getMessage(), ex);
            }
        } catch (RuntimeException ex) { // Java exception (Java -> JS -> Java -> throw)
            logger.error("ScriptException: {}", ex);
            throw new WegasScriptException(script.getContent(), ex.getMessage(), ex);
        }
    }

    private Object eval(CachedScript cachedScript, Map<String, AbstractEntity> arguments) throws WegasScriptException {
        if (cachedScript == null) {
            return null;
        }
        ScriptContext ctx = instantiateScriptContext(requestManager.getPlayer(), cachedScript.language);

        for (Entry<String, AbstractEntity> arg : arguments.entrySet()) {        // Inject the arguments
            if (arg.getValue() != null) {
                ctx.getBindings(ScriptContext.ENGINE_SCOPE).put(arg.getKey(), arg.getValue());
            }
        }

        try {
            ctx.setAttribute(ScriptEngine.FILENAME, cachedScript.name, ScriptContext.ENGINE_SCOPE);
            return cachedScript.script.eval(ctx);
        } catch (ScriptException ex) {
            logger.error("ScriptException: {}", ex);
            throw new WegasScriptException(cachedScript.name, ex.getLineNumber(), ex.getMessage(), ex);
        } catch (WegasRuntimeException ex) { // throw our exception as-is
            logger.error("ScriptException: {}", ex);
            throw ex;
        } catch (UndeclaredThrowableException ex) { // Java exception (Java -> JS -> Java -> throw)
            Throwable cause = ex.getCause();
            if (cause instanceof InvocationTargetException) {
                Throwable subCause = cause.getCause();
                if (subCause instanceof WegasRuntimeException) {
                    throw (WegasRuntimeException) subCause;
                } else {
                    if (subCause != null) {
                        throw new WegasScriptException(cachedScript.name, subCause.getMessage(), ex);
                    } else {
                        throw new WegasScriptException(cachedScript.name, cause.getMessage(), ex);
                    }
                }
            } else {
                throw new WegasScriptException(cachedScript.name, ex.getMessage(), ex);
            }
        } catch (RuntimeException ex) { // Java exception (Java -> JS -> Java -> throw)
            logger.error("ScriptException: {}", ex);
            throw new WegasScriptException(cachedScript.name, ex.getMessage(), ex);
        }
    }

    /**
     * extract all javascript files from the files list. If one of the files is a directory, recurse
     * through it and fetch *.js.
     * <p>
     * Note: When iterating, if a script and its minified version stands in the directory, the
     * minified is ignored (debugging purpose)
     *
     * @param root
     * @param files
     *
     * @return javascript file collection
     */
    private Collection<File> getJavaScriptsRecursively(String root, String[] files) {
        List<File> queue = new LinkedList<>();
        List<File> result = new LinkedList<>();

        for (String file : files) {
            File f = new File(root + "/" + file);
            // Put directories in the recurse queue and files in result list
            // this test may look redundant with the one done bellow... but...
            // actually, it ensures a -min.js script given by the user is never ignored
            if (f.isDirectory()) {
                queue.add(f);
            } else {
                result.add(f);
            }
        }

        while (!queue.isEmpty()) {
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
                    result.add(current);
                }
            }
        }
        return result;
    }

    /**
     * check if the given file is a minified version of an existing one
     *
     * @param file
     *
     * @return true if this file is a minified version of an existing script
     */
    private boolean isMinifedDuplicata(File file) {
        if (file.getName().endsWith("-min.js")) {
            String siblingPath = file.getPath().replaceAll("-min.js$", ".js");
            File f = new File(siblingPath);
            return f.exists();
        }
        return false;
    }

    /**
     * Stops script after a given delay. (ms)
     */
    private static final long SCRIPT_DELAY = 1000L;

    /**
     * Runs a script with a delay ({@value #SCRIPT_DELAY} ms)
     *
     * @param playerId player to run script as
     * @param script   script
     *
     * @return script result
     *
     * @throws WegasScriptException when an error occurred
     * @see #eval(Script, Map)
     */
    public Object timeoutEval(Long playerId, Script script) throws WegasScriptException {
        final Player player = playerFacade.find(playerId);
        requestManager.setPlayer(player);

        final ScriptContext scriptContext = this.instantiateScriptContext(player, script.getLanguage());

        final Script scriptCopy = new Script();
        scriptCopy.setContent(JSTool.sanitize(script.getContent(), "$$internal$delay.poll();"));
        scriptCopy.setLanguage(script.getLanguage());
        scriptContext.getBindings(ScriptContext.ENGINE_SCOPE).put(JSTool.JS_TOOL_INSTANCE_NAME,
            new JSTool.JSToolInstance());
        try (Delay delay = new Delay(SCRIPT_DELAY, timeoutExecutorService)) {
            scriptContext.getBindings(ScriptContext.ENGINE_SCOPE).put("$$internal$delay", delay);
            return this.eval(scriptCopy, new HashMap<>());
        } catch (WegasScriptException e) {
            // try to restore original code
            final String replaceCode = e.getMessage().replace(scriptCopy.getContent(), script.getContent());
            throw new WegasScriptException(script.getContent(), replaceCode);
        }

    }
    // ~~~ Sugar ~~~

    /**
     * Concatenate scripts
     *
     * @param scripts
     * @param arguments
     *
     * @return eval result
     */
    private Object eval(Player player, List<Script> scripts, Map<String, AbstractEntity> arguments) throws WegasScriptException {
        if (scripts.isEmpty()) {
            return null;
        }
        StringBuilder buf = new StringBuilder();
        for (Script s : scripts) { // concatenate all scripts
            if (s != null && !Helper.isNullOrEmpty(s.getContent())) {
                buf.append(s.getContent()).append(';').append(System.lineSeparator());
            }
        }
        return this.eval(player, new Script(buf.toString()), arguments);
    }

    public Object eval(Player player, List<Script> scripts, VariableDescriptor context) {
        Map<String, AbstractEntity> arguments = new HashMap<>();
        arguments.put(ScriptFacade.CONTEXT, context);
        return this.eval(player, scripts, arguments);
    }

    @Deprecated
    public Object evalDoNotUse(Player p, AbstractTransition transition, VariableDescriptor context) throws WegasScriptException {
        String name = "transition:" + transition.getId();
        CachedScript cached = getCachedScript(name, transition.getVersion().toString(), transition.getTriggerCondition().getContent());

        Map<String, AbstractEntity> arguments = new HashMap<>();
        arguments.put(ScriptFacade.CONTEXT, context);

        return this.eval(p, cached, arguments);
    }

    private Object eval(Player player, CachedScript s, Map<String, AbstractEntity> arguments) throws WegasScriptException {
        requestManager.setPlayer(player);
        return this.eval(s, arguments);
    }

    /**
     * @param p
     * @param s
     * @param context
     *
     * @return eval result
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
     *
     * @return eval result
     */
    private Object eval(Player player, Script s, Map<String, AbstractEntity> arguments) throws WegasScriptException {
        requestManager.setPlayer(player);
        return this.eval(s, arguments);
    }

    /**
     * @param playerId
     * @param s
     * @param context
     *
     * @return eval result
     *
     * @throws WegasScriptException
     */
    public Object eval(Long playerId, Script s, VariableDescriptor context) throws WegasScriptException { // ICI CONTEXT
        Map<String, AbstractEntity> arguments = new HashMap<>();
        arguments.put(ScriptFacade.CONTEXT, context);
        return this.eval(playerFacade.find(playerId), s, arguments);
    }
}
