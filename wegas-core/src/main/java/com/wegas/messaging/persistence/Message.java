/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2018 School of Business and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.messaging.persistence;

import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonTypeName;
import com.fasterxml.jackson.annotation.JsonView;
import com.wegas.core.exception.client.WegasIncompatibleType;
import com.wegas.core.persistence.AbstractEntity;
import com.wegas.core.persistence.DatedEntity;
import com.wegas.core.persistence.NamedEntity;
import com.wegas.core.rest.util.Views;
import com.wegas.core.security.util.WegasPermission;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Date;
import java.util.List;
import javax.persistence.*;

/**
 *
 * @author Francois-Xavier Aeberhard (fx at red-agent.com)
 */
@Entity
@JsonTypeName(value = "Message")

@Table(indexes = {
    @Index(columnList = "inboxinstance_id")
})

public class Message extends NamedEntity implements DatedEntity {

    private static final long serialVersionUID = 1L;
    /**
     *
     */
    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "mcqvarinstrep_seq")
    @JsonView(Views.IndexI.class)
    private Long id;
    /**
     *
     */
    private String subject;
    /**
     *
     */
    @Column(length = 64, columnDefinition = "character varying(64) default ''::character varying")
    private String token;

    @Lob
    @JsonView(Views.ExtendedI.class)
    @Basic(fetch = FetchType.EAGER) // CARE, lazy fetch on Basics has some trouble.
    private String body;
    /**
     * real world time for sorting purpose
     */
    @Temporal(TemporalType.TIMESTAMP)
    @Column(columnDefinition = "timestamp with time zone")
    private Date sentTime = new Date();

    /**
     * Simulation date, for display purpose
     */
    private String date;
    /**
     *
     */
    private Boolean unread = true;
    /**
     *
     */
    @Column(name = "mfrom")
    private String from;
    /**
     *
     */
    @ElementCollection
    @JsonView(Views.ExtendedI.class)
    private List<String> attachements;
    /**
     *
     */
    /*
     * @Column(name="wto") private InternetAddress to;
     */
    /**
     *
     */
    @ManyToOne(optional = false)
    @JsonBackReference("inbox-message")
    private InboxInstance inboxInstance;

    /**
     *
     */
    public Message() {
    }

    /**
     *
     * @param from
     * @param subject
     * @param body
     */
    public Message(String from, String subject, String body) {
        this.from = from;
        this.subject = subject;
        this.body = body;
    }

    /**
     *
     * @param from
     * @param subject
     * @param body
     * @param attachements
     */
    public Message(String from, String subject, String body, List<String> attachements) {
        this.from = from;
        this.subject = subject;
        this.body = body;
        this.attachements = attachements;
    }

    /**
     *
     * @param from
     * @param subject
     * @param body
     * @param date
     */
    public Message(String from, String subject, String body, String date) {
        this.from = from;
        this.subject = subject;
        this.body = body;
        this.date = date;
    }

    /**
     *
     * @param from
     * @param subject
     * @param body
     * @param date
     * @param attachements
     */
    public Message(String from, String subject, String body, String date, List<String> attachements) {
        this.from = from;
        this.subject = subject;
        this.body = body;
        this.date = date;
        this.attachements = attachements;
    }

    /**
     *
     * @param from
     * @param subject
     * @param body
     * @param date
     * @param token
     * @param attachements
     */
    public Message(String from, String subject, String body, String date, String token, List<String> attachements) {
        this.from = from;
        this.subject = subject;
        this.body = body;
        this.date = date;
        this.token = token;
        this.attachements = attachements;
    }

    @Override
    @JsonIgnore
    public Date getCreatedTime() {
        return this.getTime();
    }

    /**
     *
     * @param a
     */
    @Override
    public void merge(AbstractEntity a) {
        if (a instanceof Message) {
            super.merge(a);
            Message other = (Message) a;
            this.setBody(other.getBody());
            this.setFrom(other.getFrom());
            this.setUnread(other.getUnread());
            this.setTime(other.getTime());
            this.setDate(other.getDate());
            this.setSubject(other.getSubject());
            this.setToken(other.getToken());
            this.setAttachements(new ArrayList<>());
            this.getAttachements().addAll(other.getAttachements());
            //this.setAttachements(other.attachements);
        } else {
            throw new WegasIncompatibleType(this.getClass().getSimpleName() + ".merge (" + a.getClass().getSimpleName() + ") is not possible");
        }
    }


    /*@Override
    public Map<String, List<AbstractEntity>> getEntities() {
        return this.getInboxInstance().getEntities();
    }*/

    /**
     * Get the message subject
     *
     * @return the message subject
     */
    public String getSubject() {
        return this.subject;
    }

    /**
     * Update the message subject
     *
     * @param subject new subject
     */
    public void setSubject(String subject) {
        this.subject = subject;
    }

    /**
     * Get message body
     *
     * @return the body
     */
    public String getBody() {
        return body;
    }

    /**
     * @param body the body to set
     */
    public void setBody(String body) {
        this.body = body;
    }

    @Override
    @JsonIgnore
    public String getName() {
        return this.subject;
    }

    @Override
    public void setName(String name) {
        this.subject = name;
    }

    @Override
    public Long getId() {
        return this.id;
    }

    /**
     * get the token
     *
     * @return the message token (null if there is no token)
     */
    public String getToken() {
        return token;
    }

    /**
     * set the token
     *
     * @param token
     */
    public void setToken(String token) {
        this.token = token;
    }

    /**
     * @return the MCQDescriptor
     */
    @JsonIgnore
    public InboxInstance getInboxInstance() {
        return inboxInstance;
    }

    /**
     * @param inboxInstance
     */
    public void setInboxInstance(InboxInstance inboxInstance) {
        this.inboxInstance = inboxInstance;
    }

    /**
     * return the date
     *
     * @return message sent time
     */
    public String getDate() {
        return date;
    }

    /**
     * set the date
     *
     * @param date
     */
    public void setDate(String date) {
        this.date = date;
    }

    /**
     * @return the startTime
     */
    public Date getTime() {
        return (Date) sentTime.clone();
    }

    /**
     * @param time
     */
    public void setTime(Date time) {
        this.sentTime.setTime(time.getTime());
    }

    /**
     * @return the unread
     */
    public Boolean getUnread() {
        return unread;
    }

    /**
     * @param unread the unread to set
     */
    public void setUnread(Boolean unread) {
        this.unread = unread;
    }

    /**
     * @return the from
     */
    public String getFrom() {
        return from;
    }

    /**
     * @param from the from to set
     */
    public void setFrom(String from) {
        this.from = from;
    }

    /**
     * @return the attachements
     */
    public List<String> getAttachements() {
        return attachements;
    }

    /**
     * @param attachements the attachements to set
     */
    public void setAttachements(List<String> attachements) {
        this.attachements = attachements;
    }

    @Override
    public Collection<WegasPermission> getRequieredUpdatePermission() {
        return this.getInboxInstance().getRequieredUpdatePermission();
    }

    @Override
    public Collection<WegasPermission> getRequieredReadPermission() {
        return this.getInboxInstance().getRequieredReadPermission();
    }
}
