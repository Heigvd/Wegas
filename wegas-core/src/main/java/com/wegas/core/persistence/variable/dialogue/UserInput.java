/*
 * Wegas
 * http://www.albasim.ch/wegas/
 *
 * Copyright (c) 2013 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.core.persistence.variable.dialogue;

import com.wegas.core.persistence.variable.statemachine.Transition;
import javax.persistence.Embeddable;
import javax.xml.bind.annotation.XmlType;

/**
 *
 * @author Cyril Junod <cyril.junod at gmail.com>
 */
@Embeddable
@XmlType(name = "")
public class UserInput extends Transition {

    private String userActionName;

    /**
     *
     */
    public UserInput() {
    }

    /**
     *
     * @return
     */
    public String getUserActionName() {
        return userActionName;
    }

    /**
     *
     * @param userActionName
     */
    public void setUserActionName(String userActionName) {
        this.userActionName = userActionName;
    }
}
