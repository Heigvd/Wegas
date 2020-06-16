/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2020 School of Business and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.messaging.persistence;

import ch.albasim.wegas.annotations.View;
import ch.albasim.wegas.annotations.WegasEntityProperty;
import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonView;
import com.fasterxml.jackson.databind.annotation.JsonDeserialize;
import com.wegas.core.i18n.persistence.TranslatableContent;
import com.wegas.core.persistence.AbstractEntity;
import com.wegas.core.persistence.DatedEntity;
import com.wegas.core.persistence.WithPermission;
import com.wegas.core.rest.util.Views;
import com.wegas.core.security.util.WegasPermission;
import com.wegas.editor.ValueGenerators.EmptyArray;
import com.wegas.editor.ValueGenerators.EmptyI18n;
import com.wegas.editor.ValueGenerators.EmptyString;
import com.wegas.editor.ValueGenerators.True;
import com.wegas.editor.view.I18nHtmlView;
import com.wegas.editor.view.I18nStringView;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Date;
import java.util.List;
import javax.persistence.CascadeType;
import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.FetchType;
import javax.persistence.GeneratedValue;
import javax.persistence.GenerationType;
import javax.persistence.Id;
import javax.persistence.Index;
import javax.persistence.ManyToOne;
import javax.persistence.OneToMany;
import javax.persistence.OneToOne;
import javax.persistence.Table;
import javax.persistence.Temporal;
import javax.persistence.TemporalType;

/**
 *
 * @author Francois-Xavier Aeberhard (fx at red-agent.com)
 */
@Entity
@Table(indexes = {
    @Index(columnList = "inboxinstance_id"),
    @Index(columnList = "subject_id"),
    @Index(columnList = "from_id"),
    @Index(columnList = "date_id"),
    @Index(columnList = "body_id")
})
public class Message extends AbstractEntity implements DatedEntity {

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
    @OneToOne(cascade = CascadeType.ALL, orphanRemoval = true)
    @WegasEntityProperty(
            optional = false, nullable = false, proposal = EmptyI18n.class,
            view = @View(label = "Subject", value = I18nStringView.class))
    private TranslatableContent subject;

    /**
     * Kind of message identifier
     */
    @Column(length = 64, columnDefinition = "character varying(64) default ''::character varying")
    @WegasEntityProperty(
            optional = false, nullable = false, proposal = EmptyString.class,
            view = @View(label = "Token"))
    private String token;

    /**
     * Message body
     */
    @OneToOne(cascade = CascadeType.ALL, orphanRemoval = true)
    @WegasEntityProperty(
            optional = false, nullable = false, proposal = EmptyI18n.class,
            view = @View(label = "Body", value = I18nHtmlView.class))
    private TranslatableContent body;

    /**
     * real world time for sorting purpose
     */
    @Temporal(TemporalType.TIMESTAMP)
    @Column(name = "senttime", columnDefinition = "timestamp with time zone")
    @WegasEntityProperty(nullable = false, view = @View(label = "Timestamp"))
    private Date time = new Date();

    /**
     * Simulation date, for display purpose
     */
    @OneToOne(cascade = CascadeType.ALL, orphanRemoval = true)
    @WegasEntityProperty(
            optional = false, nullable = false, proposal = EmptyI18n.class,
            view = @View(label = "Date", value = I18nStringView.class))
    private TranslatableContent date;
    /**
     *
     */
    @WegasEntityProperty(
            optional = false, nullable = false, proposal = True.class,
            view = @View(label = "Unread"))
    private Boolean unread = true;
    /**
     *
     */
    @OneToOne(cascade = CascadeType.ALL, orphanRemoval = true)
    @WegasEntityProperty(
            optional = false, nullable = false, proposal = EmptyI18n.class,
            view = @View(label = "From", value = I18nStringView.class))
    private TranslatableContent from;
    /**
     *
     */
    @OneToMany(mappedBy = "message", cascade = {CascadeType.ALL}, fetch = FetchType.LAZY, orphanRemoval = true)
    @JsonDeserialize(using = Attachment.ListDeserializer.class)
    //@JsonView(Views.ExtendedI.class)
    @WegasEntityProperty(
            optional = false, nullable = false, proposal = EmptyArray.class,
            view = @View(label = "Attachements"))
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
        // useless but ensure there is an empty constructor
    }

    /*
     *
     * @param from
     * @param subject
     * @param body
    public Message(String from, String subject, String body) {
        this(from, subject, body, null, null, null);
    }*/

 /*
     *
     * @param from
     * @param subject
     * @param body
     * @param attachments
     *
    public Message(String from, String subject, String body, List<String> attachments) {
        this(from, subject, body, null, null, attachments);
    }*/

 /*
     *
     * @param from
     * @param subject
     * @param body
     * @param date
     *
    public Message(String from, String subject, String body, String date) {
        this(from, subject, body, date, null, null);
    }*/

 /*
     *
     * @param from
     * @param subject
     * @param body
     * @param date
     * @param attachments
     *
    public Message(String from, String subject, String body, String date, List<String> attachments) {
        this(from, subject, body, date, null, attachments);
    }*/
    /**
     *
     * @param from
     * @param subject
     * @param body
     * @param date
     * @param token
     * @param attachments
     * @param lang
     */
    public Message(String from, String subject, String body, String date, String token, List<String> attachments, String lang) {
        this.from = TranslatableContent.build(lang, from);
        this.subject = TranslatableContent.build(lang, subject);
        this.date = TranslatableContent.build(lang, date);
        this.body = TranslatableContent.build(lang, body);
        this.token = token;
        if (attachments != null) {
            for (String strA : attachments) {
                Attachment a = new Attachment();
                a.setFile(TranslatableContent.build(lang, strA));
                a.setMessage(this);
                this.attachments.add(a);
            }
        }
    }

    @Override
    @JsonIgnore
    public Date getCreatedTime() {
        return this.getTime();
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
        if (this.inboxInstance != null) {
            this.getFrom().setParentInstance(this.inboxInstance);
            this.getSubject().setParentInstance(this.inboxInstance);
            this.getBody().setParentInstance(this.inboxInstance);
            this.getDate().setParentInstance(this.inboxInstance);
            if (this.getAttachments() != null) {
                for (Attachment a : this.getAttachments()) {
                    a.setMessage(this);
                    a.getFile().setParentInstance(this.inboxInstance);
                }
            }
        }
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
        return (Date) time.clone();
    }

    /**
     * @param time
     */
    public void setTime(Date time) {
        this.time.setTime(time.getTime());
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
    public WithPermission getMergeableParent() {
        return this.getInboxInstance();
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
