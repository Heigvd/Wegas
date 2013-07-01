/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.messaging.ejb;

import com.wegas.core.ejb.AbstractFacadeImpl;
import com.wegas.core.ejb.RequestFacade;
import com.wegas.core.ejb.VariableDescriptorFacade;
import com.wegas.core.persistence.game.Player;
import com.wegas.core.persistence.variable.VariableDescriptor;
import com.wegas.messaging.persistence.InboxInstance;
import com.wegas.messaging.persistence.Message;
import java.util.List;
import javax.ejb.EJB;
import javax.ejb.LocalBean;
import javax.ejb.Stateless;
import javax.enterprise.event.Observes;
import javax.persistence.EntityManager;
import javax.persistence.PersistenceContext;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 *
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
@Stateless
@LocalBean
public class MessageFacade extends AbstractFacadeImpl<Message> {

    final static private Logger logger = LoggerFactory.getLogger(MessageFacade.class);
    /**
     *
     */
    @PersistenceContext(unitName = "wegasPU")
    private EntityManager em;
    /**
     *
     */
    @EJB
    private VariableDescriptorFacade variableDescriptorFacade;

    /**
     *
     */
    public MessageFacade() {
        super(Message.class);
    }

    /**
     *
     * @param messageEvent
     */
    public void listener(@Observes MessageEvent messageEvent) {
        logger.info("Message received for player {}.", messageEvent.getPlayer());
        this.send(messageEvent.getPlayer(), messageEvent.getMessage());
    }

    /**
     *
     * @param p
     * @param msg
     */
    public void send(Player p, Message msg) {
        VariableDescriptor vd = variableDescriptorFacade.find(p.getGameModel(), "inbox");
        InboxInstance inbox = (InboxInstance) vd.getInstance(p);
        inbox.sendMessage(msg);
    }

    /**
     *
     * @param p
     * @param subject
     * @param body
     * @param from
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
     *
     * @param p
     * @param subject
     * @param body
     * @param from
     * @param attachements
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
    protected EntityManager getEntityManager() {
        return this.em;
    }
}
