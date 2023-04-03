/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.core.persistence.variable.events;

import ch.albasim.wegas.annotations.CommonView;
import ch.albasim.wegas.annotations.View;
import ch.albasim.wegas.annotations.WegasEntityProperty;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonManagedReference;
import com.wegas.core.Helper;
import com.wegas.core.persistence.AbstractEntity;
import com.wegas.core.persistence.EntityComparators;
import com.wegas.core.persistence.variable.VariableInstance;
import com.wegas.editor.ValueGenerators.EmptyArray;
import java.util.ArrayList;
import java.util.List;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Entity;
import jakarta.persistence.OneToMany;
import java.util.Map;
import org.slf4j.LoggerFactory;

/**
 * @author Francois-Xavier Aeberhard (fx at red-agent.com)
 */
@Entity
public class EventInboxInstance extends VariableInstance {


    public EventInboxInstance(){
        super();
    }

    /**
     * Clone without event list
     * @param orig
     */
    private EventInboxInstance(EventInboxInstance orig){
        super();
        this.lastEvent = orig.lastEvent;
    }

    /**
     *
     */
    protected static final org.slf4j.Logger loggerbeans = LoggerFactory.getLogger(EventInboxInstance.class);

    private static final long serialVersionUID = 1L;

    /**
     *
     */
    @OneToMany(mappedBy = "eventInboxInstance", cascade = {CascadeType.ALL}, orphanRemoval = true)
    //    @OrderBy("sentTime DESC, id")
    /*
     Quote from GF4 development guide:

     *Using @OrderBy with a Shared Session Cache
     *  Setting @OrderBy on a ManyToMany or OneToMany relationship field in which a List
     *  represents the Many side doesn't work if the session cache is shared. Use one of the
     *  following workarounds:
     *          ■ Have the application maintain the order so the List is cached properly.
     *          ■ Refresh the session cache using EntityManager.refresh() if you don't want to
     *  maintain the order during creation or modification of the List.
     *          ■ Disable session cache sharing in persistence.xml as follows:
     *  <property name="eclipselink.cache.shared.default" value="false"/>

     */
    @JsonManagedReference("event-inbox-message")
    @WegasEntityProperty(
        optional = false, nullable = false, proposal = EmptyArray.class,
        view = @View(
            label = "Events",
            featureLevel = CommonView.FEATURE_LEVEL.ADVANCED
        ))
    private List<Event> events = new ArrayList<>();

    private Event lastEvent;

    /**
     * @return the events
     */
    public List<Event> getEvents() {
        return events;
    }

    /**
     * @return unmodifiable events list, sorted by date (newer first)
     */
    @JsonIgnore
    public List<Event> getSortedEvents() {
        return Helper.copyAndSort(this.events, new EntityComparators.ReverseCreateTimeComparator<>());
    }

    /**
     * @param events
     */
    public void setEvents(List<Event> events) {
        this.events = events;
        this.events.forEach(m -> {
            m.setEventInboxInstance(this);
        });
    }

    /**
     * @param event
     */
    public void addEvent(Event event) {
        // link the event to its inbox instance
        event.setEventInboxInstance(this);
        this.lastEvent = event;
        this.events.add(0, event);
    }

    /**
     * @param event
     *
     * @return the event itself
     */
    public Event sendEvent(Event event) {
        this.addEvent(event);
        return event;
    }

    public Event sendEvent(final String payload) {
        return this.sendEvent(new Event(payload, this.lastEvent));
    }

    /**
     * @return a copy of this event inbox without events
     */
    @Override
    public Map<String, List<AbstractEntity>> getEntities(){
        var emptyCopy = new EventInboxInstance(this);
        return internalGetEntities(emptyCopy);
    }

    @Override
    public String toString() {
        return this.getClass().getSimpleName() + "( " + getId() + ", events: " + this.getEvents().size() + " )";
    }
}
