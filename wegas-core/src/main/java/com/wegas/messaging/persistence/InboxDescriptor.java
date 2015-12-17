/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013, 2014, 2015 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.messaging.persistence;

import com.wegas.core.persistence.AbstractEntity;
import com.wegas.core.persistence.game.Player;
import com.wegas.core.persistence.variable.VariableDescriptor;
import java.util.List;
import javax.persistence.Entity;
import javax.persistence.Lob;
//import javax.xml.bind.annotation.XmlType;

/**
 *
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
@Entity
//@XmlType(name = "InboxDescriptor")
public class InboxDescriptor extends VariableDescriptor<InboxInstance> {

    private static final long serialVersionUID = 1L;
    /**
     *
     */
    @Lob
    private String description;

    /**
     *
     * @param a
     */
    @Override
    public void merge(AbstractEntity a) {
        super.merge(a);
    }

    /**
     * @return the description
     */
    public String getDescription() {
        return description;
    }

    /**
     * @param description the description to set
     */
    public void setDescription(String description) {
        this.description = description;
    }

    /**
     *
     * Sugar to be used from scripts.
     *
     * @param p
     * @param from
     * @param subject
     * @param body
     * @return {
     * @see Message} The sent message
     */
    public Message sendMessage(Player p, String from, String subject, String body) {
        return this.getInstance(p).sendMessage(from, subject, body);
    }

    /**
     *
     * Sugar to be used from scripts.
     *
     * @param p
     * @param from
     * @param subject
     * @param body
     * @param token
     * @return {
     * @see Message} The sent message
     */
    public Message sendMessageWithToken(Player p, String from, String subject, String body, String token) {
        return this.getInstance(p).sendMessage(from, subject, body, null, token, null);
    }

    /**
     *
     * Sugar to be used from scripts.
     *
     * @param p
     * @param from
     * @param subject
     * @param body
     * @param date
     * @return {
     * @see Message} The sent message
     */
    public Message sendDatedMessage(Player p, String from, String date, String subject, String body) {
        return this.getInstance(p).sendMessage(from, subject, body, date);
    }

    /**
     *
     * Sugar to be used from scripts.
     *
     * @param p
     * @param from
     * @param subject
     * @param body
     * @param attachements
     * @return {@link Message} the sent message
     */
    public Message sendMessage(Player p, String from, String subject, String body, List<String> attachements) {
        return this.getInstance(p).sendMessage(from, subject, body, attachements);
    }

    /**
     *
     * Sugar to be used from scripts.
     *
     * @param p
     * @param from
     * @param subject
     * @param body
     * @param date
     * @param attachements
     * @return {@link Message} the sent message
     */
    public Message sendDatedMessage(Player p, String from, String date, String subject, String body, List<String> attachements) {
        return this.getInstance(p).sendMessage(from, subject, body, date, attachements);
    }

    /**
     *
     * Sugar to be used from scripts.
     *
     * @param p
     * @param from
     * @param subject
     * @param body
     * @param date
     * @param token
     * @param attachements
     * @return {@link Message} the sent message
     */
    public Message sendMessage(Player p, String from, String date, String subject, String body, String token, List<String> attachements) {
        return this.getInstance(p).sendMessage(from, subject, body, date, token, attachements);
    }

    /**
     *
     * @param p
     * @return
     */
    public boolean isEmpty(Player p) {
        return this.getInstance(p).getMessages().isEmpty();
    }

    /**
     *
     * @param player {@link Player}
     * @return int unread message count for given player
     */
    public int getUnreadCount(Player player) {
        return this.getInstance(player).getUnreadCount();
    }

    /**
     * Return true is a message identified by the token exists and has been read
     *
     * @param self
     * @param token
     * @return
     */
    public boolean isTokenMarkedAsRead(Player self, String token) {
        return this.getInstance(self).isTokenMarkedAsRead(token);
    }

}
