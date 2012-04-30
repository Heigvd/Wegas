/*
 * Wegas.
 * http://www.albasim.com/wegas/
 *
 * School of Business and Engineering Vaud, http://www.heig-vd.ch/
 * Media Engineering :: Information Technology Managment :: Comem
 *
 * Copyright (C) 2012
 */
package com.wegas.messaging.ejb;

import com.wegas.core.ejb.VariableDescriptorFacade;
import com.wegas.core.persistence.game.PlayerEntity;
import com.wegas.core.persistence.variable.VariableDescriptorEntity;
import com.wegas.messaging.persistence.variable.InboxInstanceEntity;
import com.wegas.messaging.persistence.variable.MessageEntity;
import javax.ejb.EJB;
import javax.ejb.Stateless;
import javax.enterprise.event.Observes;

/**
 *
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
@Stateless
public class InternalInboxManager {

    /**
     *
     */
    @EJB
    private VariableDescriptorFacade variableDescriptorFacade;

    /**
     *
     * @param messageEvent
     */
    public void listener(@Observes MessageEvent messageEvent) {
        System.out.println("Event received");
    }

    /**
     *
     * @param p
     * @param msg
     */
    public void send(PlayerEntity p, MessageEntity msg) {
        VariableDescriptorEntity vd = variableDescriptorFacade.findByName("inbox");
        InboxInstanceEntity inbox = (InboxInstanceEntity) vd.getVariableInstance(p);
        inbox.addMessage(msg);
    }

    /**
     *
     * @param p
     * @param subject
     * @param body
     */
    public void send(PlayerEntity p, String subject, String body) {
        MessageEntity msg = new MessageEntity();
        msg.setName(subject);
        msg.setBody(body);
        this.send(p, msg);
    }
}
