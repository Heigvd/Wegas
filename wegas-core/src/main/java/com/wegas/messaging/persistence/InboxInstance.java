/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.messaging.persistence;

import ch.albasim.wegas.annotations.CommonView;
import ch.albasim.wegas.annotations.View;
import ch.albasim.wegas.annotations.WegasEntityProperty;
import ch.albasim.wegas.annotations.WegasExtraProperty;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonManagedReference;
import com.wegas.core.Helper;
import com.wegas.core.i18n.persistence.TranslatableContent;
import com.wegas.core.i18n.persistence.Translation;
import com.wegas.core.persistence.EntityComparators;
import com.wegas.core.persistence.game.GameModelLanguage;
import com.wegas.core.persistence.variable.VariableDescriptor;
import com.wegas.core.persistence.variable.VariableInstance;
import com.wegas.editor.ValueGenerators.EmptyArray;
import java.util.ArrayList;
import java.util.Collection;
import java.util.List;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Entity;
import jakarta.persistence.OneToMany;
import org.openjdk.nashorn.api.scripting.JSObject;
import org.openjdk.nashorn.api.scripting.ScriptObjectMirror;
import org.slf4j.LoggerFactory;

/**
 * @author Francois-Xavier Aeberhard (fx at red-agent.com)
 */
@Entity
public class InboxInstance extends VariableInstance {

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
    @WegasEntityProperty(
        optional = false, nullable = false, proposal = EmptyArray.class,
        view = @View(
            label = "Messages",
            featureLevel = CommonView.FEATURE_LEVEL.ADVANCED
        ))
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

    /**
     * @param message
     *
     * @return
     */
    public Message sendMessage(Message message) {
        this.addMessage(message);
        return message;
    }

    /**
     * Script-facing overloads below take {@code Object} parameters on purpose: a JS {@code undefined}
     * given to a {@code String} parameter is converted to the "undefined" string by nashorn before
     * reaching the method, and objects become "[object Object]". Each argument may be a String, a
     * nashorn object, a {@link TranslatableContent}, null or undefined (which means empty).
     *
     * @param from    message sender
     * @param subject message subject
     * @param body    message body
     *
     * @return The sent message
     */
    public Message sendMessage(Object from, Object subject, Object body) {
        return this.sendMessage(from, subject, body, null, null, null);
    }

    /**
     * @param from    message sender
     * @param subject message subject
     * @param body    message body
     * @param token   ({@link InboxDescriptor#sendMessageWithToken(com.wegas.core.persistence.game.Player, java.lang.Object, java.lang.Object, java.lang.Object, java.lang.Object) here}
     *
     * @return The sent message
     */
    public Message sendWithToken(Object from, Object subject, Object body, Object token) {
        return this.sendMessage(from, subject, body, null, token, null);
    }

    /**
     * Java does not allow both (from, subject, body, date) and (from, subject, body, attachments)
     * signatures once parameters are {@code Object}. Thus, the fourth argument is considered as
     * attachments if it's a list or a JS array, and as the date otherwise.
     *
     * @param from              message sender
     * @param subject           message subject
     * @param body              message body
     * @param dateOrAttachments either the date ({@link InboxDescriptor#sendDatedMessage(com.wegas.core.persistence.game.Player, java.lang.Object, java.lang.Object, java.lang.Object, java.lang.Object) here})
     *                          or the attachments
     *
     * @return The sent message
     */
    public Message sendMessage(Object from, Object subject, Object body, Object dateOrAttachments) {
        if (isList(dateOrAttachments)) {
            return this.sendMessage(from, subject, body, null, null, dateOrAttachments);
        } else {
            return this.sendMessage(from, subject, body, dateOrAttachments, null, null);
        }
    }

    /**
     * @param from        message sender
     * @param subject     message subject
     * @param body        message body
     * @param date        ({@link InboxDescriptor#sendDatedMessage(com.wegas.core.persistence.game.Player, java.lang.Object, java.lang.Object, java.lang.Object, java.lang.Object) here}
     * @param attachments
     *
     * @return The sent message
     */
    public Message sendMessage(Object from, Object subject, Object body, Object date, Object attachments) {
        return this.sendMessage(from, subject, body, date, null, attachments);
    }

