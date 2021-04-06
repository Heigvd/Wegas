/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.core.ejb;

import com.hazelcast.cluster.Member;
import com.hazelcast.cluster.MembershipEvent;
import com.hazelcast.cluster.MembershipListener;
import com.hazelcast.core.HazelcastInstance;
import fish.payara.micro.cdi.Inbound;
import fish.payara.micro.cdi.Outbound;
import java.util.HashSet;
import java.util.Set;
import java.util.UUID;
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
public class ApplicationLifecycle implements MembershipListener/*, LifecycleListener*/ {

    private static final String LIFECYCLE_UP = "InstanceUp";
    private static final String LIFECYCLE_DOWN = "InstanceDown";
    private static final String REQUEST_ALL = "RequestAnnouncement";

    private final Logger logger = LoggerFactory.getLogger(ApplicationLifecycle.class);
//
    /*
     * local member list to make the list available when the local instance has been shutdown
     */
    private Set<UUID> clusterMembers = new HashSet<>();

    /**
     * To inform other cluster member this instance id up
     */
    @Inject
    @Outbound(eventName = LIFECYCLE_UP)
    private Event<UUID> eventsUp;

    /**
     * To inform other cluster member this instance is up
     */
    @Inject
    @Outbound(eventName = LIFECYCLE_DOWN)
    private Event<UUID> eventsDown;

    /**
     * To inform other cluster member this instance id up
     */
    @Inject
    @Outbound(eventName = REQUEST_ALL, loopBack = true)
    private Event<UUID> reqAll;

    @Inject
    private HazelcastInstance hzInstance;

    @Inject
    private WebsocketFacade websocketFacade;

    @Inject
    private ConcurrentHelper concurrentHelper;

    public void addMember(UUID member) {
        if (!this.clusterMembers.contains(member)) {
            this.clusterMembers.add(member);
        }
    }

    public void removeMember(UUID member) {
        this.clusterMembers.remove(member);
    }

    public int getHzSize() {
        return hzInstance.getCluster().getMembers().size();
    }

    /**
     * Event listener that register new instance within local list of members
     *
     * @param memberUUID new instance uuid
     */
    public void instanceUp(@Observes @Inbound(eventName = LIFECYCLE_UP) UUID memberUUID) {
        logger.info("REGISTER MEMBER {}", memberUUID);
        this.addMember(memberUUID);
        //logger.error("EVENTRECEIVED: {} -> {} ", event.getMember(),  event.isUp());
        logClusterInfo(null);
    }

    /**
     * Event listener that register new instance within local list of members
     *
     * @param memberUUID new instance uuid
     */
    public void instanceDown(@Observes @Inbound(eventName = LIFECYCLE_DOWN) UUID memberUUID) {
        logger.info("REMOVE MEMBER {}", memberUUID);
        this.removeMember(memberUUID);
        //logger.error("EVENTRECEIVED: {} -> {} ", event.getMember(), event.isUp());
        logClusterInfo(null);
    }

    /**
     * Event listener that register new instance within local list of members
     *
     * @param fromMemberUUID
     */
    public void announcemenetRequested(@Observes @Inbound(eventName = REQUEST_ALL) UUID fromMemberUUID) {
        logger.info("MEMBER {} REQUESTS ANNOUNCE", fromMemberUUID);
        this.sendInstanceReadyEvent(hzInstance.getCluster().getLocalMember().getUuid());
        logClusterInfo(null);
    }

    /**
     * Return the current numnber of member, base on the local list of members
     *
     * @return size of the local list of members
     */
    public int countMembers() {
        return clusterMembers.size();
    }

    /**
     * Inform other members this instance is ready
     *
     * @param uuid
     */
    public void sendInstanceReadyEvent(UUID uuid) {
        eventsUp.fire(uuid);
    }

    /**
     * Inform other members this instance is ready
     *
     * @param uuid
     */
    public void sendInstanceDownEvent(UUID uuid) {
        eventsDown.fire(uuid);
    }

    public void requestClusterMemberNotification() {
        reqAll.fire(hzInstance.getCluster().getLocalMember().getUuid());
    }

    @Override
    public void memberAdded(MembershipEvent me) {
        // This event is throw way too early...
        // New membership are managed by ApplicationStartup servlet
        logger.info("NEW MEMBER (MembershipEvent) {}", me.getMember().getUuid());
        this.requestClusterMemberNotification();
        logClusterInfo(null);
    }

    /**
     * remove a member from the local list
     *
     * @param me the membership event
     */
    @Override
    public void memberRemoved(MembershipEvent me) {
        logger.info("MEMBER {} REMOVED (membership event)", me.getMember().getUuid());
        this.removeMember(me.getMember().getUuid());
        logClusterInfo(null);
    }

    public Set<UUID> getMembers() {
        return clusterMembers;
    }

//    @Override
//    public void stateChanged(LifecycleEvent event) {
//        logger.error("LifecycleEvent: {}", event);
//        if (event.getState() == LifecycleEvent.LifecycleState.SHUTTING_DOWN) {
//            //this.hZshutdown();
//        }
//    }

    public void hZshutdown() {
        //try {
        //concurrentHelper.releaseLocalLocks();
        //} catch (Exception ex) {
        //    logger.error("Error While Releasing locks: {}", ex);
        //}

        /*
         * Inform other instance this instance is shutting down This mechanism has the same purpose
         * as MembershipListener.memberRemoved, but occurs sooner. It's usefull when all instances
         * are stopped at the exact same time.
         */
        try {
            this.sendInstanceDownEvent(this.hzInstance.getCluster().getLocalMember().getUuid());
        } catch (Exception ex) {
            logger.error("Error while sending downEvent: {}", ex);
        }

        try {
            logClusterInfo("PreHzShutdown: ");
        } catch (Exception ex) {
            logger.error("Log Cluster error: {}", ex);
        }
        try {
            String shutdownHook = System.getProperty("hazelcast.shutdownhook.enabled", "true");
            if ("false".equals(shutdownHook)) {
                hzInstance.shutdown();
            }
        } catch (Exception ex) {
            logger.error("HzShutdown Error: {}", ex);
        }
    }

    public void sendWegasReadyEvent() {
        logger.info("WEGAS IS READY TO SERVE");
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
                sb.append(" - ").append(m.toString()).append(System.lineSeparator());
            }
        } else {
            sb.append("Hazelcast is down\n");
        }

        sb.append("** LocalList **\n");

        for (UUID m : this.getMembers()) {
            sb.append(" - ").append(m).append(System.lineSeparator());
        }

        logger.info(sb.toString());
    }
}
