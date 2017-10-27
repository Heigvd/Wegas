/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2017 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.messaging.ejb;

import com.wegas.core.ejb.BaseFacade;
import com.wegas.core.ejb.PlayerFacade;
import com.wegas.core.ejb.VariableDescriptorFacade;
import com.wegas.core.exception.client.WegasErrorMessage;
import com.wegas.core.exception.internal.WegasNoResultException;
import com.wegas.core.persistence.game.Player;
import com.wegas.core.persistence.variable.VariableDescriptor;
import com.wegas.messaging.persistence.InboxInstance;
import com.wegas.messaging.persistence.Message;
import java.util.List;
import javax.ejb.EJB;
import javax.ejb.LocalBean;
import javax.ejb.Stateless;
import javax.enterprise.event.Observes;
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
    @EJB
    private VariableDescriptorFacade variableDescriptorFacade;

    @EJB
    private PlayerFacade playerFacade;

    /**
     *
     */
    public MessageFacade() {
        super(Message.class);
    }

    /**
     * @param messageEvent
     */
    public void listener(@Observes MessageEvent messageEvent) {
        logger.info("Message received for player {}.", messageEvent.getPlayer());
        this.send(messageEvent.getPlayer(), messageEvent.getMessage());
    }

    /**
     * @param p
     * @param msg
     */
    public void send(Player p, Message msg) {
        p = playerFacade.find(p.getId());
        try {


            //BURNTHATSHIT ASAP
            VariableDescriptor vd = variableDescriptorFacade.find(p.getGameModel(), "inbox");     // @WTF ???
            InboxInstance inbox = (InboxInstance) vd.getInstance(p);
            inbox.sendMessage(msg);
        } catch (WegasNoResultException ex) {
            throw WegasErrorMessage.error(ex.getMessage());
        }
    }

    /**
     * {@inheritDoc}
     */
    public Message send(Player p, String subject, String body, String from) {
        Message msg = new Message();
        msg.setSubject(subject);
        msg.setBody(body);
        msg.setFrom(from);
        this.send(p, msg);
        return msg;
    }

    /**
     * @param p
     * @param subject
     * @param body
     * @param from
     * @param attachements
     * @return sent message
     *
     */
    public Message send(Player p, String subject, String body, String from, List<String> attachements) {
        Message msg = new Message();
        msg.setSubject(subject);
        msg.setBody(body);
        msg.setFrom(from);
        msg.setAttachements(attachements);
        this.send(p, msg);
        return msg;
    }

    @Override
    public void create(Message entity) {
        getEntityManager().persist(entity);
        entity.getInboxInstance().addMessage(entity);
    }

    @Override
    public void remove(Message entity) {
        getEntityManager().remove(entity);
        entity.getInboxInstance().getMessages().remove(entity);
    }
}
