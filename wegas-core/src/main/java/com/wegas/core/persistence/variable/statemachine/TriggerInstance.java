/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013, 2014, 2015 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.core.persistence.variable.statemachine;

import javax.persistence.Entity;

/**
 * Trigger: S1->(T1)->S2, S2 final (oneShot)<br/> S1->(T1)->S2->(!T1)->S1
 * (opposedTrigger)<br/> else S1->(T1)->S1 (loop).<br/> OneShot and
 * OpposedTrigger are exclusive. OneShot wins.
 *
 * @author Cyril Junod (cyril.junod at gmail.com)
 */
@Entity
public class TriggerInstance extends StateMachineInstance {

    private static final long serialVersionUID = 1L;

    public TriggerInstance() {
        super();
        this.setCurrentStateId(1L);
    }

    @Override
    public String toString() {
        return "TriggerInstance{" + "id=" + this.getId() + ", currentStateId=" + this.getCurrentStateId() + '}';
    }
}
