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
import ch.albasim.wegas.annotations.View;
import com.wegas.core.persistence.annotations.Param;
import com.wegas.core.persistence.game.Player;
import com.wegas.core.persistence.variable.VariableDescriptor;
import com.wegas.editor.ValueGenerators.EmptyString;
import com.wegas.editor.view.StringView;
import jakarta.persistence.Entity;

/**
 *
 * @author Xavier Good
 */
@Entity
public class EventInboxDescriptor extends VariableDescriptor<EventInboxInstance> {

    private static final long serialVersionUID = 1L;

    public Event sendEvent(Player p, Event event) {
        this.getInstance(p).sendEvent(event);
        return event;
    }


    @Scriptable(dependsOn = DependencyScope.SELF)
    public Event sendEvent(Player p,
        @Param(view = @View(label = "payload", value = StringView.class),
            proposal = EmptyString.class) String payload) {
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
