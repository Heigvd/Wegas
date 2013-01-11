/*
 * Wegas.
 * http://www.albasim.com/wegas/
 *
 * School of Business and Engineering Vaud, http://www.heig-vd.ch/
 * Media Engineering :: Information Technology Managment :: Comem
 *
 * Copyright (C) 2012
 */
package com.wegas.messaging.persistence;

import com.wegas.core.persistence.AbstractEntity;
import com.wegas.core.persistence.variable.VariableInstance;
import java.util.ArrayList;
import java.util.Iterator;
import java.util.List;
import java.util.logging.Logger;
import javax.persistence.CascadeType;
import javax.persistence.Entity;
import javax.persistence.JoinColumn;
import javax.persistence.OneToMany;
import javax.persistence.OrderBy;
import javax.xml.bind.annotation.XmlType;
import org.codehaus.jackson.annotate.JsonManagedReference;

/**
 *
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
@Entity
@XmlType(name = "InboxInstance")
public class InboxInstance extends VariableInstance {

    private static final long serialVersionUID = 1L;
    private static final Logger logger = Logger.getLogger("InboxInstanceEntity");
    /**
     *
     */
    @OneToMany(mappedBy = "inboxInstanceEntity", cascade = {CascadeType.ALL}, orphanRemoval = true)
    @JoinColumn(name = "variableinstance_id")
    @OrderBy("sentTime")
    @JsonManagedReference("inbox-message")
    private List<Message> messages = new ArrayList<Message>();

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
            r.setInboxInstanceEntity(this);
        }
    }

    /**
     *
     * @param message
     */
    public void sendMessage(Message message) {
        this.messages.add(message);
        message.setInboxInstanceEntity(this);
    }

    /**
     *
     * @param message
     */
    public void sendMessage(String from, String subject, String body) {
        this.sendMessage(new Message(from, subject, body));
    }
    /**
     *
     * @param message
     */
    public void sendMessage(String from, String subject, String body, List<String> attachements) {
        this.sendMessage(new Message(from, subject, body, attachements));
    }

    @Override
    public void merge(AbstractEntity a) {
        InboxInstance other = (InboxInstance) a;
        this.setMessages(other.getMessages());
    }
}