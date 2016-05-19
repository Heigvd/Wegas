/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013, 2014, 2015 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.messaging.ejb;

import com.wegas.core.persistence.game.Player;
import com.wegas.messaging.persistence.Message;
import java.util.List;
import javax.ejb.LocalBean;
import javax.ejb.Stateless;
import javax.enterprise.event.Event;
import javax.inject.Inject;

/**
 *
 * @deprecated  ??? 
 * @author Francois-Xavier Aeberhard (fx at red-agent.com)
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

    /**
     *
     * @param type
     * @param p
     * @param from
     * @param subject
     * @param body
     * @param attachements
     */
    public void send(String type, Player p, String from, String subject, String body, List<String> attachements) {
        Message msg = new Message();
        msg.setFrom(from);
        msg.setSubject(subject);
        msg.setBody(body);
        msg.setAttachements(attachements);
        this.send(type, p, msg);
    }
}
