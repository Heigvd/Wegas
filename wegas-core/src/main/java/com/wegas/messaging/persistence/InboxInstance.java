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
import com.wegas.core.exception.client.WegasErrorMessage;
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
        msg.setFrom(toTranslatableContent(from, lang, "from"));
        msg.setSubject(toTranslatableContent(subject, lang, "subject"));
        msg.setBody(toTranslatableContent(body, lang, "body"));
        msg.setDate(toTranslatableContent(date, lang, "date"));
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

    /**
     * Plain values accepted as text
     */
    private static boolean isText(Object o) {
        return o instanceof CharSequence || o instanceof Number || o instanceof Boolean;
    }

    /**
     * @return true if o is a nashorn object with the given "@class"
     */
    private static boolean isJSEntity(Object o, String atClass) {
        return o instanceof JSObject && atClass.equals(((JSObject) o).getMember("@class"));
    }

    /**
     * Describe the type of an invalid argument for error messages
     */
    private static String describe(Object o) {
        if (o instanceof ScriptObjectMirror) {
            ScriptObjectMirror som = (ScriptObjectMirror) o;
            if (som.isArray()) {
                return "an array";
            } else if (som.isFunction()) {
                return "a function";
            }
            Object atClass = som.getMember("@class");
            return atClass instanceof String ? "an object of class " + atClass : "an object without @class";
        }
        return "a " + o.getClass().getSimpleName();
    }

    private WegasErrorMessage invalidArgument(String field, String expected, Object o) {
        VariableDescriptor desc = this.findDescriptor();
        String inboxName = desc != null ? desc.getName() : "inbox";
        return WegasErrorMessage.error(inboxName + ".sendMessage: \"" + field + "\" must be "
            + expected + ", got " + describe(o));
    }

    private void logMissing(String field) {
        if (loggerbeans.isDebugEnabled()) {
            VariableDescriptor desc = this.findDescriptor();
            loggerbeans.debug("{}.sendMessage: {} is missing, replaced by an empty value",
                desc != null ? desc.getName() : "inbox", field);
        }
    }

    private String toToken(Object token) {
        if (isMissing(token)) {
            return null;
        } else if (isText(token)) {
            return token.toString();
        }
        throw invalidArgument("token", "a text", token);
    }

    /**
     * Convert a script argument to a brand new TranslatableContent.
     *
     * @param o     text, TranslatableContent (java or nashorn), null or undefined
     * @param lang  language to use for texts and missing values
     * @param field name of the argument, for logs and error messages
     *
     * @return new TranslatableContent, never null (an empty translation for missing values)
     *
     * @throws WegasErrorMessage if o is of any other type
     */
    private TranslatableContent toTranslatableContent(Object o, String lang, String field) {
        if (isMissing(o)) {
            logMissing(field);
            return TranslatableContent.build(lang, "");
        } else if (isText(o)) {
            return TranslatableContent.build(lang, o.toString());
        } else if (o instanceof TranslatableContent) {
            return TranslatableContent.merger(null, (TranslatableContent) o);
        } else if (isJSEntity(o, "TranslatableContent")) {
            return TranslatableContent.readFromNashorn((JSObject) o);
        }
        throw invalidArgument(field, "a text or a translation", o);
    }

    /**
     * Convert a script argument to a brand new list of attachments.
     *
     * @param o    list or JS array of attachments (see {@link #toAttachment}), null or undefined
     * @param lang language to use for texts
     *
     * @return new list of attachments, never null
     *
     * @throws WegasErrorMessage if o or one of its items is of any other type
     */
    private List<Attachment> toAttachments(Object o, String lang) {
        Collection<?> items;
        if (isMissing(o)) {
            logMissing("attachments");
            items = List.of();
        } else if (o instanceof ScriptObjectMirror && ((ScriptObjectMirror) o).isArray()) {
            items = ((ScriptObjectMirror) o).values();
        } else if (o instanceof Collection) {
            items = (Collection<?>) o;
        } else {
            throw invalidArgument("attachments", "an array", o);
        }

        List<Attachment> attachments = new ArrayList<>();
        int i = 0;
        for (Object item : items) {
            Attachment att = toAttachment(item, lang, "attachments[" + i + "]");
            if (att != null) {
                attachments.add(att);
            }
            i++;
        }
        return attachments;
    }

    /**
     * Convert one attachment item to a brand new Attachment.
     *
     * @param item  file path (text), Attachment (java or nashorn), null or undefined
     * @param lang  language to use for texts
     * @param field name of the item, for logs and error messages
     *
     * @return new attachment or null if the item is missing
     *
     * @throws WegasErrorMessage if item is of any other type
     */
    private Attachment toAttachment(Object item, String lang, String field) {
        if (isMissing(item)) {
            logMissing(field);
            return null;
        } else if (item instanceof Attachment) {
            try {
                return (Attachment) ((Attachment) item).duplicate();
            } catch (CloneNotSupportedException ex) {
                throw WegasErrorMessage.error("Unable to copy " + field);
            }
        }

        Attachment att = new Attachment();
        if (isText(item)) {
            att.setFile(TranslatableContent.build(lang, item.toString()));
        } else if (isJSEntity(item, "Attachment")) {
            Object file = ((JSObject) item).getMember("file");
            if (isMissing(file)) {
                logMissing(field + ".file");
                return null;
            }
            att.setFile(toTranslatableContent(file, lang, field + ".file"));
        } else {
            throw invalidArgument(field, "a file path or an attachment", item);
        }
        return att;
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
