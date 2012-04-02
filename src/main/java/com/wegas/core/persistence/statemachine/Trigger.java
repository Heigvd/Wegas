/*
 * Wegas.
 * http://www.albasim.com/wegas/
 *
 * School of Business and Engineering Vaud, http://www.heig-vd.ch/
 * Media Engineering :: Information Technology Managment :: Comem
 *
 * Copyright (C) 2011
 */
package com.wegas.core.persistence.statemachine;

import javax.persistence.Entity;
import javax.persistence.PrePersist;
import javax.persistence.PreUpdate;
import javax.persistence.Table;

/**
 * Trigger: S1->S2 (oneShot)<br/> S1->S2->S1 with transition S2->S1
 * not(S1->S2)(opposedTrigger)<br/> else S1->S1 (loop).
 *
 * @author Cyril Junod <cyril.junod at gmail.com>
 */
@Entity
@Table(name = "wegas_trigger")
public class Trigger extends FiniteStateMachine {

    private Boolean oneShot;
    private Boolean opposedTrigger;

    public Trigger() {
    }

    public Boolean isOneShot() {
        return oneShot;
    }

    public void setOneShot(Boolean oneShot) {
        this.oneShot = oneShot;
    }

    public Boolean isOpposedTrigger() {
        return opposedTrigger;
    }

    public void setOpposedTrigger(Boolean opposedTrigger) {
        this.opposedTrigger = opposedTrigger;
    }
    //TODO : PrePersist, PreUpdate State creation

    @PrePersist
    @PreUpdate
    public void generateTrigger() {
    }
}
