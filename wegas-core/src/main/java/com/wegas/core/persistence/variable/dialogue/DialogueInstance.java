/*
 * Wegas
 * http://www.albasim.com/wegas/
 *
 * Copyright (c) 2013 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.core.persistence.variable.dialogue;

import com.wegas.core.persistence.variable.statemachine.StateMachineInstance;
import java.util.List;
import javax.persistence.JoinColumn;
import javax.persistence.ManyToMany;
import javax.xml.bind.annotation.XmlType;

/**
 *
 * @author Cyril Junod <cyril.junod at gmail.com>
 */
//@Entity
@XmlType(name = "")
public class DialogueInstance extends StateMachineInstance {

    @ManyToMany(cascade = {})
    @JoinColumn(name = "history_response", referencedColumnName = "responseHistory", insertable = false, updatable = false)
    private List<ResponseModel> responseHistory;

    /**
     *
     */
    public DialogueInstance() {
    }

    /**
     *
     * @return
     */
    public List<ResponseModel> getResponseHistory() {
        return responseHistory;
    }

    /**
     *
     * @param responseHistory
     */
    public void setResponseHistory(List<ResponseModel> responseHistory) {
        this.responseHistory = responseHistory;
    }

    @Override
    public String toString() {
        return "DialogueInstance{" + "responseHistory=" + responseHistory + '}';
    }
}
