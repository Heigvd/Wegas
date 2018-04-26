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
import com.fasterxml.jackson.databind.annotation.JsonDeserialize;
import com.wegas.core.exception.client.WegasIncompatibleType;
import com.wegas.core.i18n.persistence.TranslatableContent;
import com.wegas.core.i18n.persistence.TranslationDeserializer;
import com.wegas.core.persistence.AbstractEntity;
import com.wegas.core.persistence.DatedEntity;
import com.wegas.core.persistence.ListUtils;
import com.wegas.core.persistence.variable.Searchable;
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
    @Index(columnList = "inboxinstance_id"),
    @Index(columnList = "subject_id"),
    @Index(columnList = "from_id"),
    @Index(columnList = "date_id"),
    @Index(columnList = "body_id")
})
public class Message extends AbstractEntity implements DatedEntity, Searchable {

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
    @OneToOne(cascade = CascadeType.ALL)
    @JsonDeserialize(using = TranslationDeserializer.class)
    private TranslatableContent subject;
    /**
     * Kind of message identifier
     */
    @Column(length = 64, columnDefinition = "character varying(64) default ''::character varying")
    private String token;

    /**
     * Message body
     */
    @OneToOne(cascade = CascadeType.ALL)
    @JsonDeserialize(using = TranslationDeserializer.class)
    private TranslatableContent body;
    /**
     * real world time for sorting purpose
     */
    @Temporal(TemporalType.TIMESTAMP)
    @Column(columnDefinition = "timestamp with time zone")
    private Date sentTime = new Date();

    /**
     * Simulation date, for display purpose
     */
    @OneToOne(cascade = CascadeType.ALL)
    @JsonDeserialize(using = TranslationDeserializer.class)
    private TranslatableContent date;
    /**
     *
     */
    private Boolean unread = true;
    /**
     *
     */
    @OneToOne(cascade = CascadeType.ALL)
    @JsonDeserialize(using = TranslationDeserializer.class)
    private TranslatableContent from;
    /**
     *
     */
    @OneToMany(mappedBy = "message", cascade = {CascadeType.ALL}, fetch = FetchType.LAZY)
    @JsonDeserialize(using = Attachment.ListDeserializer.class)
    @JsonView(Views.ExtendedI.class)
    private List<Attachment> attachments = new ArrayList<>();
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
        this(from, subject, body, null, null, null);
    }

    /**
     *
     * @param from
     * @param subject
     * @param body
     * @param attachments
     */
    public Message(String from, String subject, String body, List<String> attachments) {
        this(from, subject, body, null, null, attachments);
    }

    /**
     *
     * @param from
     * @param subject
     * @param body
     * @param date
     */
    public Message(String from, String subject, String body, String date) {
        this(from, subject, body, date, null, null);
    }

    /**
     *
     * @param from
     * @param subject
     * @param body
     * @param date
     * @param attachments
     */
    public Message(String from, String subject, String body, String date, List<String> attachments) {
        this(from, subject, body, date, null, attachments);
    }

    /**
     *
     * @param from
     * @param subject
     * @param body
     * @param date
     * @param token
     * @param attachments
     */
    public Message(String from, String subject, String body, String date, String token, List<String> attachments) {
        this.from = TranslatableContent.build("def", from);
        this.subject = TranslatableContent.build("def", subject);
        this.date = TranslatableContent.build("def", date);
        this.body = TranslatableContent.build("def", body);
        this.token = token;
        if (attachments != null) {
            for (String strA : attachments) {
                Attachment a = new Attachment();
                a.setFile(TranslatableContent.build("def", strA));
                this.attachments.add(a);
            }
        }
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
            Message other = (Message) a;
            this.setBody(TranslatableContent.merger(this.getBody(), other.getBody()));
            this.setFrom(TranslatableContent.merger(this.getFrom(), other.getFrom()));
            this.setSubject(TranslatableContent.merger(this.getSubject(), other.getSubject()));
            this.setDate(TranslatableContent.merger(this.getDate(), other.getDate()));

            this.setAttachments(ListUtils.mergeLists(this.getAttachments(), other.getAttachments()));

            this.setUnread(other.getUnread());
            this.setTime(other.getTime());
            this.setToken(other.getToken());
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
    public TranslatableContent getSubject() {
        return this.subject;
    }

    /**
     * Update the message subject
     *
     * @param subject new subject
     */
    public void setSubject(TranslatableContent subject) {
        this.subject = subject;
        if (this.subject != null && this.getInboxInstance() != null) {
            this.subject.setParentInstance(this.getInboxInstance());
        }
    }

    /**
     * Get message body
     *
     * @return the body
     */
    public TranslatableContent getBody() {
        return body;
    }

    /**
     * @param body the body to set
     */
    public void setBody(TranslatableContent body) {
        this.body = body;
        if (this.body != null && this.getInboxInstance() != null) {
            this.body.setParentInstance(this.getInboxInstance());
        }
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
    public TranslatableContent getDate() {
        return date;
    }

    /**
     * set the date
     *
     * @param date
     */
    public void setDate(TranslatableContent date) {
        this.date = date;
        if (this.date != null && this.getInboxInstance() != null) {
            this.date.setParentInstance(this.getInboxInstance());
        }
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
    public TranslatableContent getFrom() {
        return from;
    }

    /**
     * @param from the from to set
     */
    public void setFrom(TranslatableContent from) {
        this.from = from;

        if (this.from != null && this.getInboxInstance() != null) {
            this.from.setParentInstance(this.getInboxInstance());
        }
    }

    /**
     * @return the attachments
     */
    public List<Attachment> getAttachments() {
        return attachments;
    }

    /**
     * @param attachments the attachments to set
     */
    public void setAttachments(List<Attachment> attachments) {
        this.attachments = attachments;
        if (this.attachments != null) {
            for (Attachment a : this.attachments) {
                a.setMessage(this);
            }
        }
    }

    @Override
    public Collection<WegasPermission> getRequieredUpdatePermission() {
        return this.getInboxInstance().getRequieredUpdatePermission();
    }

    @Override
    public Collection<WegasPermission> getRequieredReadPermission() {
        return this.getInboxInstance().getRequieredReadPermission();
    }

    @Override
    public Boolean containsAll(List<String> criterias) {
        if (this.getBody().containsAll(criterias)
                || this.getFrom().containsAll(criterias)
                || this.getSubject().containsAll(criterias)
                || this.getDate().containsAll(criterias)) {
            return true;
        }
        if (this.attachments != null) {
            for (Attachment a : this.attachments) {
                if (a.containsAll(criterias)) {
                    return true;
                }
            }
        }
        return false;
    }
}
