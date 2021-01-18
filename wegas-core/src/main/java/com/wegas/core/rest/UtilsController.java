
/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.core.rest;

import ch.qos.logback.classic.Level;
import ch.qos.logback.classic.Logger;
import ch.qos.logback.classic.LoggerContext;
import com.hazelcast.core.HazelcastInstance;
import com.hazelcast.core.Member;
import com.wegas.core.Helper;
import com.wegas.core.async.PopulatorScheduler;
import com.wegas.core.ejb.ApplicationLifecycle;
import com.wegas.core.ejb.ConcurrentHelper;
import com.wegas.core.ejb.JPACacheHelper;
import com.wegas.core.ejb.js.GraalVmMonitor;
import com.wegas.core.jcr.JackrabbitConnector;
import fish.payara.micro.cdi.Inbound;
import fish.payara.micro.cdi.Outbound;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.Serializable;
import java.io.StringReader;
import java.net.URISyntaxException;
import java.util.Date;
import java.util.Enumeration;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import javax.ejb.Stateless;
import javax.enterprise.event.Event;
import javax.enterprise.event.Observes;
import javax.inject.Inject;
import javax.json.Json;
import javax.json.JsonArray;
import javax.json.JsonObject;
import javax.json.JsonReader;
import javax.json.JsonValue;
import javax.servlet.http.HttpServletRequest;
import javax.ws.rs.Consumes;
import javax.ws.rs.DELETE;
import javax.ws.rs.GET;
import javax.ws.rs.Path;
import javax.ws.rs.PathParam;
import javax.ws.rs.Produces;
import javax.ws.rs.core.Context;
import javax.ws.rs.core.MediaType;
import org.apache.http.HttpResponse;
import org.apache.http.client.HttpClient;
import org.apache.http.client.methods.HttpGet;
import org.apache.http.client.utils.URIBuilder;
import org.apache.http.impl.client.HttpClientBuilder;
import org.apache.shiro.authz.annotation.RequiresRoles;
import org.slf4j.LoggerFactory;

/**
 * @author CiGit
 */
@Stateless
@Path("Utils")
@Consumes(MediaType.APPLICATION_JSON)
@Produces(MediaType.APPLICATION_JSON)
public class UtilsController {

    private static final org.slf4j.Logger logger = LoggerFactory.getLogger(UtilsController.class);

    private static final String GITHUB_URL = "https://api.github.com";

    @Inject
    private ApplicationLifecycle applicationLifecycle;

    @Inject
    private HazelcastInstance hzInstance;

    @Inject
    private PopulatorScheduler populatorScheduler;

    @Inject
    private ConcurrentHelper concurrentHelper;

    @Inject
    private JPACacheHelper jpaCacheHelper;

    @Inject
    private JackrabbitConnector jcrConnector;

    @Inject
    private GraalVmMonitor nhMonitor;

    private static final String SET_LEVEL_EVENT = "Wegas_setLoggerLevel";

    @Inject
    @Outbound(eventName = SET_LEVEL_EVENT, loopBack = false)
    private Event<LoggerLevel> events;

    public static class LoggerLevel implements Serializable {

        private final String loggerLevel;
        private final String loggerName;

        public LoggerLevel(String loggerName, String loggerLevel) {
            this.loggerName = loggerName;
            this.loggerLevel = loggerLevel;
        }

        private String getLoggerLevel() {
            return loggerLevel;
        }

        private String getLoggerName() {
            return loggerName;
        }
    }

    /**
     * Request all cluster instances to clear JPA l2 cache
     */
    @DELETE
    @Path("EmCache")
    public void wipeEmCache() {
        jpaCacheHelper.requestClearCache();
    }

    /**
     * Clear THIS instance only JPA l2 cache
     */
    @DELETE
    @Path("LocalEmCache")
    public void directWipeEmCache() {
        jpaCacheHelper.clearCacheLocal();
    }

    @GET
    @Path("ReviveCluster")
    public void revive() {
        applicationLifecycle.requestClusterMemberNotification();
    }

    @GET
    @Path("version")
    @Produces(MediaType.TEXT_PLAIN)
    public String getVersion() {
        return Helper.getWegasProperty("wegas.build.version", "unknown");
    }

