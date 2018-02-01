/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2018 School of Business and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.messaging.ejb;

import com.wegas.core.ejb.BaseFacade;
import com.wegas.messaging.persistence.Message;
import javax.ejb.LocalBean;
import javax.ejb.Stateless;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * @author Francois-Xavier Aeberhard (fx at red-agent.com)
 */
@Stateless
@LocalBean
public class MessageFacade extends BaseFacade<Message> {

    final static private Logger logger = LoggerFactory.getLogger(MessageFacade.class);

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