    /**
     * @param from        message sender
     * @param subject     message subject
     * @param body        message body
     * @param date        ({@link InboxDescriptor#sendDatedMessage(com.wegas.core.persistence.game.Player, java.lang.Object, java.lang.Object, java.lang.Object, java.lang.Object) here}
     * @param token       ({@link InboxDescriptor#sendMessageWithToken(com.wegas.core.persistence.game.Player, java.lang.Object, java.lang.Object, java.lang.Object, java.lang.Object) here}
     * @param attachments
     *
     * @return The sent message
     */
    public Message sendMessage(Object from, Object subject, Object body, Object date, Object token, Object attachments) {
        String lang = this.getDefaultLang();

        final Message msg = new Message();
        msg.setToken(toToken(token));
        msg.setFrom(toTranslatableContent(from, lang));
        msg.setSubject(toTranslatableContent(subject, lang));
        msg.setBody(toTranslatableContent(body, lang));
        msg.setDate(toTranslatableContent(date, lang));
        msg.setAttachments(toAttachments(attachments, lang));

        return this.sendMessage(msg);
    }

    /**
     * @return code of the first language of the game model, "en" if there is none
     */
    private String getDefaultLang() {
        VariableDescriptor desc = this.findDescriptor();
        if (desc != null && desc.getGameModel() != null) {
            List<GameModelLanguage> languages = desc.getGameModel().getRawLanguages();
            if (languages != null && !languages.isEmpty()) {
                return languages.get(0).getCode();
            }
        }
        return "en";
    }

    private static boolean isMissing(Object o) {
        return o == null || ScriptObjectMirror.isUndefined(o);
    }

    private static boolean isList(Object o) {
        return o instanceof List
            || (o instanceof ScriptObjectMirror && ((ScriptObjectMirror) o).isArray());
    }

    private static String toToken(Object token) {
        return isMissing(token) ? null : token.toString();
    }

    /**
     * Convert a script argument to a brand new TranslatableContent.
     *
     * @param o    String, nashorn object, TranslatableContent, null or undefined
     * @param lang language to use for plain strings and missing values
     *
     * @return new TranslatableContent, never null (an empty translation for missing values)
     */
    private static TranslatableContent toTranslatableContent(Object o, String lang) {
        if (isMissing(o)) {
            return TranslatableContent.build(lang, "");
        } else if (o instanceof TranslatableContent) {
            return TranslatableContent.merger(null, (TranslatableContent) o);
        } else if (o instanceof JSObject) {
            return TranslatableContent.readFromNashorn((JSObject) o);
        } else {
            return TranslatableContent.build(lang, o.toString());
        }
    }

    /**
     * Convert a script argument to a brand new list of attachments.
     *
     * @param o    list or JS array of Strings, nashorn objects or Attachments; null or undefined
     * @param lang language to use for plain strings
     *
     * @return new list of attachments, never null
     */
    private static List<Attachment> toAttachments(Object o, String lang) {
        List<Attachment> atts = new ArrayList<>();
        Collection<?> items;
        if (o instanceof ScriptObjectMirror && ((ScriptObjectMirror) o).isArray()) {
            items = ((ScriptObjectMirror) o).values();
        } else if (o instanceof Collection) {
            items = (Collection<?>) o;
        } else {
            items = List.of();
        }

        for (Object item : items) {
            if (item instanceof Attachment) {
                try {
                    atts.add((Attachment) ((Attachment) item).duplicate());
                } catch (CloneNotSupportedException ex) {
                }
            } else if (item instanceof JSObject) {
                atts.add(Attachment.readFromNashorn((JSObject) item));
            } else if (!isMissing(item)) {
                Attachment a = new Attachment();
                a.setFile(TranslatableContent.build(lang, item.toString()));
                atts.add(a);
            }
        }
        return atts;
    }

    /**
     * @return unread message count
     */
    @WegasExtraProperty(view = @View(
        label = "Unread count",
        readOnly = true
    ))
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
        // only used to explicitly ignore while serializing
    }

    /**
     * @param subject
     *
     * @return the most recent message that match the given subject
     */
    public Message getMessageBySubject(String subject) {
        for (Message m : this.getMessages()) {
            for (Translation tr : m.getSubject().getRawTranslations()) {
                if (tr.getTranslation().equals(subject)) {
                    return m;
                }
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
    public String toString() {
        return this.getClass().getSimpleName() + "( " + getId() + ", msgs: " + this.getMessages().size() + " )";
    }
}
