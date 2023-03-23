/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.core.persistence.variable.events;

import ch.albasim.wegas.annotations.View;
import ch.albasim.wegas.annotations.WegasEntityProperty;
import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonView;
import com.wegas.core.ejb.RequestManager.RequestContext;
import com.wegas.core.persistence.AbstractEntity;
import com.wegas.core.persistence.DatedEntity;
import com.wegas.core.persistence.WithPermission;
import com.wegas.core.rest.util.Views;
import com.wegas.core.security.util.WegasPermission;
import com.wegas.editor.ValueGenerators.EmptyString;
import com.wegas.editor.view.Textarea;
import java.util.Collection;
import java.util.Date;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.Lob;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.Temporal;
import jakarta.persistence.TemporalType;


@Entity
@Table(indexes = {
    @Index(columnList = "eventinboxinstance_id"),
    @Index(columnList = "payload_id"),
    @Index(columnList = "time_id"),
    @Index(columnList = "sim_time_id")
})
public class Event extends AbstractEntity implements DatedEntity {

    private static final long serialVersionUID = 1L;
    /**
     *
     */
    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "mcqvarinstrep_seq")
    @JsonView(Views.IndexI.class)
    private Long id;

    /**
     * Event body
     */
    @Lob
    @WegasEntityProperty(
        optional = false, nullable = false, proposal = EmptyString.class,
        view = @View(label = "Payload", value = Textarea.class))
    private String payload;

    /**
     * real world timeStamp for sorting purpose
     */
    @Temporal(TemporalType.TIMESTAMP)
    @Column(name = "creation_time", columnDefinition = "timestamp with time zone")
    @WegasEntityProperty(nullable = false, view = @View(label = "Timestamp"))
    private final Date timeStamp = new Date();

    /**
     * Simulation time, meaning when the event has to occur in the simulation
     */
    @Temporal(TemporalType.TIMESTAMP)
    @Column(name = "simulation_time", columnDefinition = "simulation time")
    @WegasEntityProperty(optional = false, nullable = false, view = @View(label = "Simulation time"))
    private Date simulationTime; // OR Long ?

    /**
     *
     */
    @ManyToOne(optional = false)
    @JsonBackReference("inbox-message")
    private EventInboxInstance eventInboxInstance;

    /**
     *
     */
    public Event() {
        // useless but ensure there is an empty constructor
    }

    /**
     * @param payload
     * @param simulationTime
     */
    public Event(String payload, Date simulationTime) {
        this.simulationTime = simulationTime;
        this.payload = payload;
    }

    @Override
    @JsonIgnore
    public Date getCreatedTime() {
        return this.getTime();
    }

    /**
     * Get event payload
     *
     * @return the body
     */
    public String getPayload() {
        return payload;
    }

    /**
     * @param payload the body to set
     */
    public void setPayload(String payload) {
        this.payload = payload;
    }

    @Override
    public Long getId() {
        return this.id;
    }

    /**
     * @return the MCQDescriptor
     */
    @JsonIgnore
    public EventInboxInstance getEventInboxInstance() {
        return eventInboxInstance;
    }

    /**
     * @param eventInboxInstance
     */
    public void setEventInboxInstance(EventInboxInstance eventInboxInstance) {
        this.eventInboxInstance = eventInboxInstance;
    }

    /**
     * return the timestamp
     *
     * @return message sent timeStamp
     */
    public Date getDate() {
        return simulationTime;
    }

    /**
     * set the timestamp
     *
     * @param simulationTime
     */
    public void setDate(Date simulationTime) {
        this.simulationTime = simulationTime;
    }

    /**
     * @return the startTime
     */
    public Date getTime() {
        return (Date) timeStamp.clone();
    }

    /**
     * @param time
     */
    public void setTime(Date time) {
        this.timeStamp.setTime(time.getTime());
    }


    @Override
    public WithPermission getMergeableParent() {
        return this.getEventInboxInstance();
    }

    @Override
    public Collection<WegasPermission> getRequieredUpdatePermission(RequestContext context) {
        return this.getEventInboxInstance().getRequieredUpdatePermission(context);
    }

    @Override
    public Collection<WegasPermission> getRequieredReadPermission(RequestContext context) {
        return this.getEventInboxInstance().getRequieredReadPermission(context);
    }
}
