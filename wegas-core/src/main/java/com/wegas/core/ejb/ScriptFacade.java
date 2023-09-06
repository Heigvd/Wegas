/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.core.ejb;

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
import com.wegas.core.api.TeamFacadeI;
import com.wegas.core.api.VariableDescriptorFacadeI;
import com.wegas.core.api.VariableInstanceFacadeI;
import com.wegas.core.ejb.nashorn.GraalVMClassFilter;
import com.wegas.core.ejb.nashorn.JSTool;
import com.wegas.core.ejb.nashorn.JavaObjectInvocationHandler;
import com.wegas.core.ejb.statemachine.StateMachineFacade;
import com.wegas.core.exception.WegasErrorMessageManager;
import com.wegas.core.exception.client.WegasErrorMessage;
import com.wegas.core.exception.client.WegasRuntimeException;
import com.wegas.core.exception.client.WegasScriptException;
import com.wegas.core.i18n.ejb.I18nFacade;
import com.wegas.core.persistence.game.GameModel;
import com.wegas.core.persistence.game.GameModelContent;
import com.wegas.core.persistence.game.Player;
import com.wegas.core.persistence.game.Populatable;
import com.wegas.core.persistence.game.Script;
import com.wegas.core.persistence.variable.VariableDescriptor;
import com.wegas.core.security.util.ActAsPlayer;
import com.wegas.core.security.util.ScriptExecutionContext;
import com.wegas.log.xapi.Xapi;
import com.wegas.log.xapi.XapiI;
import com.wegas.mcq.ejb.QuestionDescriptorFacade;
import com.wegas.resourceManagement.ejb.IterationFacade;
import com.wegas.resourceManagement.ejb.ResourceFacade;
import com.wegas.reviewing.ejb.ReviewingFacade;
import java.io.IOException;
import java.lang.reflect.InvocationTargetException;
import java.lang.reflect.UndeclaredThrowableException;
import java.net.URI;
import java.net.URISyntaxException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.*;
import java.util.Map.Entry;
import java.util.stream.Collectors;
import java.util.stream.Stream;
import jakarta.ejb.LocalBean;
import jakarta.ejb.Stateless;
import jakarta.inject.Inject;
import java.time.Duration;
import java.util.concurrent.TimeoutException;
import java.util.logging.Level;
import org.graalvm.polyglot.Context;
import org.graalvm.polyglot.Engine;
import org.graalvm.polyglot.HostAccess;
import org.graalvm.polyglot.PolyglotException;
import org.graalvm.polyglot.Source;
import org.graalvm.polyglot.SourceSection;
import org.graalvm.polyglot.Value;
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
     * 1seconds in [ms]
     */
    private static final Long SCRIPT_DELAY_1_SEC = 1000L;

    /**
     * 1 minute in [ms]
     */
    private static final Long SCRIPT_DELAY_1_MIN = 60000L;

    /**
     * 5 minutes in [ms]
     */
    private static final Long SCRIPT_DELAY_5_MIN = 300000L;

    /**
     * name
     */
    /* package */ static final String CONTEXT = "currentDescriptor";
    /**
     * A single, thread safe, javascript engine (only language currently supported)
     */
    private static final Engine engine;
    /**
     * Pre-compiled script. nashorn specific __noSuchProperty__ hijacking : find a
     * variableDescriptor's scriptAlias. Must be included in each Bindings.
     */
    private static final Source initSnippet;

    /**
     * Keep static scripts pre-compiled
     */
    private static final Helper.LRUCache<String, CachedScript> staticCache = new Helper.LRUCache<>(250);

    private static class CachedScript {

        private Source script;

        private String version;

        private String language;

        private String name;

        public CachedScript(Source script, String name, String version, String language) {
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
        engine = Engine.newBuilder().build();

        initSnippet = Source.create("js", "(function(global){"
            + "  if (!Math._random) { Math._random = Math.random; Math.random = function random(){if (RequestManager.isTestEnv()) {return 0} else {return Math._random()} }}"
            + "})(this);"); // Run on Bindings
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

    @Inject
    private TeamFacade teamFacade;

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

    public Context instantiateScriptContext(Player player, String language) {
        final Context currentContext = requestManager.getCurrentScriptContext();
        if (currentContext == null) {
            final Context scriptContext = this.populate(player);
            requestManager.setCurrentScriptContext(scriptContext);
            return scriptContext;
        }
        return currentContext;

    }

    private <T> void putBinding(Value bindings, String name, Class<T> klass, T object) {
        bindings.putMember(name, JavaObjectInvocationHandler.wrap(object, klass));
    }

    private Context populate(Player player) {
        if (player == null) {
            throw WegasErrorMessage.error("ScriptFacade.populate requires a player !!!");
        }

        if (player.getStatus() != Populatable.Status.LIVE
            && player.getStatus() != Populatable.Status.INITIALIZING
            && player.getStatus() != Populatable.Status.SURVEY) {
            throw WegasErrorMessage.error("ScriptFacade.populate requires a LIVE player !!!");
        }


        Context context = Context.newBuilder()
            .engine(engine)
            .allowHostClassLookup(new GraalVMClassFilter())
            .allowHostAccess(HostAccess.ALL)//TODO: way too permissive !!! be smarter
            .build();

        Value bindings = context.getBindings("js");

        bindings.putMember("self", player);                           // Inject current player
        bindings.putMember("gameModel", player.getGameModel());       // Inject current gameModel

        putBinding(bindings, "GameModelFacade", GameModelFacadeI.class, gameModelFacade);
        putBinding(bindings, "I18nFacade", I18nFacadeI.class, i18nFacade);

        putBinding(bindings, "Team", TeamFacadeI.class, teamFacade);

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

        bindings.putMember("ErrorManager", new WegasErrorMessageManager());    // Inject the MessageErrorManager

        //bindings.remove("exit");
        //bindings.remove("quit");
        //bindings.remove("loadWithNewGlobal");

        event.detachAll();
        context.eval(initSnippet);

        // Server script are internal
        try (ScriptExecutionContext internalContext = requestManager.switchToInternalExecContext(true)) {
            /**
             * Inject hard server scripts first
             */
            this.injectStaticScript(context, player.getGameModel());

            /**
             * Then inject soft ones. It means a soft script may override methods defined in a hard
             * coded one
             */
            for (GameModelContent script : player.getGameModel().getLibrariesAsList(GameModelContent.SERVER_SCRIPT)) {
                //context.setAttribute(ScriptEngine.FILENAME, "Server script " + script.getContentKey(), ScriptContext.ENGINE_SCOPE);

                try {
                    String cacheFileName = "soft:" + player.getGameModel().getId() + ":" + script.getContentKey();
                    String version = script.getVersion().toString();

                    CachedScript cached = getCachedScript(cacheFileName, version, script.getContent());

                    context.eval(cached.script);
                } catch (PolyglotException ex) { // script exception (Java -> JS -> throw)
                    throw new WegasScriptException("Server script " + script.getContentKey(), ex.getSourceLocation().getStartLine(), ex.getMessage());
                } catch (Exception ex) { // Java exception (Java -> JS -> Java -> throw)
                    throw new WegasScriptException("Server script " + script.getContentKey(), ex.getMessage());
                }
            }
        }
        return context;
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

            try {
                cached.script = Source.newBuilder("js", script, name).build();
                cached.version = version;
            } catch (IOException ex) {
                throw new WegasScriptException(name, 0, ex.getMessage());
            }
        }

        return cached;
    }

    /**
     * Inject script files specified in GameModel's property scriptFiles into engine
     *
     * @param ctx Context to populate
     * @param gm  GameModel from which scripts are taken
     */
    private void injectStaticScript(Context ctx, GameModel gm) {
        String scriptURI = gm.getProperties().getScriptUri();
        if (scriptURI == null || scriptURI.equals("")) {
            return;
        }

        String currentPath = getClass().getProtectionDomain().getCodeSource().getLocation().toString();
        Integer index = currentPath.indexOf("/WEB-INF");
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

        try {
            for (Path path : getJavaScriptsRecursively(root, scriptURI.split(";"))) {
                cacheFileName = "hard:" + path;
                version = Long.toString(Files.getLastModifiedTime(path).toMillis());

                CachedScript cached = staticCache.get(cacheFileName);

                if (cached == null) {
                    // since putIfAbsent is synchronised, check existence first to reduce locking
                    cached = staticCache.putIfAbsentAndGet(cacheFileName, new CachedScript(null, cacheFileName, version, "JavaScript"));
                }

                if (cached.version == null
                    || !cached.version.equals(version)
                    || cached.script == null) {

                    try {
                        cached.script = Source.newBuilder("js", path.toFile()).build();
                        cached.version = version;
                    } catch (IOException ex) {
                        throw new WegasScriptException(path.toString(), 0, "unable to read script");
                    } catch (PolyglotException ex) {
                        throw new WegasScriptException(path.toString(), ex.getSourceLocation().getStartLine(), ex.getMessage());
                    }
                }

                try {
                    ctx.eval(cached.script);
                    logger.info("File {} successfully injected", path);
                } catch (PolyglotException ex) { // script exception (Java -> JS -> throw)
                    throw new WegasScriptException(scriptURI, ex.getSourceLocation().getStartLine(), ex.getMessage());
                } catch (RuntimeException ex) { // Unwrapped Java exception (Java -> JS -> Java -> throw)
                    throw new WegasScriptException(scriptURI, ex.getMessage());
                }
            }
        } catch (IOException | URISyntaxException ex) {
            logger.warn("Unable to read hard coded server scripts");
        }
    }

    public int getCacheSize() {
        return staticCache.size();
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
    private Object eval(Script script, Map<String, Object> arguments, Long timeout) throws WegasScriptException {
        if (script == null) {
            return null;
        }
        Context ctx = instantiateScriptContext(requestManager.getPlayer(), script.getLanguage());

        Timer timer = setTimeout(ctx, timeout == null ? SCRIPT_DELAY_1_MIN : timeout);
        try {
            injectArguments(ctx, arguments);
            logger.trace("Eval script: {}", script);

            Value result = ctx.eval("js", script.getContent());
            return JSTool.unwrap(result);
        } catch (PolyglotException ex) {
            logger.error("ScriptException", ex);
            processPolyglotException(ex, script.getContent(), null);
            return null;// actually, processPolyglotException just throw something
        } catch (WegasRuntimeException ex) { // throw our exception as-is
            logger.error("ScriptException:", ex);
            throw ex;
        } catch (UndeclaredThrowableException ex) { // Java exception (Java -> JS -> Java -> throw)
            processUndeclared(ex, script.getContent(), null);
            return null;// actually, processPolyglotException just throw something
        } catch (RuntimeException ex) { // Java exception (Java -> JS -> Java -> throw)
            logger.error("ScriptException:", ex);
            throw new WegasScriptException(script.getContent(), ex.getMessage(), ex);
        } finally {
            if (timer != null) {
                timer.cancel();
            }
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
    private Collection<Path> getJavaScriptsRecursively(String root, String[] files) throws IOException, URISyntaxException {
        List<Path> queue = new LinkedList<>();

        for (String file : files) {
            if (!Helper.isNullOrEmpty(file.trim())) {
                queue.add(Paths.get(new URI(root + "/" + file)));
            }
        }

        List<Path> result = new LinkedList<>();

        while (!queue.isEmpty()) {
            Path current = queue.remove(0);
            if (!Files.isSymbolicLink(current) && Files.isReadable(current)) {
                if (Files.isDirectory(current)) {
                    try (Stream<Path> children = Files.list(current)) {
                        // queue children
                        children.collect(Collectors.toCollection(() -> queue));
                    }
                } else if (Files.isRegularFile(current)
                    && current.toString().endsWith(".js")) {
                    // collect all .js
                    result.add(current);
                }
            }
        }

        // at this point, result may contains plain and minified versions of the very same script
        return result.stream().filter(p -> shouldKeep(p, result)).collect(Collectors.toList());
    }

    /**
     * Keep all file but minified which have non-minified version in the list
     *
     * @param path
     * @param paths
     *
     * @return
     */
    private static boolean shouldKeep(Path path, List<Path> paths) {
        String toString = path.toString();
        if (toString.endsWith("-min.js")) {
            String nonMin = toString.replaceAll("-min.js$", ".js");
            return !paths.stream().anyMatch(p -> nonMin.equals(p.toString()));
        }
        return true;
    }

    /**
     * Runs a script with a delay ({@value #SCRIPT_DELAY_1_SEC} ms)
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
        return this.eval(player, script, null, SCRIPT_DELAY_1_SEC);
    }

    /**
     * Concatenate scripts
     *
     * @param scripts
     * @param arguments
     *
     * @return eval result
     */
    private Object eval(Player player, List<Script> scripts, Map<String, Object> arguments) throws WegasScriptException {
        if (scripts.isEmpty()) {
            return null;
        }
        StringBuilder buf = new StringBuilder();
        for (Script s : scripts) { // concatenate all scripts
            if (s != null && !Helper.isNullOrEmpty(s.getContent())) {
                buf.append(s.getContent()).append(';').append(System.lineSeparator());
            }
        }
        return this.eval(player, new Script(buf.toString()), arguments, null);
    }

    public Object eval(Player player, List<Script> scripts, VariableDescriptor context) {
        Map<String, Object> arguments = new HashMap<>();
        arguments.put(ScriptFacade.CONTEXT, context);
        return this.eval(player, scripts, arguments);
    }

    /**
     * @param p
     * @param s
     * @param context
     *
     * @return eval result
     */
    public Object eval(Player p, Script s, VariableDescriptor context) throws WegasScriptException {
        Map<String, Object> arguments = new HashMap<>();
        arguments.put(ScriptFacade.CONTEXT, context);
        return this.eval(p, s, arguments, null);
    }

    /**
     * @param player
     * @param s
     * @param arguments
     *
     * @return eval result
     */
    private Object eval(Player player, Script s, Map<String, Object> arguments, Long timeout) throws WegasScriptException {
        try (ActAsPlayer a = requestManager.actAsPlayer(player)) {
            return this.eval(s, arguments, timeout);
        }
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
    public Object eval(Long playerId, Script s, VariableDescriptor context) throws WegasScriptException {
        Map<String, Object> arguments = new HashMap<>();
        arguments.put(ScriptFacade.CONTEXT, context);
        return this.eval(playerFacade.find(playerId), s, arguments, null);
    }

    /**
     * @param player
     * @param s
     * @param context
     * @param arguments
     *
     * @return eval result
     *
     * @throws WegasScriptException
     */
    public Object eval(Player player, Script s, VariableDescriptor context, Map<String, Object> arguments) throws WegasScriptException {
        Map<String, Object> args = arguments != null ? arguments : new HashMap<>();

        args.put(ScriptFacade.CONTEXT, context);

        return this.eval(player, s, arguments, null);
    }

    private void injectArguments(Context context, Map<String, Object> arguments) {
        if (arguments != null) {
            Value langBinding = context.getBindings("js");
            Value polyglotBindings = context.getPolyglotBindings();
            for (Entry<String, Object> arg : arguments.entrySet()) {
                if (arg.getValue() != null) {
                    // inject custom arg within botg bindings
                    //  first one to use them within script without specific import
                    //  second one to retrive them from host context without the knoledge of the script language (cf Event.fired);
                    langBinding.putMember(arg.getKey(), arg.getValue());
                    polyglotBindings.putMember(arg.getKey(), arg.getValue());
                }
            }
        }
    }

    /**
     * Register a timer which will kill the process after a while
     *
     * @param context script context to kill
     * @param timeout time in ms
     *
     * @return a timer instance or null
     */
    private Timer setTimeout(Context context, Long timeout) {
        if (timeout != null && timeout > 0) {
            Timer timer = new Timer(true);
            timer.schedule(new TimerTask() {
                @Override
                public void run() {
                    logger.error("KILL ME");
                    context.close(true);
                }
            }, timeout);
            return timer;
        }
        return null;
    }

    private void processUndeclared(UndeclaredThrowableException ex, String content, String name) throws WegasScriptException {
        String msg = content != null ? content : name;
        Throwable cause = ex.getCause();
        if (cause instanceof InvocationTargetException) {
            Throwable subCause = cause.getCause();
            if (subCause instanceof WegasRuntimeException) {
                throw (WegasRuntimeException) subCause;
            } else {
                if (subCause != null) {
                    throw new WegasScriptException(msg, subCause.getMessage(), ex);
                } else {
                    throw new WegasScriptException(msg, cause.getMessage(), ex);
                }
            }
        } else {
            throw new WegasScriptException(msg, ex.getMessage(), ex);
        }
    }

    private void processPolyglotException(PolyglotException ex, String content, String name) throws WegasScriptException {
        String msg = content != null ? content : name;
        if (ex.isHostException()) {
            Throwable theEx = ex.asHostException();
            if (theEx instanceof WegasRuntimeException) {
                // throw our exception as-is
                throw (WegasRuntimeException) theEx;
            } else if (theEx instanceof UndeclaredThrowableException) {
                Throwable cause = ex.getCause();
                if (cause instanceof InvocationTargetException) {
                    Throwable subCause = cause.getCause();
                    if (subCause instanceof WegasRuntimeException) {
                        throw (WegasRuntimeException) subCause;
                    } else {
                        throw new WegasScriptException(msg, cause.getMessage(), ex);
                    }
                } else {
                    throw new WegasScriptException(msg, ex.getMessage(), ex);
                }
            }
        }

        if (ex.isCancelled()) {
            requestManager.setCurrentScriptContext(null);
        }
        SourceSection sourceLocation = ex.getSourceLocation();
        int lineStart = -1;

        if (sourceLocation != null) {
            lineStart = sourceLocation.getStartLine();
        }

        throw new WegasScriptException(msg, lineStart, ex.getMessage(), ex);

    }
}
