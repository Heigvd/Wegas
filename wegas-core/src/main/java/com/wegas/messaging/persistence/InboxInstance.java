/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2018 School of Business and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.messaging.persistence;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonManagedReference;
import com.wegas.core.Helper;
import com.wegas.core.exception.client.WegasIncompatibleType;
import com.wegas.core.i18n.persistence.TranslatableContent;
import com.wegas.core.persistence.AbstractEntity;
import com.wegas.core.persistence.EntityComparators;
import com.wegas.core.persistence.ListUtils;
import com.wegas.core.persistence.variable.Searchable;
import com.wegas.core.persistence.variable.VariableInstance;
import org.slf4j.LoggerFactory;

import javax.persistence.CascadeType;
import javax.persistence.Entity;
import javax.persistence.OneToMany;
import java.util.ArrayList;
import java.util.List;
import jdk.nashorn.api.scripting.JSObject;

/**
 * @author Francois-Xavier Aeberhard (fx at red-agent.com)
 */
@Entity
public class InboxInstance extends VariableInstance implements Searchable {

    /**
     *
     */
    protected static final org.slf4j.Logger loggerbeans = LoggerFactory.getLogger(InboxInstance.class);

    private static final long serialVersionUID = 1L;

    /**
     *
     */
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
        return messages;
    }

    /**
     * @return unmodifiable messages list, sorted by date (newer first)
     */
    @JsonIgnore
    public List<Message> getSortedMessages() {
        return Helper.copyAndSort(this.messages, new EntityComparators.ReverseCreateTimeComparator<>());
    }

    /**
     * @param messages
     */
    public void setMessages(List<Message> messages) {
        this.messages = messages;
        for (Message m : this.messages) {
            m.setInboxInstance(this);
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
     * @return
     */
    public Message sendMessage(Message message) {
        this.addMessage(message);
        return message;
    }

    /**
     * @param from    message sender
     * @param subject message subject
     * @param body    message body
     *
     * @return The sent message
     */
    public Message sendMessage(String from, String subject, String body) {
        return this.sendMessage(from, subject, body, null, null, null);
    }

    /**
     * @param from    message sender
     * @param subject message subject
     * @param body    message body
     * @param token   ({@link InboxDescriptor#sendMessage(com.wegas.core.persistence.game.Player, java.lang.String, java.lang.String, java.lang.String, java.lang.String, java.lang.String, java.util.List) here}
     *
     * @return The sent message
     */
    public Message sendWithToken(String from, String subject, String body, String token) {
        return this.sendMessage(from, subject, body, null, token, null);
    }

    /**
     * @param from    message sender
     * @param subject message subject
     * @param body    message body
     * @param date    ({@link InboxDescriptor#sendDatedMessage(com.wegas.core.persistence.game.Player, java.lang.String, java.lang.String, java.lang.String, java.lang.String) here}
     *
     * @return The sent message
     */
    public Message sendMessage(String from, String subject, String body, String date) {
        return this.sendMessage(from, subject, body, date, null, null);
    }

    /**
     * @param from        message sender
     * @param subject     message subject
     * @param body        message body
     * @param attachments
     *
     * @return The sent message
     */
    public Message sendMessage(final String from, final String subject, final String body, final List<String> attachments) {
        return this.sendMessage(from, subject, body, null, null, attachments);
    }

    /**
     * @param from        message sender
     * @param subject     message subject
     * @param body        message body
     * @param date        ({@link InboxDescriptor#sendDatedMessage(com.wegas.core.persistence.game.Player, java.lang.String, java.lang.String, java.lang.String, java.lang.String) here}
     * @param attachments
     *
     * @return The sent message
     */
    public Message sendMessage(final String from, final String subject, final String body, final String date, final List<String> attachments) {
        return this.sendMessage(from, subject, body, date, null, attachments);

    }

    /**
     * @param from        message sender
     * @param subject     message subject
     * @param body        message body
     * @param date        ({@link InboxDescriptor#sendDatedMessage(com.wegas.core.persistence.game.Player, java.lang.String, java.lang.String, java.lang.String, java.lang.String) here}
     * @param token       ({@link InboxDescriptor#sendMessage(com.wegas.core.persistence.game.Player, java.lang.String, java.lang.String, java.lang.String, java.lang.String, java.lang.String, java.util.List) here}
     * @param attachments
     *
     * @return The sent message
     */
    public Message sendMessage(final String from, final String subject, final String body, final String date, String token, final List<String> attachments) {
        return this.sendMessage(new Message(from, subject, body, date, token, attachments));
    }

    /**
     * I18n version
     *
     * @param from
     * @param subject
     * @param body
     * @param date
     * @param token
     * @param attachments
     *
     * @return
     */
    public Message sendMessage(final TranslatableContent from, final TranslatableContent subject,
            final TranslatableContent body, final TranslatableContent date,
            String token, final List<Attachment> attachments) {
        final Message msg = new Message();
        msg.setToken(token);
        msg.setFrom(TranslatableContent.merger(null, from));
        msg.setSubject(TranslatableContent.merger(null, subject));
        msg.setBody(TranslatableContent.merger(null, body));
        msg.setDate(TranslatableContent.merger(null, date));
        msg.setAttachments(ListUtils.mergeLists(msg.getAttachments(), attachments));

        this.sendMessage(msg);
        return msg;
    }

    public Message sendMessage(final JSObject from, final JSObject subject,
            final JSObject body, final JSObject date,
            String token, final List<JSObject> attachments) {

        List<Attachment> atts = new ArrayList<>();
        if (attachments != null && !attachments.isEmpty()) {
            for (JSObject a : attachments) {
                atts.add(Attachment.readFromNashorn(a));
            }
        }

        return this.sendMessage(
                TranslatableContent.readFromNashorn(from),
                TranslatableContent.readFromNashorn(subject),
                TranslatableContent.readFromNashorn(body),
                TranslatableContent.readFromNashorn(date),
                token, atts);
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
     *
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
     *
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
     *
     * @return true if such a message exists and has been read
     */
    public boolean isTokenMarkedAsRead(String token) {
        Message message = this.getMessageByToken(token);
        return message != null && !message.getUnread();
    }

    @Override
    public Boolean containsAll(List<String> criterias) {
        if (messages != null) {
            for (Message m : messages) {
                if (m.containsAll(criterias)) {
                    return true;
                }
            }
        }
        return false;
    }

    @Override
    public String toString() {
        return this.getClass().getSimpleName() + "( " + getId() + ", msgs: " + this.getMessages().size() + " )";
    }
}
