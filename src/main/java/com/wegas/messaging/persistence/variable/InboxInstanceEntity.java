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
import com.wegas.core.persistence.variable.VariableInstanceEntity;
import java.util.ArrayList;
import java.util.Iterator;
import java.util.List;
import java.util.logging.Logger;
import javax.persistence.CascadeType;
import javax.persistence.Entity;
import javax.persistence.JoinColumn;
import javax.persistence.OneToMany;
import javax.xml.bind.annotation.XmlType;
import org.codehaus.jackson.annotate.JsonManagedReference;

/**
 *
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
@Entity
@XmlType(name = "InboxInstance")
public class InboxInstanceEntity extends VariableInstanceEntity {

    private static final long serialVersionUID = 1L;
    private static final Logger logger = Logger.getLogger("InboxInstanceEntity");
    /**
     *
     */
    @OneToMany(mappedBy = "inboxInstanceEntity", cascade = {CascadeType.ALL}, orphanRemoval = true)
    @JsonManagedReference("inbox-message")
    @JoinColumn(name = "variableinstance_id")
    private List<MessageEntity> messages = new ArrayList<>();

    /**
     * @return the replies
     */
    public List<MessageEntity> getMessages() {
        return messages;
    }

    /**
     * @param messages
     */
    public void setMessages(List<MessageEntity> messages) {
        this.messages = messages;
        for (Iterator<MessageEntity> it = this.messages.iterator(); it.hasNext();) {
            MessageEntity r = it.next();
            r.setMailboxInstanceEntity(this);
        }
    }

    /**
     *
     * @param message
     */
    public void addMessage(MessageEntity message) {
        this.messages.add(message);
        message.setMailboxInstanceEntity(this);
    }

    @Override
    public void merge(AbstractEntity a) {
        throw new UnsupportedOperationException("Not supported yet.");
    }

}