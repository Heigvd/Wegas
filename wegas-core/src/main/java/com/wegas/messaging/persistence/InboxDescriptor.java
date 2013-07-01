/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.messaging.persistence;

import com.wegas.core.persistence.AbstractEntity;
import com.wegas.core.persistence.game.Player;
import com.wegas.core.persistence.variable.VariableDescriptor;
import java.util.List;
import javax.persistence.Entity;
import javax.persistence.Lob;
import javax.xml.bind.annotation.XmlType;

/**
 *
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
@Entity
@XmlType(name = "InboxDescriptor")
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
     */
    public void sendMessage(Player p, String from, String subject, String body) {
        this.getInstance(p).sendMessage(from, subject, body);
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
     */
    public void sendMessage(Player p, String from, String subject, String body, List<String> attachements) {
        this.getInstance(p).sendMessage(from, subject, body, attachements);
    }

    /**
     *
     * @param p
     * @return
     */
    public Boolean isEmpty(Player p) {
        return this.getInstance(p).getMessages().isEmpty();
    }
}
