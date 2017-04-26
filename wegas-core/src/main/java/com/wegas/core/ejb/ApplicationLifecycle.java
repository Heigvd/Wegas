/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013, 2014, 2015 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.core.ejb;

import com.hazelcast.core.HazelcastInstance;
import com.hazelcast.core.LifecycleEvent;
import com.hazelcast.core.LifecycleListener;
import com.hazelcast.core.MemberAttributeEvent;
import com.hazelcast.core.MembershipEvent;
import com.hazelcast.core.MembershipListener;
import fish.payara.micro.cdi.Inbound;
import fish.payara.micro.cdi.Outbound;
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
     * To inform other cluster member this instance id up
     */
    @Inject
    @Outbound(eventName = LIFECYCLE_DOWN)
    private Event<String> eventsDown;

    /**
     * To inform other cluster member this instance id up
     */
    @Inject
    @Outbound(eventName = REQUEST_ALL)
    private Event<String> reqAll;

    @Inject
    private HazelcastInstance hzInstance;

    @Inject
    private WebsocketFacade websocketFacade;

    public void addMember(String member) {
        this.clusterMembers.add(member);
    }

    public void removeMember(String member) {
        this.clusterMembers.remove(member);
    }

    /**
     * Event listener that register new instance within local list of members
     *
     * @param memberUUID new instance uuid
     */
    public void instanceUp(@Observes @Inbound(eventName = LIFECYCLE_UP) String memberUUID) {
        logger.error("REGISTER MEMBER " + memberUUID);
        this.addMember(memberUUID);
        //logger.error("EVENTRECEIVED: " + event.getMember() + " -> " + event.isUp());
    }

    /**
     * Event listener that register new instance within local list of members
     *
     * @param memberUUID new instance uuid
     */
    public void instanceDown(@Observes @Inbound(eventName = LIFECYCLE_DOWN) String memberUUID) {
        logger.error("REMOVING MEMBER " + memberUUID);
        this.removeMember(memberUUID);
        //logger.error("EVENTRECEIVED: " + event.getMember() + " -> " + event.isUp());
    }

    /**
     * Event listener that register new instance within local list of members
     *
     * @param fromMemberUUID
     */
    public void announcemenetRequested(@Observes @Inbound(eventName = REQUEST_ALL) String fromMemberUUID) {
        logger.error("MEMBER REQUEST ANNOUNCE" + fromMemberUUID);
        this.sendInstanceReadyEvent(hzInstance.getCluster().getLocalMember().getUuid());
    }

    /**
     * Return the current numnber of member, base on the local list of members
     *
     * @return
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

    @Override
    public void memberAdded(MembershipEvent me) {
        // This event is throw way too early...
        // New membership are managed by ApplicationStartup servlet
        logger.error("NEW MEMBER " + me.getMember().getUuid());
        // 
        reqAll.fire(hzInstance.getCluster().getLocalMember().getUuid());
    }

    @Override
    public void memberAttributeChanged(MemberAttributeEvent mae) {
        logger.error("MEMBER ATTR CHANGE: " + mae.getMember().getUuid());
        // no need
    }

    /**
     * remove a member from the local list
     *
     * @param me the membership event
     */
    @Override
    public void memberRemoved(MembershipEvent me) {
        logger.error("MEMBER " + me.getMember().getUuid() + " REMOVED");
        this.removeMember(me.getMember().getUuid());
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
    }

    public void sendWegasReadyEvent() {
        logger.error("WEGAS IS READY TO SERVE");
        websocketFacade.sendLifeCycleEvent(WebsocketFacade.WegasStatus.READY, null);
    }

    public void sendWegasDownEvent() {
        logger.error("WEGAS IS NOW COMPLETELY DOWN");
        websocketFacade.sendLifeCycleEvent(WebsocketFacade.WegasStatus.DOWN, null);
    }
}
