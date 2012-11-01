/*
 * Wegas.
 * http://www.albasim.com/wegas/
 *
 * School of Business and Engineering Vaud, http://www.heig-vd.ch/
 * Media Engineering :: Information Technology Managment :: Comem
 *
 * Copyright (C) 2012
 */
package com.wegas.messaging.persistence;

import com.wegas.core.persistence.AbstractEntity;
import com.wegas.core.persistence.game.Player;
import com.wegas.core.persistence.variable.VariableDescriptor;
import java.util.logging.Logger;
import javax.persistence.Column;
import javax.persistence.Entity;
import javax.xml.bind.annotation.XmlType;

/**
 *
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
@Entity
@XmlType(name = "InboxDescriptor")
public class InboxDescriptor extends VariableDescriptor<InboxInstance> {

    private static final long serialVersionUID = 1L;
    private static final Logger logger = Logger.getLogger("MCQDescriptorEntity");
    /**
     *
     */
    @Column(length = 4096)
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
     * @param content
     */
    public void sendMessage(Player p, String from, String subject, String body) {
        this.getInstance(p).sendMessage(from, subject, body);
    }
}