    @GET
    @Path("build_number")
    @Produces(MediaType.TEXT_PLAIN)
    public String getBuildNumber() {
        return Helper.getWegasProperty("wegas.build.number", "unknown");
    }

    @GET
    @Path("full_version")
    @Produces(MediaType.TEXT_PLAIN)
    public String getFullVersion() {
        return "Wegas-" + this.getVersion();
    }

    @GET
    @Path("build_details")
    @Produces(MediaType.TEXT_PLAIN)
    public String getBuildDetails() throws URISyntaxException {
        StringBuilder sb = new StringBuilder(this.getFullVersion());

        String branch = Helper.getWegasProperty("wegas.build.branch", null);
        Integer githubVersion = null;

        if (!Helper.isNullOrEmpty(branch)) {
            String prBranch = Helper.getWegasProperty("wegas.build.pr_branch", null);
            String strPrNumber = Helper.getWegasProperty("wegas.build.pr_number", null);
            sb.append(", ");

            if (!Helper.isNullOrEmpty(strPrNumber) && !"false".equals(strPrNumber)) {
                sb.append("pull request ").append(strPrNumber).append('/').append(prBranch).append(" into ").append(branch);

                githubVersion = findCurrentGithubRunNumber(prBranch, true);
            } else {
                sb.append(branch).append(" branch");
                githubVersion = findCurrentGithubRunNumber(branch, false);
            }
            sb.append(", build #").append(this.getBuildNumber());
        } else {
            sb.append(", NinjaBuild");
        }

        if (githubVersion != null && githubVersion > 0) {
            sb.append(", github last build is #").append(githubVersion);
        }

        return sb.toString();
    }

    @GET
    @Path("pr_number")
    @Produces(MediaType.TEXT_PLAIN)
    public Long getPrNumber() {
        String prNumber = Helper.getWegasProperty("wegas.build.pr_number", "-1");
        if (Helper.isNullOrEmpty(prNumber)) {
            return -1l;
        } else {
            try {
                return Long.parseLong(prNumber);
            } catch (NumberFormatException ex) {
                return -1l;
            }
        }
    }

    @GET
    @Path("pr_branch")
    @Produces(MediaType.TEXT_PLAIN)
    public String getPrBranch() {
        String prBranch = Helper.getWegasProperty("wegas.build.pr_branch", "");
        if (!Helper.isNullOrEmpty(prBranch)) {
            return prBranch;
        }
        return "";
    }

    @GET
    @Path("branch")
    @Produces(MediaType.TEXT_PLAIN)
    public String getBranch() {
        String prBranch = Helper.getWegasProperty("wegas.build.branch", "");
        if (!Helper.isNullOrEmpty(prBranch)) {
            return prBranch;
        }
        return "";
    }

    @GET
    @Path("build_details_pr/{number: [1-9][0-9]*}/{branch: [a-zA-Z0-9]*}")
    @Produces(MediaType.TEXT_PLAIN)
    public Integer getBuildDetailsForPr(@PathParam("number") Integer number, @PathParam("branch") String branch) throws URISyntaxException {
        return findCurrentGithubRunNumber(branch, true);
    }

    private static int findCurrentGithubRunNumber(String branch, boolean pr) {

        try {
            HttpClient client = HttpClientBuilder.create().build();

            URIBuilder builder = new URIBuilder(GITHUB_URL + "/repos/heigvd/Wegas/actions/runs");
            builder.addParameter("branch", branch);
            builder.addParameter("status", "success");
            builder.addParameter("event_type", pr ? "pull_request" : "push"); // only pull_requests
            //builder.addParameter("sort_by", "id:desc"); // id first
            //builder.addParameter("limit", "1");// only the first result

            HttpGet get = new HttpGet(builder.build());
            get.setHeader("Accept", "application/vnd.github.v3+json");
            get.setHeader("User-Agent", "Wegas");

            HttpResponse response = client.execute(get);

            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            response.getEntity().writeTo(baos);
            String strResponse = baos.toString("UTF-8");

            try (JsonReader reader = Json.createReader(new StringReader(strResponse))) {
                JsonObject r = reader.readObject();
                JsonArray builds = r.getJsonArray("workflow_runs");

                if (!builds.isEmpty()) {
                    JsonObject build = builds.get(0).asJsonObject();
                    return build.getInt("run_number", -1);
                }
            }
        } catch (URISyntaxException ex) {
            logger.error("Please review Github URL: {}", GITHUB_URL);
        } catch (IOException ex) {
            logger.error("Error while reading Travis response");
        }
        return -1;
    }

