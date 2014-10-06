/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.core.persistence.variable.statemachine;

import com.wegas.core.Helper;
import javax.persistence.Entity;
import javax.persistence.Lob;
import javax.xml.bind.annotation.XmlType;

/**
 *
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
@Entity
@XmlType(name = "DialogueDescriptor")
public class DialogueDescriptor extends StateMachineDescriptor {

    private static final long serialVersionUID = 1L;
    /**
     *
     */
    @Lob
    private String content;

    @Override
    public Boolean contains(String criteria) {
        if (Helper.insensitiveContains(this.getContent(), criteria)) {
            return true;
        }
        return super.contains(criteria);
    }

    /**
     * @return the content
     */
    public String getContent() {
        return content;
    }

    /**
     * @param content the content to set
     */
    public void setContent(String content) {
        this.content = content;
    }
}
