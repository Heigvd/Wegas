/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2018 School of Business and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.messaging.persistence;

import com.wegas.core.persistence.AbstractEntity;
import com.wegas.core.persistence.game.Player;
import com.wegas.core.merge.annotations.WegasEntityProperty;
import com.wegas.core.persistence.variable.VariableDescriptor;
import java.util.List;
import javax.persistence.Entity;
import javax.persistence.Lob;
import static java.lang.Boolean.FALSE;
import javax.persistence.Column;

/**
 *
 * @author Francois-Xavier Aeberhard (fx at red-agent.com)
 */
@Entity
public class InboxDescriptor extends VariableDescriptor<InboxInstance> {

    private static final long serialVersionUID = 1L;
    /**
     *
     */
    @Lob
    private String description;

    /**
     * Tells if the inbox has a capacity of just one message.
     */
    @Column(columnDefinition = "boolean default false")
    @WegasEntityProperty
    private Boolean capped = FALSE;


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
     * @return the limited capacity
     */
    public Boolean getCapped() {
        return capped;
    }

    /**
     * @param capped the capacity limitation to set
     */
    public void setCapped(Boolean capped) {
        this.capped = capped;
    }

    /**
     *
     * Sugar to be used from scripts.
     *
     * @param p message recipient
     * @param from sender
     * @param subject message subject
     * @param body message body
     * @return The sent message
     * @see Message
     */
    public Message sendMessage(Player p, String from, String subject, String body) {
        return this.getInstance(p).sendMessage(from, subject, body);
    }

    /**
     *
     * Sugar to be used from scripts.
     *
     * @param p message recipient
     * @param from message sender
     * @param subject message subject
     * @param body message body
     * @param token internal message identifier (can be used within a
     * {@link #isTokenMarkedAsRead script condition} to check whether or not
     * message has been read)
     * @return The sent message
     * @see Message
     */
    public Message sendMessageWithToken(Player p, String from, String subject, String body, String token) {
        return this.getInstance(p).sendMessage(from, subject, body, null, token, null);
    }

    /**
     *
     * Sugar to be used from scripts.
     *
     * @param p message recipient
     * @param from message sender
     * @param subject message subject
     * @param body message body
     * @param date the date the message has been sent (free text, eg. 'Monday
     * Morning', 'may the 4th', 'thrid period', and so on)
     * @return The sent message
     * @see Message
     */
    public Message sendDatedMessage(Player p, String from, String date, String subject, String body) {
        return this.getInstance(p).sendMessage(from, subject, body, date);
    }

    /**
     *
     * Sugar to be used from scripts.
     *
     * @param p message recipient
     * @param from message sender
     * @param subject message subject
     * @param body message body
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
     * @param p message recipient
     * @param from message sender
     * @param subject message subject
     * @param body message body
     * @param date the date the message has been sent (free text, eg. 'Monday
     * Morning', 'may the 4th', 'thrid period', and so on)
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
     * @param p message recipient
     * @param from message sender
     * @param subject message subject
     * @param body message body
     * @param date the date the message has been sent (free text, eg. 'Monday
     * Morning', 'may the 4th', 'thrid period', and so on)
     * @param token internal message identifier (can be used within a
     * {@link #isTokenMarkedAsRead script condition} to check whether or not
     * message has been read)
     * @param attachements
     * @return {@link Message} the sent message
     */
    public Message sendMessage(Player p, String from, String date, String subject, String body, String token, List<String> attachements) {
        return this.getInstance(p).sendMessage(from, subject, body, date, token, attachements);
    }

    /**
     *
     * @param p
     * @return check if the given player's inbox is empty
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
     * Check message read status
     *
     * @param self
     * @param token
     * @return true is a message identified by the token exists and has been
     * read, false otherwise
     */
    public boolean isTokenMarkedAsRead(Player self, String token) {
        return this.getInstance(self).isTokenMarkedAsRead(token);
    }

}
