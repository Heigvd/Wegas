/*
 * Wegas
 * http://www.albasim.ch/wegas/
 *
 * Copyright (c) 2013 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.messaging.persistence;

import com.wegas.core.persistence.AbstractEntity;
import com.wegas.core.persistence.NamedEntity;
import com.wegas.core.rest.util.Views;
import java.util.Date;
import java.util.List;
import java.util.Objects;
import javax.naming.NamingException;
import javax.persistence.*;
import javax.xml.bind.annotation.XmlTransient;
import javax.xml.bind.annotation.XmlType;
import org.codehaus.jackson.annotate.JsonBackReference;
import org.codehaus.jackson.map.annotate.JsonView;

/**
 *
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
@Entity
@XmlType(name = "Message")
public class Message extends NamedEntity {

    private static final long serialVersionUID = 1L;
    /**
     *
     */
    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "mcqvarinstrep_seq")
    private Long id;
    /**
     *
     */
    private String subject;
    /**
     *
     */
    @JsonView(Views.Export.class)
    @Lob
    private String body;
    /**
     *
     */
    @Temporal(TemporalType.TIMESTAMP)
    private Date sentTime = new Date();
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
    @JsonView(Views.Export.class)
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
     * @param a
     */
    @Override
    public void merge(AbstractEntity a) {
        super.merge(a);
        Message other = (Message) a;
        this.setBody(other.getBody());
        this.setUnread(other.getUnread());
        this.setTime(other.getTime());
        this.setSubject(other.getSubject());
        this.setAttachements(other.attachements);
    }

    /**
     *
     * @throws NamingException
     */
    @PostPersist
    @PostUpdate
    @PostRemove
    public void onUpdate() {
        this.getInboxInstance().onInstanceUpdate();
    }

    @Override
    public boolean equals(Object o) {
        if (o instanceof Message) {
            Message vd = (Message) o;

            if (vd.getId() == null || this.getId() == null) {
                return false;
            } else {
                return this.getId().equals(vd.getId());
            }
        } else {
            return false;
        }
    }

    @Override
    public int hashCode() {
        int hash = 7;
        hash = 53 * hash + Objects.hashCode(this.id);
        hash = 53 * hash + Objects.hashCode(this.subject);
        hash = 53 * hash + Objects.hashCode(this.sentTime);
        hash = 53 * hash + Objects.hashCode(this.unread);
        hash = 53 * hash + Objects.hashCode(this.from);
        return hash;
    }

    /**
     *
     * @return
     */
    public String getSubject() {
        return this.subject;
    }

    /**
     *
     * @param subject
     */
    public void setSubject(String subject) {
        this.subject = subject;
    }

    /**
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
    @XmlTransient
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
     * @return the MCQDescriptor
     */
    @XmlTransient
    public InboxInstance getInboxInstance() {
        return inboxInstance;
    }

    /**
     * @param mailboxInstanceEntity
     */
    public void setInboxInstance(InboxInstance inboxInstance) {
        this.inboxInstance = inboxInstance;
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
}
