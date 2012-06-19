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

import com.wegas.core.persistence.variable.statemachine.StateMachineDescriptor;
import java.util.Map;
import javax.persistence.CascadeType;
import javax.persistence.Entity;
import javax.persistence.MapKeyColumn;
import javax.persistence.OneToMany;
import javax.xml.bind.annotation.XmlType;

/**
 *
 * @author Cyril Junod <cyril.junod at gmail.com>
 */
@Entity
@XmlType(name = "")
public class DialogueDescriptor extends StateMachineDescriptor {

    @OneToMany(mappedBy = "dialogue", cascade = CascadeType.ALL)
    @MapKeyColumn(name = "name", updatable = false, insertable = false)
    private Map<String, UserAction> userActions;

    public DialogueDescriptor() {
    }

    public Map<String, UserAction> getUserActions() {
        return userActions;
    }

    public void setUserActions(Map<String, UserAction> userActions) {
        this.userActions = userActions;
    }

    @Override
    public String toString() {
        return "DialogueDescriptor{" + "userActions=" + userActions + '}';
    }
}