    /**
     * Some text which describe the cluster state
     *
     * @return the cluster state
     */
    @GET
    @Path("ClusterInfo")
    @RequiresRoles("Administrator")
    @Produces(MediaType.TEXT_HTML)
    public String getClusterInfo() {
        StringBuilder sb = new StringBuilder();

        sb.append("<h1>WegasCluster</h1>")
            .append("<h2>Hazelcast</h2>")
            .append("<ul>");

        for (Member m : hzInstance.getCluster().getMembers()) {
            sb.append("<li>").append(m.toString()).append("</li>");
        }

        sb.append("</ul>")
            .append("<h2>LocalList</h2>")
            .append("<ul>");

        for (String m : applicationLifecycle.getMembers()) {
            sb.append("<li>").append(m).append("</li>");
        }

        sb.append("</ul>");

        return sb.toString();
    }

    @GET
    @Path("SetLoggerLevel/{loggerName: .*}/{level: .*}")
    @RequiresRoles("Administrator")
    @Produces(MediaType.TEXT_PLAIN)
    public String changeLoggerLevel(@PathParam("loggerName") String loggerName, @PathParam("level") String level) {
        LoggerLevel payload = new LoggerLevel(loggerName, level);
        events.fire(payload);
        this.changeLoggerLevelInternal(payload);
        return level;
    }

    public String changeLoggerLevelInternal(@Observes @Inbound(eventName = SET_LEVEL_EVENT) LoggerLevel payload) {
        Logger logger = (Logger) LoggerFactory.getLogger(payload.getLoggerName());
        logger.setLevel(Level.valueOf(payload.getLoggerLevel()));
        return logger.getLevel().toString();
    }

    @GET
    @Path("SetPopulatingSynchronous")
    @RequiresRoles("Administrator")
    public String turnPopulatingSynchronous() {
        populatorScheduler.setBroadcast(false);
        populatorScheduler.setAsync(false);
        return "Populating Process is now synchronous";
    }

    @GET
    @Path("SetPopulatingAsynchronous")
    @RequiresRoles("Administrator")
    public String turnPopulatingAsynchronous() {
        populatorScheduler.setBroadcast(true);
        populatorScheduler.setAsync(true);
        return "Populating Process is now asynchronous";
    }

    @GET
    @Path("StartPopulating")
    @RequiresRoles("Administrator")
    public String startPopulating() {
        populatorScheduler.startAll();
        return "STARTED";
    }

    @GET
    @Path("StopPopulating")
    @RequiresRoles("Administrator")
    public String stopPopulating() {
        populatorScheduler.stopAll();
        return "STOPPED";
    }

    @GET
    @Path("AbortPopulating")
    @RequiresRoles("Administrator")
    public String abortPopulating() {
        populatorScheduler.abortAll();
        return "STOPPED";
    }

    private static class TreeNode {

        private static Level[] LEVELS = {
            Level.OFF,
            Level.ERROR,
            Level.WARN,
            Level.INFO,
            Level.DEBUG,
            Level.TRACE,
            Level.ALL
        };

        private String name;
        private Map<String, TreeNode> children = new HashMap<>();
        private Logger logger;

        public TreeNode(String name) {
            this.name = name;
        }

        private TreeNode getOrCreateLeaf(String path) {
            String segment;
            String subPath = null;
            if (path.contains(".")) {
                segment = path.split("\\.")[0];
                subPath = path.substring(path.indexOf('.') + 1);
            } else {
                segment = path;
            }

            if (!this.children.containsKey(segment)) {
                TreeNode newChild = new TreeNode(segment);
                this.children.put(segment, newChild);
            }

            TreeNode child = this.children.get(segment);

            if (subPath == null) {
                return child;
            } else {
                return child.getOrCreateLeaf(subPath);
            }
        }

