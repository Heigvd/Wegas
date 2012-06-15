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

import com.wegas.core.persistence.game.Player;
import com.wegas.messaging.persistence.variable.Message;
import javax.ejb.LocalBean;
import javax.ejb.Stateless;
import javax.enterprise.event.Event;
import javax.inject.Inject;

/**
 *
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
@Stateless
@LocalBean
public class MessagingFacade {

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
    public void send(String type, Player p, Message msg) {
        MessageEvent evt = new MessageEvent();
        evt.setMessage(msg);
        evt.setPlayer(p);
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
    public void send(String type, Player p, String from, String subject, String body) {
        Message msg = new Message();
        msg.setFrom(from);
        msg.setSubject(subject);
        msg.setBody(body);
        this.send(type, p, msg);
    }
}
