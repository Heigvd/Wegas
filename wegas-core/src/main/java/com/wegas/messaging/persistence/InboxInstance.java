/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013, 2014, 2015 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.messaging.persistence;

import com.fasterxml.jackson.annotation.JsonManagedReference;
import com.fasterxml.jackson.annotation.JsonView;
import com.wegas.core.Helper;
import com.wegas.core.exception.client.WegasIncompatibleType;
import com.wegas.core.persistence.AbstractEntity;
import com.wegas.core.persistence.EntityCreatedTimeComparator;
import com.wegas.core.persistence.ListUtils;
import com.wegas.core.persistence.variable.VariableInstance;
import com.wegas.core.rest.util.Views;
import org.slf4j.LoggerFactory;

import javax.persistence.CascadeType;
import javax.persistence.Entity;
import javax.persistence.OneToMany;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.List;

//import javax.xml.bind.annotation.XmlType;

/**
 * @author Francois-Xavier Aeberhard (fx at red-agent.com)
 */
@Entity
//@XmlType(name = "InboxInstance")

public class InboxInstance extends VariableInstance {

    /**
     *
     */
    protected static final org.slf4j.Logger logger = LoggerFactory.getLogger(InboxInstance.class);

    private static final long serialVersionUID = 1L;

    /**
     *
     */
    @JsonView(Views.ExtendedI.class)
    @OneToMany(mappedBy = "inboxInstance", cascade = {CascadeType.ALL}, orphanRemoval = true)
//    @OrderBy("sentTime DESC, id")
     /*
     Quote from GF4 development guide:

     *Using @OrderBy with a Shared Session Cache
     *  Setting @OrderBy on a ManyToMany or OneToMany relationship field in which a List
     *  represents the Many side doesn't work if the session cache is shared. Use one of the
     *  following workarounds:
     *          ■ Have the application maintain the order so the List is cached properly.
     *          ■ Refresh the session cache using EntityManager.refresh() if you don't want to
     *  maintain the order during creation or modification of the List.
     *          ■ Disable session cache sharing in persistence.xml as follows:
     *  <property name="eclipselink.cache.shared.default" value="false"/>

     */
    @JsonManagedReference("inbox-message")
    private List<Message> messages = new ArrayList<>();

    /**
     * @return the replies
     */
    public List<Message> getMessages() {
        Collections.sort(this.messages, new EntityCreatedTimeComparator<>());
        Collections.reverse(messages);
        return this.messages;
    }

    /**
     * @param messages
     */
    public void setMessages(List<Message> messages) {
        this.messages = messages;
        for (Message r : this.messages) {
            r.setInboxInstance(this);
        }
    }

    /**
     * @param message
     */
    public void addMessage(Message message) {
        final InboxDescriptor descr = (InboxDescriptor) this.findDescriptor();
        message.setInboxInstance(this);
        if (descr.getCapped()) {
            this.messages.clear();
        }
        this.messages.add(0, message);
    }

    @Override
    public void merge(AbstractEntity a) {
        if (a instanceof InboxInstance) {
            super.merge(a);
            InboxInstance other = (InboxInstance) a;
            this.setMessages(ListUtils.mergeLists(this.getMessages(), other.getMessages()));
        } else {
            throw new WegasIncompatibleType(this.getClass().getSimpleName() + ".merge (" + a.getClass().getSimpleName() + ") is not possible");
        }
    }

    /**
     * @param message
     */
    public void sendMessage(Message message) {
        this.addMessage(message);
    }

    /**
     * @param from    message sender
     * @param subject message subject
     * @param body    message body
     * @return The sent message
     */
    public Message sendMessage(String from, String subject, String body) {
        Message msg = new Message(from, subject, body, null, null, null);
        this.sendMessage(msg);
        return msg;
    }

