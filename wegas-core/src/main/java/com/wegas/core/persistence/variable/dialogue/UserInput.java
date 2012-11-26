/*
 * Wegas.
 *
 * http://www.albasim.com/wegas/
 *
 * School of Business and Engineering Vaud, http://www.heig-vd.ch/
 * Media Engineering :: Information Technology Managment :: Comem
 *
 * Copyright (C) 2012
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

    public UserInput() {
    }

    public String getUserActionName() {
        return userActionName;
    }

    public void setUserActionName(String userActionName) {
        this.userActionName = userActionName;
    }
}
