/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2017 School of Business and Engineering Vaud, Comem
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
import com.wegas.core.ejb.HelperBean;
import fish.payara.micro.cdi.Outbound;
import java.util.HashMap;
import java.util.Map;
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

    @Inject
    @Outbound(eventName = HelperBean.CLEAR_CACHE_EVENT_NAME, loopBack = true)
    Event<String> messages;

    @Inject
    private ApplicationLifecycle applicationLifecycle;

    @Inject
    private HazelcastInstance hzInstance;

    @Inject
    private PopulatorScheduler populatorScheduler;

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
    public String getBuildDetails() {
        StringBuilder sb = new StringBuilder(this.getFullVersion());

        String branch = Helper.getWegasProperty("wegas.build.branch", null);

        if (!Helper.isNullOrEmpty(branch)) {
            String prBranch = Helper.getWegasProperty("wegas.build.pr_branch", null);
            String prNumber = Helper.getWegasProperty("wegas.build.pr_number", null);
            sb.append(", ");
            if (!Helper.isNullOrEmpty(prNumber) && !"false".equals(prNumber)) {
                sb.append("pull request ").append(prNumber).append("/").append(prBranch).append(" into ").append(branch);
            } else {
                sb.append(branch).append(" branch");
            }
            sb.append(", build #").append(this.getBuildNumber());
        } else {
            sb.append(", NinjaBuild");
        }

        return sb.toString();
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

            if (this.name != null && !this.name.isEmpty()) {
                sb.append("<b>").append(this.name).append("</b>");
            }

            if (logger != null) {
                sb.append(": <span class='levels'>");
                for (Level l : LEVELS) {
                    sb.append("<span class='level' data-logger='").append(logger.getName()).append("' data-level='").append(l).append("'>");
                    if (logger.getEffectiveLevel().equals(l)) {
                        sb.append("<b>").append(l).append("</b>");
                    } else {
                        sb.append(l);
                    }
                    sb.append("</span>");
                }
                sb.append("</span>");
            }

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

}