    /**
     * @param from    message sender
     * @param subject message subject
     * @param body    message body
     * @param token   ({@link InboxDescriptor#sendMessage(com.wegas.core.persistence.game.Player, java.lang.String, java.lang.String, java.lang.String, java.lang.String, java.lang.String, java.util.List) here}
     * @return The sent message
     */
    public Message sendWithToken(String from, String subject, String body, String token) {
        Message msg = new Message(from, subject, body, null, token, null);
        this.sendMessage(msg);
        return msg;
    }

    /**
     * @param from    message sender
     * @param subject message subject
     * @param body    message body
     * @param date    ({@link InboxDescriptor#sendDatedMessage(com.wegas.core.persistence.game.Player, java.lang.String, java.lang.String, java.lang.String, java.lang.String) here}
     * @return The sent message
     */
    public Message sendMessage(String from, String subject, String body, String date) {
        Message msg = new Message(from, subject, body, date, null, null);
        this.sendMessage(msg);
        return msg;
    }

    /**
     * @param from         message sender
     * @param subject      message subject
     * @param body         message body
     * @param attachements
     * @return The sent message
     */
    public Message sendMessage(final String from, final String subject, final String body, final List<String> attachements) {
        final Message msg = new Message(from, subject, body, null, null, attachements);
        this.sendMessage(msg);
        return msg;
    }

    /**
     * @param from         message sender
     * @param subject      message subject
     * @param body         message body
     * @param date         ({@link InboxDescriptor#sendDatedMessage(com.wegas.core.persistence.game.Player, java.lang.String, java.lang.String, java.lang.String, java.lang.String) here}
     * @param attachements
     * @return The sent message
     */
    public Message sendMessage(final String from, final String subject, final String body, final String date, final List<String> attachements) {
        final Message msg = new Message(from, subject, body, date, attachements);
        this.sendMessage(msg);
        return msg;
    }

    /**
     * @param from         message sender
     * @param subject      message subject
     * @param body         message body
     * @param date         ({@link InboxDescriptor#sendDatedMessage(com.wegas.core.persistence.game.Player, java.lang.String, java.lang.String, java.lang.String, java.lang.String) here}
     * @param token        ({@link InboxDescriptor#sendMessage(com.wegas.core.persistence.game.Player, java.lang.String, java.lang.String, java.lang.String, java.lang.String, java.lang.String, java.util.List) here}
     * @param attachements
     * @return The sent message
     */
    public Message sendMessage(final String from, final String subject, final String body, final String date, String token, final List<String> attachements) {
        final Message msg = new Message(from, subject, body, date, token, attachements);
        this.sendMessage(msg);
        return msg;
    }

    /**
     * @return unread message count
     */
    public int getUnreadCount() {
        int unread = 0;
        List<Message> listMessages = this.getMessages();
        for (Message m : listMessages) {
            if (m.getUnread()) {
                unread += 1;
            }
        }
        return unread;
    }

    /**
     * @param count
     */
    public void setUnreadCount(int count) {
        // only used to explicitely ignore while serializing
    }

    /**
     * @param subject
     * @return the most recent message that match the given subject
     */
    public Message getMessageBySubject(String subject) {
        for (Message m : this.getMessages()) {
            if (m.getSubject().equals(subject)) {
                return m;
            }
        }
        return null;
    }

    /**
     * get the first message identified by "token"
     *
     * @param token
     * @return the first (ie. most recent) message matching the token
     */
    public Message getMessageByToken(String token) {
        if (!Helper.isNullOrEmpty(token)) {
            for (Message m : this.getMessages()) {
                if (token.equals(m.getToken())) {
                    return m;
                }
            }
        }
        return null;
    }

    /**
     * Return true is a message identified by the token exists and has been read
     *
     * @param token
     * @return true if such a message exists and has been read
     */
    public boolean isTokenMarkedAsRead(String token) {
        Message message = this.getMessageByToken(token);
        return message != null && !message.getUnread();
    }

    @Override
    public String toString() {
        return this.getClass().getSimpleName() + "( " + getId() + ", msgs: " + this.getMessages().size() + " )";
    }
}
