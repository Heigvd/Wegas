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
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonView;
import com.wegas.core.ejb.RequestManager.RequestContext;
import com.wegas.core.persistence.AbstractEntity;
import com.wegas.core.persistence.Broadcastable;
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
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.Lob;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import jakarta.persistence.Temporal;
import jakarta.persistence.TemporalType;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;


@Entity
@Table(indexes = {
    @Index(columnList = "eventinboxinstance_id"),
    @Index(columnList = "payload_id"),
    @Index(columnList = "time_id"),
    @Index(columnList = "sim_time_id")
})
public class Event extends AbstractEntity implements DatedEntity, Broadcastable {

    private static final long serialVersionUID = 1L;
    /**
     *
     */
    @Id
    @GeneratedValue
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


    @OneToOne()
    private Event previousEvent;

    /**
     *
     */
    @ManyToOne(optional = false)
    private EventInboxInstance eventInboxInstance;

    /**
     *
     */
    public Event() {
        // useless but ensure there is an empty constructor
    }

    /**
     * @param payload
     * @param previousEvent
     */
    public Event(String payload, Event previousEvent) {
        this.payload = payload;
        this.previousEvent = previousEvent;
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
     * @return the referenced inbox instance
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
     * @return the startTime
     */
    public Date getTimeStamp() {
        return (Date) timeStamp.clone();
    }

    /**
     * @param time
     */
    public void setTimeStamp(Date time) {
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

    @Override
    public Date getCreatedTime() {
        return this.getTimeStamp();
    }

    @Override
    public Map<String, List<AbstractEntity>> getEntities() {
        String audience = this.eventInboxInstance.getAudience();
        if (audience != null) {
            Map<String, List<AbstractEntity>> map = new HashMap<>();
            List<AbstractEntity> entities = Arrays.asList(this);
            map.put(audience, entities);
            return map;
        }
        return null;
    }
}
