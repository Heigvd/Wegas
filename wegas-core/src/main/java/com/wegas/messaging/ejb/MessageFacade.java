/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.messaging.ejb;

import com.wegas.core.ejb.BaseFacade;
import com.wegas.messaging.persistence.Message;
import jakarta.ejb.LocalBean;
import jakarta.ejb.Stateless;

/**
 * @author Francois-Xavier Aeberhard (fx at red-agent.com)
 */
@Stateless
@LocalBean
public class MessageFacade extends BaseFacade<Message> {


    /**
     *
     */
    public MessageFacade() {
        super(Message.class);
    }

    @Override
    public void create(Message entity) {
        getEntityManager().persist(entity);
        entity.getInboxInstance().addMessage(entity);
    }

    @Override
    public void remove(Message entity) {
        this.removeAbstractEntity(entity);
        entity.getInboxInstance().getMessages().remove(entity);
    }
}
