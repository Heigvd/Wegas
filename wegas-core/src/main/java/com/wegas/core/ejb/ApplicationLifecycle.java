/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2017 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.core.ejb;

import com.hazelcast.core.HazelcastInstance;
import com.hazelcast.core.LifecycleEvent;
import com.hazelcast.core.LifecycleListener;
import com.hazelcast.core.Member;
import com.hazelcast.core.MemberAttributeEvent;
import com.hazelcast.core.MembershipEvent;
import com.hazelcast.core.MembershipListener;
import fish.payara.micro.cdi.Inbound;
import fish.payara.micro.cdi.Outbound;
import io.prometheus.client.Gauge;
import java.util.HashSet;
import java.util.Set;
import javax.ejb.LocalBean;
import javax.ejb.Singleton;
import javax.enterprise.event.Event;
import javax.enterprise.event.Observes;
import javax.inject.Inject;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * LifeCycle Dedicated HttpServlet
 *
 * @author Maxence Laurent (maxence.laurent at gmail.com)
 */
@Singleton
@LocalBean
public class ApplicationLifecycle implements MembershipListener, LifecycleListener {

    private static final Gauge hazelCastSize = Gauge.build().name("cluster_size").help("Number of hazelcast members").register();
    private static final Gauge internalSize = Gauge.build().name("internalcluster_size").help("Number of hazelcast members in locallist").register();

    public static final String LIFECYCLE_UP = "InstanceUp";
    public static final String LIFECYCLE_DOWN = "InstanceDown";
    public static final String REQUEST_ALL = "RequestAnnouncement";

    private final Logger logger = LoggerFactory.getLogger(ApplicationLifecycle.class);

    /*
     * local member list to make the list available when the local instance has been shutdown
     */
    private Set<String> clusterMembers = new HashSet<>();

    /**
     * To inform other cluster member this instance id up
     */
    @Inject
    @Outbound(eventName = LIFECYCLE_UP)
    private Event<String> eventsUp;

    /**
     * To inform other cluster member this instance is up
     */
    @Inject
    @Outbound(eventName = LIFECYCLE_DOWN)
    private Event<String> eventsDown;

    /**
     * To inform other cluster member this instance id up
     */
    @Inject
    @Outbound(eventName = REQUEST_ALL, loopBack = true)
    private Event<String> reqAll;

    @Inject
    private HazelcastInstance hzInstance;

    @Inject
    private WebsocketFacade websocketFacade;

    public void addMember(String member) {
        if (!this.clusterMembers.contains(member)) {
            internalSize.inc();
            this.clusterMembers.add(member);
        }
    }

    public void removeMember(String member) {
        if (this.clusterMembers.remove(member)) {
            internalSize.dec();
        }
    }

    /**
     * Event listener that register new instance within local list of members
     *
     * @param memberUUID new instance uuid
     */
    public void instanceUp(@Observes @Inbound(eventName = LIFECYCLE_UP) String memberUUID) {
        logger.info("REGISTER MEMBER " + memberUUID);
        this.addMember(memberUUID);
        //logger.error("EVENTRECEIVED: " + event.getMember() + " -> " + event.isUp());
        logClusterInfo(null);
    }

    /**
     * Event listener that register new instance within local list of members
     *
     * @param memberUUID new instance uuid
     */
    public void instanceDown(@Observes @Inbound(eventName = LIFECYCLE_DOWN) String memberUUID) {
        logger.info("REMOVE MEMBER " + memberUUID);
        this.removeMember(memberUUID);
        //logger.error("EVENTRECEIVED: " + event.getMember() + " -> " + event.isUp());
        logClusterInfo(null);
    }

    /**
     * Event listener that register new instance within local list of members
     *
     * @param fromMemberUUID
     */
    public void announcemenetRequested(@Observes @Inbound(eventName = REQUEST_ALL) String fromMemberUUID) {
        logger.info("MEMBER " + fromMemberUUID + " REQUESTS ANNOUNCE");
        this.sendInstanceReadyEvent(hzInstance.getCluster().getLocalMember().getUuid());
        logClusterInfo(null);
    }

    /**
     * Return the current numnber of member, base on the local list of members
     *
     * @return  size of the local list of members
     */
    public int countMembers() {
        return clusterMembers.size();
    }

    /**
     * Inform other members this instance is ready
     *
     * @param uuid
     */
    public void sendInstanceReadyEvent(String uuid) {
        eventsUp.fire(uuid);
    }

    /**
     * Inform other members this instance is ready
     *
     * @param uuid
     */
    public void sendInstanceDownEvent(String uuid) {
        eventsDown.fire(uuid);
    }

    public void requestClusterMemberNotification() {
        reqAll.fire(hzInstance.getCluster().getLocalMember().getUuid());
    }

    @Override
    public void memberAdded(MembershipEvent me) {
        // This event is throw way too early...
        // New membership are managed by ApplicationStartup servlet
        logger.info("NEW MEMBER (MembershipEvent) " + me.getMember().getUuid());
        this.requestClusterMemberNotification();
        logClusterInfo(null);
        hazelCastSize.set(me.getMembers().size());
    }

    @Override
    public void memberAttributeChanged(MemberAttributeEvent mae) {
        logger.info("MEMBER ATTR CHANGE: " + mae.getMember().getUuid());
        logClusterInfo(null);
        // no need
    }

    /**
     * remove a member from the local list
     *
     * @param me the membership event
     */
    @Override
    public void memberRemoved(MembershipEvent me) {
        logger.info("MEMBER " + me.getMember().getUuid() + " REMOVED (membership event)");
        this.removeMember(me.getMember().getUuid());
        logClusterInfo(null);
        hazelCastSize.set(me.getMembers().size());
    }

    public Set<String> getMembers() {
        return clusterMembers;
    }

    @Override
    public void stateChanged(LifecycleEvent event) {
        if (event.getState() == LifecycleEvent.LifecycleState.SHUTTING_DOWN) {
            /*
             * Inform other instance this instance is shutting down
             * This mechanism has the same purpose as MembershipListener.memberRemoved,
             * but occurs sooner.
             * It's usefull when all instances are stopped at the exact same time.
             */
            this.sendInstanceDownEvent(this.hzInstance.getCluster().getLocalMember().getUuid());
        }

        logClusterInfo("LifecycleEvent: " + event.getState());
    }

    public void sendWegasReadyEvent() {
        logger.info("WEGAS IS READY TO SERVE");
        hazelCastSize.set(hzInstance.getCluster().getMembers().size());
        websocketFacade.sendLifeCycleEvent(WebsocketFacade.WegasStatus.READY, null);
        this.logClusterInfo(null);
    }

    public void sendWegasDownEvent() {
        logger.info("WEGAS IS NOW COMPLETELY DOWN");
        websocketFacade.sendLifeCycleEvent(WebsocketFacade.WegasStatus.DOWN, null);
        this.logClusterInfo(null);
    }

    private void logClusterInfo(String prefix) {
        StringBuilder sb = new StringBuilder(prefix != null ? prefix : "");

        sb.append("*** WegasCluster ***\n");

        if (hzInstance != null) {
            sb.append("** Hazelcast **\n");

            for (Member m : hzInstance.getCluster().getMembers()) {
                sb.append(" - ").append(m.toString()).append("\n");
            }
        } else {
            sb.append("Hazelcast is down\n");
        }

        sb.append("** LocalList **\n");

        for (String m : this.getMembers()) {
            sb.append(" - ").append(m).append("\n");
        }

        logger.info(sb.toString());
    }
}
