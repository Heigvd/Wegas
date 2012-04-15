/*
 * Wegas.
 * http://www.albasim.com/wegas/
 *
 * School of Business and Engineering Vaud, http://www.heig-vd.ch/
 * Media Engineering :: Information Technology Managment :: Comem
 *
 * Copyright (C) 2011
 */
package com.wegas.messaging.persistence.variable;

import com.wegas.core.persistence.AbstractEntity;
import com.wegas.core.persistence.game.NamedEntity;
import java.util.logging.Logger;
import javax.mail.internet.InternetAddress;
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
public class MessageEntity extends NamedEntity {

    private static final long serialVersionUID = 1L;
    private static final Logger logger = Logger.getLogger("MCQVariableInstanceReplyEntity");
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
    private Long sentTime;
    /**
     *
     */
    @Column(name = "wread")
    private Boolean read = false;
    /**
     *
     */
    /*
     * @Column(name="wfrom") private InternetAddress from;
     */
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
    private InboxInstanceEntity inboxInstanceEntity;

    /**
     *
     * @param a
     */
    @Override
    public void merge(AbstractEntity a) {
        super.merge(a);
        MessageEntity r = (MessageEntity) a;
        this.setBody(r.getBody());
    }

    @Override
    public boolean equals(Object o) {
        MessageEntity vd = (MessageEntity) o;
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
     * @return the mcqVariableDescriptor
     */
    @XmlTransient
    public InboxInstanceEntity getMailboxInstanceEntity() {
        return inboxInstanceEntity;
    }

    /**
     * @param mailboxInstanceEntity
     */
    public void setMailboxInstanceEntity(InboxInstanceEntity mailboxInstanceEntity) {
        this.inboxInstanceEntity = mailboxInstanceEntity;
    }

    /**
     * @return the startTime
     */
    public Long getTime() {
        return sentTime;
    }

    /**
     * @param time
     */
    public void setTime(Long time) {
        this.sentTime = time;
    }

    /**
     * @return the read
     */
    public Boolean getRead() {
        return read;
    }

    /**
     * @param read the read to set
     */
    public void setRead(Boolean read) {
        this.read = read;
    }
}
