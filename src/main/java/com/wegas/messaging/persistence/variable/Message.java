/*
 * Wegas.
 * http://www.albasim.com/wegas/
 *
 * School of Business and Engineering Vaud, http://www.heig-vd.ch/
 * Media Engineering :: Information Technology Managment :: Comem
 *
 * Copyright (C) 2012
 */
package com.wegas.messaging.persistence.variable;

import com.wegas.core.persistence.AbstractEntity;
import com.wegas.core.persistence.NamedEntity;
import java.util.Date;
import java.util.logging.Logger;
import javax.naming.NamingException;
import javax.persistence.*;
import javax.xml.bind.annotation.XmlTransient;
import javax.xml.bind.annotation.XmlType;
import org.codehaus.jackson.annotate.JsonBackReference;

/**
 *
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
@Entity
@XmlType(name = "MessageInstance")
public class Message extends NamedEntity {

    private static final long serialVersionUID = 1L;
    private static final Logger logger = Logger.getLogger("MCQReplyInstanceEntity");
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
    @Column(length = 4096)
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
    /*
     * @Column(name="wto") private InternetAddress to;
     */
    /**
     *
     */
    @JsonBackReference("inbox-message")
    @ManyToOne(optional = false)
    @JoinColumn(name = "variableinstance_id", nullable = false)
    private InboxInstance inboxInstanceEntity;

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
    }

    /**
     *
     * @throws NamingException
     */
    @PostPersist
    @PostUpdate
    @PostRemove
    private void onUpdate() {
        this.getMailboxInstanceEntity().onInstanceUpdate();
    }

    @Override
    public boolean equals(Object o) {
        Message vd = (Message) o;
        // @fixme is null variable returning false the right thing ?
        return vd.getId() == null || this.getId() == null || this.getId().equals(vd.getId());
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

    @Override
    public void setId(Long id) {
        this.id = id;
    }

    /**
     * @return the MCQDescriptor
     */
    @XmlTransient
    public InboxInstance getMailboxInstanceEntity() {
        return inboxInstanceEntity;
    }

    /**
     * @param mailboxInstanceEntity
     */
    public void setMailboxInstanceEntity(InboxInstance mailboxInstanceEntity) {
        this.inboxInstanceEntity = mailboxInstanceEntity;
    }

    /**
     * @return the startTime
     */
    public Date getTime() {
        return sentTime;
    }

    /**
     * @param time
     */
    public void setTime(Date time) {
        this.sentTime = time;
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
}
