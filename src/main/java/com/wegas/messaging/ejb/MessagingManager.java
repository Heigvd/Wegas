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

import com.wegas.core.persistence.game.PlayerEntity;
import com.wegas.messaging.persistence.variable.MessageEntity;
import javax.ejb.Stateless;
import javax.enterprise.event.Event;
import javax.inject.Inject;

/**
 *
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
@Stateless
public class MessagingManager {

    /**
     *
     */
    @Inject
    Event<MessageEvent> messageEvent;

    /**
     *
     * @param type
     * @param p
     * @param msg
     */
    public void send(String type, PlayerEntity p, MessageEntity msg) {
        MessageEvent evt = new MessageEvent();
        evt.setMessage(msg);
        messageEvent.fire(evt);
    }

    /**
     *
     * @param type
     * @param p
     * @param from
     * @param subject
     * @param body
     */
    public void send(String type, PlayerEntity p, String from, String subject, String body) {
        MessageEntity msg = new MessageEntity();
        msg.setName(subject);
        msg.setBody(body);
        this.send(type, p, msg);
    }
}
