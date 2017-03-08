/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013, 2014, 2015 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.core.ejb;

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
public class ApplicationLifecycle implements MembershipListener {

    public static final String LIFECYCLE_UP = "InstanceUp";

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
    private Event<String> events;

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
        logger.error("UP " + memberUUID);
        this.addMember(memberUUID);
        //logger.error("EVENTRECEIVED: " + event.getMember() + " -> " + event.isUp());
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
        events.fire(uuid);
    }

    @Override
    public void memberAdded(MembershipEvent me) {
        // This event is throw way too early...
        // New membership are managed by ApplicationStartup servlet
    }

    @Override
    public void memberAttributeChanged(MemberAttributeEvent mae) {
        // no need
    }

    /**
     * remove a member from the local list
     *
     * @param me the membership event
     */
    @Override
    public void memberRemoved(MembershipEvent me) {
        this.removeMember(me.getMember().getUuid());
    }

}