        @Override
        public String toString() {
            StringBuilder sb = new StringBuilder("<li><div class='header'>");
            if (this.name != null && !this.name.isEmpty()) {
                sb.append("<b>").append(this.name).append("</b>");
            }

            if (logger != null) {
                sb.append(": <span class='levels'>");
                for (Level l : LEVELS) {
                    String className = (logger.getLevel() != null && logger.getLevel().equals(l) ? " current direct level" : (logger.getEffectiveLevel().equals(l) ? " current level" : " level"));
                    sb.append("<span class='").append(className).append("' data-logger='").append(logger.getName()).append("' data-level='").append(l).append("'>");
                    sb.append(l);
                    sb.append("</span>");
                }
                sb.append("</span>");
            }
            sb.append("</div>");
            for (TreeNode child : children.values()) {
                sb.append("<ul>").append(System.lineSeparator());
                sb.append(child);
                sb.append("</ul>").append(System.lineSeparator());
            }

            sb.append("</li>").append(System.lineSeparator());

            return sb.toString();
        }
    }

    @GET
    @Path("Loggers")
    @RequiresRoles("Administrator")
    @Produces(MediaType.TEXT_HTML)
    public String listLogger() {
        TreeNode root = new TreeNode(null);

        LoggerContext lc = (LoggerContext) LoggerFactory.getILoggerFactory();
        for (Logger logger : lc.getLoggerList()) {
            String name = logger.getName();
            if (name.startsWith("com.wegas")) {
                TreeNode leaf = root.getOrCreateLeaf(name);
                leaf.logger = logger;
            }
        }

        StringBuilder sb = new StringBuilder();

        sb.append("<style>")
            .append("ul, li {\n"
                + "      padding-left: 5px;\n"
                + "  }\n"
                + "\n"
                + "li .level.direct {\n"
                + "    text-decoration: underline;"
                + "}\n"
                + ".header:hover {background-color: #cecece}\n"
                + "li .level.current {\n"
                + "    font-weight: bold;"
                + "}"
                + "li .level {\n"
                + "    margin-left : 10px;\n"
                + "    cursor: pointer;"
                + "}\n"
                + "\n"
                + ".levels {\n"
                + "    left: 375px;\n"
                + "    position: absolute;\n"
                + "}")
            .append("</style>")
            .append("<ul>")
            .append(root)
            .append("</ul>\n"
                + "<script>document.body.onclick= function(e){\n"
                + "   e=window.event? event.srcElement: e.target;\n"
                + "   if(e.className && e.className.indexOf('level')!=-1){\n"
                + "		var logger = e.getAttribute(\"data-logger\");\n"
                + " 		var level = e.getAttribute(\"data-level\");\n"
                + "        fetch(\"SetLoggerLevel/\" + logger + \"/\" + level, {credentials: \"same-origin\"}).then(function(){window.location.reload();});\n"
                + "   }\n"
                + "\n"
                + "}")
            .append("</script>");

        return sb.toString();
    }

    @GET
    @Path("Locks")
    @RequiresRoles("Administrator")
    @Produces(MediaType.TEXT_HTML)
    public String listLockedTokens() {
        List<ConcurrentHelper.RefCounterLock> allLockedTokens = concurrentHelper.getAllLockedTokens();
        StringBuilder sb = new StringBuilder();

        sb.append("<style>")
            .append("ul, li {\n"
                + "      padding-left: 5px;\n"
                + "  }\n"
                + "\n"
                + "li .level.direct {\n"
                + "    text-decoration: underline;"
                + "}"
                + "li .level.current {\n"
                + "    font-weight: bold;"
                + "}"
                + "li .level {\n"
                + "    margin-left : 10px;\n"
                + "    cursor: pointer;"
                + "}\n"
                + "\n"
                + ".levels {\n"
                + "    left: 300px;\n"
                + "    position: absolute;\n"
                + "}")
            .append("</style>")
            .append("<h1>Locks</h1>")
            .append("<h3>LocalLocks: effectiveToken</h3>")
            .append(concurrentHelper.getMyLocks())
            .append("<h3>Locks</h3>")
            .append("<ul>");

        for (ConcurrentHelper.RefCounterLock lock : allLockedTokens) {
            String effAudicence;
            sb.append("<li class='lock' data-audience='");
            if (!Helper.isNullOrEmpty(lock.getAudience())) {
                sb.append(lock.getAudience());
                effAudicence = lock.getAudience();
            } else {
                effAudicence = "internal";
            }
            sb.append("' data-token='");
            sb.append(lock.getToken());
            sb.append("'>");
            sb.append(effAudicence).append("::").append(lock.getToken()).append(' ').append(lock.getCounter()).append('x');
            sb.append("</li>");
        }

        sb.append("</ul>")
            .append("<script>")
            .append("document.body.onclick= function(e){\n"
                + "   e=window.event? event.srcElement: e.target;\n"
                + "   if(e.className && e.className.indexOf('lock')!=-1){\n"
                + "		var audience = e.getAttribute(\"data-audience\");\n"
                + " 		var token = e.getAttribute(\"data-token\");\n"
                + "        fetch(\"ReleaseLock/\" + token + \"/\" + audience, {credentials: \"same-origin\"}).then(function(){window.location.reload();});\n"
                + "   }\n"
                + "\n"
                + "}")
            .append("</script>");

        return sb.toString();
    }

