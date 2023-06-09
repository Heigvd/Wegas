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
import ch.albasim.wegas.annotations.WegasExtraProperty;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonManagedReference;
import com.fasterxml.jackson.annotation.JsonView;
import com.wegas.core.Helper;
import com.wegas.core.persistence.EntityComparators;
import com.wegas.core.persistence.variable.VariableInstance;
import com.wegas.core.rest.util.Views;
import com.wegas.editor.ValueGenerators.EmptyArray;
import com.wegas.editor.view.Hidden;
import java.util.ArrayList;
import java.util.List;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Entity;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Transient;
import org.slf4j.LoggerFactory;

/**
 * @author Francois-Xavier Aeberhard (fx at red-agent.com)
 */
@Entity
public class EventInboxInstance extends VariableInstance {

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
    /**
     * Serialize only when exporting scenario (wgz or zip)
     */
    @JsonManagedReference("event-inbox-message")
    @JsonView(Views.ExportI.class)
    @WegasEntityProperty(
        optional = false, nullable = false, proposal = EmptyArray.class,
        view = @View(
            label = "Events",
            featureLevel = CommonView.FEATURE_LEVEL.ADVANCED
        ))
    private List<Event> events = new ArrayList<>();

    @JsonIgnore
    private Event lastEvent;

    /**
     * Used during deserialization (e.g. of wgz scenario)
     */
    @Transient
    @JsonView(Views.ExportI.class)
    @WegasEntityProperty(view = @View(value = Hidden.class, label= ""))
    private String lastEventRefId;


    @JsonView(Views.IndexI.class)
    @WegasExtraProperty(view = @View(label = "Last Event Id", featureLevel = CommonView.FEATURE_LEVEL.ADVANCED, readOnly = true))
    public Long getLastEventId(){
        if(this.lastEvent != null){
            return this.lastEvent.getId();
        }
        return null;
    }

    public void setLastEventId(Long id){
        // ignored, but required by jackson
    }

    @JsonIgnore
    public String getDeserializedLastEventRefId(){
        return lastEventRefId;
    }

    public String getLastEventRefId() {
        if(lastEvent != null){
            // during serialization
            return lastEvent.getRefId();
        }else {
            // during deserialization
            return lastEventRefId;
        }
    }

    public void setLastEventRefId(String lastEventRefId) {
        this.lastEventRefId = lastEventRefId;
    }

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
        event.setPreviousEvent(this.lastEvent);
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
     * Chains the event list
     * Used only when a scenario gets deserialized,
     * uses the refIds to link the newly created events with their real db id
     */
    public void rebuildEventChaining(){

        for(int i = 0; i < events.size(); i++) {
            var e = events.get(i);
            var previous = findByRefId(e.getDeserializedPreviousEventRefId());
            if(previous != null){
                e.setPreviousEvent(previous);
            }
        }

       this.lastEvent = findByRefId(getDeserializedLastEventRefId());
    }


    public Event findByRefId(String refId){
        if(refId == null){
            return null;
        }
        return events.stream().filter((evt) -> refId.equals(evt.getRefId())).findFirst().orElse(null);
    }

    @Override
    public String toString() {
        return this.getClass().getSimpleName() + "( " + getId() + ", events: " + this.getEvents().size() + " )";
    }
}
