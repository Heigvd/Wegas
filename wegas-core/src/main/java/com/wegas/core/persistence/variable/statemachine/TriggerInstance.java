/*
 * Wegas
 * http://www.albasim.com/wegas/
 *
 * Copyright (c) 2013 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.core.persistence.variable.statemachine;

import javax.persistence.Entity;
import javax.persistence.Table;
import javax.xml.bind.annotation.XmlRootElement;
import javax.xml.bind.annotation.XmlType;

/**
 * Trigger: S1->(T1)->S2, S2 final (oneShot)<br/> S1->(T1)->S2->(!T1)->S1
 * (opposedTrigger)<br/> else S1->(T1)->S1 (loop).<br/> OneShot and
 * OpposedTrigger are exclusive. OneShot wins.
 *
 * @author Cyril Junod <cyril.junod at gmail.com>
 */
@Entity
@Table(name = "TriggerInstance")
@XmlRootElement
@XmlType(name = "TriggerInstance")
public class TriggerInstance extends StateMachineInstance {

    @Override
    public String toString() {
        return "TriggerInstance{" + "id=" + this.getId() + ", currentStateId=" + this.getCurrentStateId() + '}';
    }
}
