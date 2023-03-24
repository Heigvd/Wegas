/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.core.persistence.variable.events;

import ch.albasim.wegas.annotations.DependencyScope;
import ch.albasim.wegas.annotations.Scriptable;
import com.wegas.core.persistence.game.Player;
import com.wegas.core.persistence.variable.VariableDescriptor;
import jakarta.persistence.Entity;

/**
 *
 * @author Francois-Xavier Aeberhard (fx at red-agent.com)
 */
@Entity
public class EventInboxDescriptor extends VariableDescriptor<EventInboxInstance> {

    private static final long serialVersionUID = 1L;

    public Event sendEvent(Player p, Event event) {
        this.getInstance(p).sendEvent(event);
        return event;
    }

    /**
     *
     * I18n Sugar to be used from scripts.
     *
     * @param p           message recipient
     * @param payload
     * @param from        message sender
     * @param subject     message subject
     * @param body        message body
     * @param date        the date the message has been sent (free text, eg. 'Monday Morning', 'may
     *                    the 4th', 'thrid period', and so on)
     * @param token       internal message identifier (can be used within a
     *                    {@link #isTokenMarkedAsRead script condition} to check whether or not
     *                    message has been read)
     * @param attachments
     *
     * @return
     */
    /*
    @Scriptable(returnType = Scriptable.ReturnType.VOID, dependsOn = DependencyScope.NONE)
    public Event sendEvent(Player p,
        @Param(view = @View(label = "from", value = I18nStringView.class),
            proposal = EmptyI18n.class) TranslatableContent from,
        @Param(view = @View(label = "date", value = I18nStringView.class),
            proposal = EmptyI18n.class) TranslatableContent date,
        @Param(
            view = @View(
                label = "subject",
                value = I18nStringView.class,
                layout = CommonView.LAYOUT.fullWidth
            ),
            proposal = EmptyI18n.class) TranslatableContent subject,
        @Param(
            view = @View(
                label = "body",
                value = I18nHtmlView.class,
                layout = CommonView.LAYOUT.fullWidth
            ),
            proposal = EmptyI18n.class
        ) TranslatableContent body,
        @Param(view = @View(
            label = "token",
            description = "Message identifier used to reference the message within FSM/Trigger conditions"
        )) String token,
        @Param(
            view = @View(
                label = "attachements",
                layout = CommonView.LAYOUT.fullWidth
            ),
            proposal = EmptyArray.class
        ) List<Attachment> attachments) {
        return this.getInstance(p).sendEvent(from, subject, body, date, token, attachments);
    }*/
/*
    @Scriptable(returnType = Scriptable.ReturnType.VOID, dependsOn = DependencyScope.NONE)
    public Event sendEvent(Player p,
        @Param(view = @View(labal = "payload"), value = C)
        @Param(view = @View(label = "from", value = I18nStringView.class),
            proposal = EmptyI18n.class) TranslatableContent from,
        @Param(view = @View(label = "date", value = I18nStringView.class),
            proposal = EmptyI18n.class) TranslatableContent date,
        @Param(
            view = @View(
                label = "subject",
                value = I18nStringView.class,
                layout = CommonView.LAYOUT.fullWidth
            ),
            proposal = EmptyI18n.class) TranslatableContent subject,
        @Param(
            view = @View(
                label = "body",
                value = I18nHtmlView.class,
                layout = CommonView.LAYOUT.fullWidth
            ),
            proposal = EmptyI18n.class
        ) TranslatableContent body,
        @Param(view = @View(
            label = "token",
            description = "Message identifier used to reference the message within FSM/Trigger conditions"
        )) String token,
        @Param(
            view = @View(
                label = "attachements",
                layout = CommonView.LAYOUT.fullWidth
            ),
            proposal = EmptyArray.class
        ) List<Attachment> attachments) {
        return this.getInstance(p).sendEvent(from, subject, body, date, token, attachments);
    }
    */

    public Event sendEvent(Player p, String payload) {
        return this.getInstance(p).sendEvent(payload);
    }

    /**
     *
     * @param p
     *
     * @return check if the given player's inbox is empty
     */
    @Scriptable(dependsOn = DependencyScope.SELF)
    public boolean isEmpty(Player p) {
        return this.getInstance(p).getEvents().isEmpty();
    }

}