    @GET
    @Path("ReleaseLock/{token: .*}/{audience: .*}")
    @RequiresRoles("Administrator")
    @Produces(MediaType.TEXT_PLAIN)
    public String releaseLock(@PathParam("token") String token, @PathParam("audience") String audience) {
        concurrentHelper.unlock(token, audience, true);
        return "ok";
    }

    /**
     * Request all cluster instances to clear JPA l2 cache
     */
    @DELETE
    @Path("JCR_GC")
    public void jcrGC() {
        jcrConnector.revisionGC();
    }

    /**
     * Returns the current time according to the server.
     */
    @GET
    @Path("ServerTime")
    public static Date getServerTime() {
        return new Date();
    }

    @GET
    @Path("RequestInspector")
    @Produces(MediaType.TEXT_HTML)
    public String getRequestDetails(@Context HttpServletRequest request) {
        StringBuilder sb = new StringBuilder();
        sb.append("<h1>Http Request</h1>")
            .append("<h2>Headers</h2>")
            .append("<ul>");
        Enumeration<String> headerNames = request.getHeaderNames();
        while (headerNames.hasMoreElements()) {
            String headerName = headerNames.nextElement();

            if (!headerName.equals("cookie")) { // do no print any cookies
                request.getHeader(headerName);
                sb.append("<li>").append(headerName).append(": ").append(request.getHeader(headerName)).append("</li>");
            }
        }
        sb.append("</ul>")
            .append("<h2>Others</h2>")
            .append("<ul>")
            .append("<li>")
            .append("ContextPath: ").append(request.getContextPath())
            .append("</li>")
            .append("<li>")
            .append("PathInfo: ").append(request.getPathInfo())
            .append("</li>")
            .append("<li>")
            .append("PathTranslated: ").append(request.getPathTranslated())
            .append("</li>")
            .append("<li>")
            .append("QueryString: ").append(request.getQueryString())
            .append("</li>")
            .append("<li>")
            .append("RequestURI: ").append(request.getRequestURI())
            .append("</li>")
            .append("<li>")
            .append("RequestURL: ").append(request.getRequestURL())
            .append("</li>")
            .append("<li>")
            .append("ServletPath: ").append(request.getServletPath())
            .append("</li>")
            .append("</ul>");

        return sb.toString();
    }

    @GET
    @Path("GraalVmMonitor")
    @RequiresRoles("Administrator")
    @Produces(MediaType.TEXT_HTML)
    public String getGraalVMLoadedClasses() {
        Enumeration<String> classes = nhMonitor.getClasses();
        String result = "<h1>Java classes loaded by GraalVM</h1><ul>";

        while (classes.hasMoreElements()) {
            result += "<li>" + classes.nextElement() + "</li>";
        }
        result += "</ul>";

        result += "<h1>Java classes rejected by GraalVM</h1>";
        result += "<h2>Blacklisted</h2><ul>";

        Enumeration<String> blacklistedClasses = nhMonitor.getBlacklistedClasses();
        while (blacklistedClasses.hasMoreElements()) {
            result += "<li>" + blacklistedClasses.nextElement() + "</li>";
        }
        result += "</ul>";

        result += "<h2>Not whitelisted</h2><ul>";
        Enumeration<String> notWL = nhMonitor.getNotWhitelusted();
        while (notWL.hasMoreElements()) {
            result += "<li>" + notWL.nextElement() + "</li>";
        }
        result += "</ul>";

        return result;
    }
}
