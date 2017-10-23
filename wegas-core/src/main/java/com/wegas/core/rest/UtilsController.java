/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2017 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.core.rest;

import com.hazelcast.core.HazelcastInstance;
import com.hazelcast.core.Member;
import com.wegas.core.Helper;
import com.wegas.core.async.PopulatorScheduler;
import com.wegas.core.ejb.ApplicationLifecycle;
import com.wegas.core.ejb.HelperBean;
import fish.payara.micro.cdi.Outbound;

import javax.ejb.Stateless;
import javax.enterprise.event.Event;
import javax.inject.Inject;
import javax.ws.rs.Consumes;
import javax.ws.rs.DELETE;
import javax.ws.rs.GET;
import javax.ws.rs.Path;
import javax.ws.rs.Produces;
import javax.ws.rs.core.MediaType;
import org.apache.shiro.authz.annotation.RequiresRoles;

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
     * Retrieve the list of online users
     *
     * @return
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
}
