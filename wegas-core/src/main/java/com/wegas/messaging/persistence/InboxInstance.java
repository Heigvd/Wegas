/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.messaging.persistence;

import com.wegas.core.persistence.AbstractEntity;
import com.wegas.core.persistence.variable.VariableInstance;
import java.io.IOException;
import java.util.ArrayList;
import java.util.Iterator;
import java.util.List;
import javax.persistence.CascadeType;
import javax.persistence.Entity;
import javax.persistence.OneToMany;
import javax.persistence.OrderBy;
import javax.xml.bind.annotation.XmlType;
import org.codehaus.jackson.annotate.JsonManagedReference;
import org.slf4j.LoggerFactory;

/**
 *
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
@Entity
@XmlType(name = "InboxInstance")
public class InboxInstance extends VariableInstance {

    protected static final org.slf4j.Logger logger = LoggerFactory.getLogger(InboxInstance.class);
    private static final long serialVersionUID = 1L;
    /**
     *
     */
    @OneToMany(mappedBy = "inboxInstance", cascade = {CascadeType.ALL}, orphanRemoval = true)
    @OrderBy("sentTime, id")
    @JsonManagedReference("inbox-message")
    private List<Message> messages = new ArrayList<>();

    /**
     * @return the replies
     */
    public List<Message> getMessages() {
        return messages;
    }

    /**
     * @param messages
     */
    public void setMessages(List<Message> messages) {
        this.messages = messages;
        for (Iterator<Message> it = this.messages.iterator(); it.hasNext();) {
            Message r = it.next();
            r.setInboxInstance(this);
        }
    }

    /**
     *
     * @param message
     */
    public void addMessage(Message message) {
        this.messages.add(message);
        message.setInboxInstance(this);
    }

    @Override
    public void merge(AbstractEntity a) {
        InboxInstance other = (InboxInstance) a;
        this.messages.clear();
        for (Message m : other.getMessages()) {
            try {
                this.addMessage((Message) m.duplicate());
            } catch (IOException ex) {
                logger.error("Exception duplicating {}", m);
            }
        }
    }

    /**
     *
     * @param message
     */
    public void sendMessage(Message message) {
        this.addMessage(message);
    }

    /**
     *
     * @param from
     * @param subject
     * @param body
     */
    public void sendMessage(String from, String subject, String body) {
        this.sendMessage(new Message(from, subject, body));
    }

    /**
     *
     * @param from
     * @param subject
     * @param body
     * @param attachements
     */
    public void sendMessage(String from, String subject, String body, List<String> attachements) {
        this.sendMessage(new Message(from, subject, body, attachements));
    }

    @Override
    public String toString() {
        return this.getClass().getSimpleName() + "( " + getId() + ", msgs: " + this.getMessages().size() + " )";
    }
}