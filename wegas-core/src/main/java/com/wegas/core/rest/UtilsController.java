/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2018 School of Business and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.core.rest;

import ch.qos.logback.classic.Level;
import ch.qos.logback.classic.Logger;
import ch.qos.logback.classic.LoggerContext;
import com.google.gson.JsonArray;
import com.google.gson.JsonElement;
import com.google.gson.JsonObject;
import com.google.gson.JsonParser;
import com.hazelcast.core.HazelcastInstance;
import com.hazelcast.core.Member;
import com.wegas.core.Helper;
import com.wegas.core.async.PopulatorScheduler;
import com.wegas.core.ejb.ApplicationLifecycle;
import com.wegas.core.ejb.ConcurrentHelper;
import com.wegas.core.ejb.HelperBean;
import fish.payara.micro.cdi.Outbound;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.net.URISyntaxException;
import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import javax.ejb.Stateless;
import javax.enterprise.event.Event;
import javax.inject.Inject;
import javax.ws.rs.Consumes;
import javax.ws.rs.DELETE;
import javax.ws.rs.GET;
import javax.ws.rs.Path;
import javax.ws.rs.PathParam;
import javax.ws.rs.Produces;
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

    private static final String TRAVIS_URL = "https://api.travis-ci.org";

    @Inject
    @Outbound(eventName = HelperBean.CLEAR_CACHE_EVENT_NAME, loopBack = true)
    Event<String> messages;

    @Inject
    private ApplicationLifecycle applicationLifecycle;

    @Inject
    private HazelcastInstance hzInstance;

    @Inject
    private PopulatorScheduler populatorScheduler;

    @Inject
    private ConcurrentHelper concurrentHelper;

    @DELETE
    @Path("EmCache")
    public void wipeEmCache() {
        messages.fire("clear");
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
        Long travisVersion = null;

        if (!Helper.isNullOrEmpty(branch)) {
            String prBranch = Helper.getWegasProperty("wegas.build.pr_branch", null);
            String prNumber = Helper.getWegasProperty("wegas.build.pr_number", null);
            sb.append(", ");
            if (!Helper.isNullOrEmpty(prNumber) && !"false".equals(prNumber)) {
                sb.append("pull request ").append(prNumber).append("/").append(prBranch).append(" into ").append(branch);

                travisVersion = findCurrentTravisVersionPr("master", prNumber);
            } else {
                sb.append(branch).append(" branch");
                travisVersion = findCurrentTravisVersion(branch);
            }
            sb.append(", build #").append(this.getBuildNumber());
        } else {
            sb.append(", NinjaBuild");
        }

        if (travisVersion != null && travisVersion > 0) {
            sb.append(", travis last build is #").append(travisVersion);
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
    @Path("build_details_pr/{number: [1-9][0-9]*}/{branch: [a-zA-Z0-9]*}")
    @Produces(MediaType.TEXT_PLAIN)
    public Long getBuildDetailsForPr(@PathParam("number") String number, @PathParam("branch") String branch) throws URISyntaxException {
        return findCurrentTravisVersionPr(branch, number);
    }

    private static Long findCurrentTravisVersionPr(String branch, String prNumber) {

        try {
            HttpClient client = HttpClientBuilder.create().build();

            URIBuilder builder = new URIBuilder(TRAVIS_URL + "/repo/Heigvd%2FWegas/builds");
            builder.addParameter("branch.name", branch);
            builder.addParameter("state", "passed");
            builder.addParameter("event_type", "pull_request"); // only pull_requests
            builder.addParameter("sort_by", "id:desc"); // id first
            //builder.addParameter("limit", "1");// only the first result

            HttpGet get = new HttpGet(builder.build());
            get.setHeader("Travis-API-Version", "3");
            get.setHeader("User-Agent", "Wegas");

            HttpResponse response = client.execute(get);

            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            response.getEntity().writeTo(baos);
            String strResponse = baos.toString("UTF-8");

            JsonParser jsonParser = new JsonParser();
            JsonObject parse = jsonParser.parse(strResponse).getAsJsonObject();
            JsonArray builds = parse.getAsJsonArray("builds");
            for (JsonElement b : builds) {
                JsonObject build = b.getAsJsonObject();
                String val = build.get("pull_request_number").getAsString();
                if (prNumber.equals(val)) {
                    return build.get("number").getAsLong();
                }
            }
        } catch (URISyntaxException | IOException ex) {
        }
        return -1l;
    }

    private static Long findCurrentTravisVersion(String branch) {
        try {
            HttpClient client = HttpClientBuilder.create().build();

            URIBuilder builder = new URIBuilder(TRAVIS_URL + "/repo/Heigvd%2FWegas/builds");
            builder.addParameter("branch.name", branch);
            builder.addParameter("state", "passed");
            builder.addParameter("event_type", "push"); // avoid pull_requests
            builder.addParameter("sort_by", "id:desc"); // bid id first
            builder.addParameter("limit", "1");// only the first result

            HttpGet get = new HttpGet(builder.build());
            get.setHeader("Travis-API-Version", "3");
            get.setHeader("User-Agent", "Wegas");

            HttpResponse response = client.execute(get);

            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            response.getEntity().writeTo(baos);
            String strResponse = baos.toString("UTF-8");

            Pattern p = Pattern.compile(".*\"number\": \"(\\d+)\".*", Pattern.DOTALL);
            Matcher matcher = p.matcher(strResponse);
            if (matcher.matches() && matcher.groupCount() == 1) {
                return Long.parseLong(matcher.group(1), 10);
            } else {
                return -1l;
            }
        } catch (URISyntaxException ex) {
            return -1l;
        } catch (IOException ex) {
            return -1l;
        }
    }

    /**
     * Some text which descibe the cluster state
     *
     * @return the cluster state
     */
    @GET
    @Path("ClusterInfo")
    @RequiresRoles("Administrator")
    @Produces(MediaType.TEXT_HTML)
    public String getClusterInfo() {
        StringBuilder sb = new StringBuilder();

        sb.append("<h1>WegasCluster</h1>");

        sb.append("<h2>Hazelcast</h2>");

        sb.append("<ul>");

        for (Member m : hzInstance.getCluster().getMembers()) {
            sb.append("<li>").append(m.toString()).append("</li>");
        }

        sb.append("</ul>");

        sb.append("<h2>LocalList</h2>");
        sb.append("<ul>");

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
    public String setLoggerLevel(@PathParam("loggerName") String loggerName, @PathParam("level") String level) {
        Logger logger = (Logger) LoggerFactory.getLogger(loggerName);
        logger.setLevel(Level.valueOf(level));
        return logger.getLevel().toString();
    }

    @GET
    @Path("SetPopulatingSynchronous")
    @RequiresRoles("Administrator")
    public String setPopulatingSynchronous() {
        populatorScheduler.setBroadcast(false);
        populatorScheduler.setAsync(false);
        return "Populating Process is now synchronous";
    }

    @GET
    @Path("SetPopulatingAsynchronous")
    @RequiresRoles("Administrator")
    public String setPopulatingAsynchronous() {
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
        private ch.qos.logback.classic.Logger logger;

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
            StringBuilder sb = new StringBuilder("<li>");
            sb.append("<div class='header'>");
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
        for (ch.qos.logback.classic.Logger logger : lc.getLoggerList()) {
            String name = logger.getName();
            if (name.startsWith("com.wegas")) {
                TreeNode leaf = root.getOrCreateLeaf(name);
                leaf.logger = logger;
            }
        }

        StringBuilder sb = new StringBuilder();

        sb.append("<style>");
        sb.append("ul, li {\n"
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
                + "}");
        sb.append("</style>");

        sb.append("<ul>");
        sb.append(root);
        sb.append("</ul>");

        sb.append("<script>");
        sb.append("document.body.onclick= function(e){\n"
                + "   e=window.event? event.srcElement: e.target;\n"
                + "   if(e.className && e.className.indexOf('level')!=-1){\n"
                + "		var logger = e.getAttribute(\"data-logger\");\n"
                + " 		var level = e.getAttribute(\"data-level\");\n"
                + "        fetch(\"SetLoggerLevel/\" + logger + \"/\" + level, {credentials: \"same-origin\"}).then(function(){window.location.reload();});\n"
                + "   }\n"
                + "\n"
                + "}");
        sb.append("</script>");

        return sb.toString();
    }

    @GET
    @Path("Locks")
    @RequiresRoles("Administrator")
    @Produces(MediaType.TEXT_HTML)
    public String listLockedTokens() {
        List<ConcurrentHelper.RefCounterLock> allLockedTokens = concurrentHelper.getAllLockedTokens();
        StringBuilder sb = new StringBuilder();

        sb.append("<style>");
        sb.append("ul, li {\n"
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
                + "}");
        sb.append("</style>");

        sb.append("<h1>Locks</h1>");
        sb.append("<h3>LocalLocks: effectiveToken</h3>");
        sb.append(concurrentHelper.getMyLocks());
        sb.append("<h3>Locks</h3>");
        sb.append("<ul>");

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
            sb.append(effAudicence).append("::").append(lock.getToken()).append(" ").append(lock.getCounter()).append("x");
            sb.append("</li>");
        }

        sb.append("</ul>");

        sb.append("<script>");
        sb.append("document.body.onclick= function(e){\n"
                + "   e=window.event? event.srcElement: e.target;\n"
                + "   if(e.className && e.className.indexOf('lock')!=-1){\n"
                + "		var audience = e.getAttribute(\"data-audience\");\n"
                + " 		var token = e.getAttribute(\"data-token\");\n"
                + "        fetch(\"ReleaseLock/\" + token + \"/\" + audience, {credentials: \"same-origin\"}).then(function(){window.location.reload();});\n"
                + "   }\n"
                + "\n"
                + "}");
        sb.append("</script>");

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
     * Returns the current time according to the server.
     */
    @GET
    @Path("ServerTime")
    public static Date getServerTime() {
        return new Date();
    }

}
