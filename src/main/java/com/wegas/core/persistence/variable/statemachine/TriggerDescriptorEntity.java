/*
 * Wegas.
 * http://www.albasim.com/wegas/
 *
 * School of Business and Engineering Vaud, http://www.heig-vd.ch/
 * Media Engineering :: Information Technology Managment :: Comem
 *
 * Copyright (C) 2011
 */
package com.wegas.core.persistence.variable.statemachine;

import com.wegas.core.script.ScriptEntity;
import java.util.HashMap;
import java.util.List;
import javax.persistence.Entity;
import javax.persistence.PrePersist;
import javax.persistence.PreUpdate;
import javax.persistence.Table;
import javax.persistence.Transient;
import javax.xml.bind.annotation.XmlRootElement;
import javax.xml.bind.annotation.XmlType;

/**
 *
 * @author Cyril Junod <cyril.junod at gmail.com>
 */
@Entity
@Table(name="TriggerDescriptor")
@XmlRootElement
@XmlType(name="TriggerDescriptor")
public class TriggerDescriptorEntity extends StateMachineDescriptorEntity {

    private Boolean oneShot;
    private Boolean opposedTrigger;
    @Transient
    private ScriptEntity triggerEvent;
    @Transient
    private ScriptEntity postTriggerEvent;

    public TriggerDescriptorEntity() {
    }

    public Boolean isOneShot() {
        return oneShot;
    }

    /**
     * Sets the trigger to be triggered only once.
     *
     * @param oneShot boolean defining a one time trigger
     */
    public void setOneShot(Boolean oneShot) {
        this.oneShot = oneShot;
    }

    public Boolean isOpposedTrigger() {
        return opposedTrigger;
    }

    /**
     * Sets the trigger to be rearmed once the trigger is false.
     *
     * @param opposedTrigger boolean defining if the trigger shuld be rearmed
     */
    public void setOpposedTrigger(Boolean opposedTrigger) {
        this.opposedTrigger = opposedTrigger;
    }

    public ScriptEntity getPostTriggerEvent() {
        return postTriggerEvent;
    }

    /**
     * Sets the event executed once the trigger fires.
     *
     * @param postTriggerEvent a script to execute after this trigger executes
     */
    public void setPostTriggerEvent(ScriptEntity postTriggerEvent) {
        this.postTriggerEvent = postTriggerEvent;
    }

    public ScriptEntity getTriggerEvent() {
        return triggerEvent;
    }

    /**
     * Sets the script which fires the trigger.
     *
     * @param triggerEvent a script which fires the trigger
     */

    public void setTriggerEvent(ScriptEntity triggerEvent) {
        this.triggerEvent = triggerEvent;
    }


    @Override
    public String toString() {
        return "TriggerDescriptorEntity{id=" + this.getId() + ", oneShot=" + oneShot + ", opposedTrigger=" + opposedTrigger + ", triggerEvent=" + triggerEvent + ", postTriggerEvent=" + postTriggerEvent + '}';
    }

}
