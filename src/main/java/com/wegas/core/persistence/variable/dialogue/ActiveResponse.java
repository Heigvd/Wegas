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

import com.wegas.core.persistence.variable.statemachine.State;
import java.util.Map;
import javax.persistence.Entity;
import javax.persistence.ManyToMany;
import javax.persistence.MapKeyJoinColumn;
import javax.xml.bind.annotation.XmlType;

/**
 *
 * @author Cyril Junod <cyril.junod at gmail.com>
 */
//@Entity
@XmlType(name = "")
public class ActiveResponse extends State {

    @ManyToMany(cascade = {})
    @MapKeyJoinColumn(name = "action_name", referencedColumnName = "name", insertable = false, updatable = false)
    private Map<UserAction, ResponseModel> currentResponses;

    public ActiveResponse() {
    }

    public Map<UserAction, ResponseModel> getCurrentResponses() {
        return currentResponses;
    }

    public void setCurrentResponses(Map<UserAction, ResponseModel> currentResponses) {
        this.currentResponses = currentResponses;
    }

    @Override
    public String toString() {
        return "ActiveResponse{" + "currentResponses=" + currentResponses + '}';
    }
}
