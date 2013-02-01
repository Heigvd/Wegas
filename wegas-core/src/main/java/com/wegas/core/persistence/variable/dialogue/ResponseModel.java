/*
 * Wegas
 * http://www.albasim.com/wegas/
 *
 * Copyright (c) 2013 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.core.persistence.variable.dialogue;

import com.wegas.core.persistence.game.Script;
import java.io.Serializable;
import javax.persistence.*;
import javax.xml.bind.annotation.XmlType;

/**
 *
 * @author Cyril Junod <cyril.junod at gmail.com>
 */
//@Entity
@Table(name = "response_model",
uniqueConstraints = {
    @UniqueConstraint(columnNames = {"action", "response_name"})
})
@XmlType(name = "")
public class ResponseModel implements Serializable {

    @Id
    @GeneratedValue
    private Long id;
    @ManyToOne
    @JoinColumn(name = "action", nullable = false)
    private UserAction action;
    @Column(name = "response_name", nullable = false)
    private String name;
    @Column(name = "label")
    private String label;
    private String responseText;
    @Embedded
    private Script impact;
    private String notes;

    /**
     *
     */
    public ResponseModel() {
    }

    /**
     *
     * @return
     */
    public Long getId() {
        return id;
    }

    /**
     *
     * @return
     */
    public Script getImpact() {
        return impact;
    }

    /**
     *
     * @param impact
     */
    public void setImpact(Script impact) {
        this.impact = impact;
    }

    /**
     *
     * @return
     */
    public String getLabel() {
        return label;
    }

    /**
     *
     * @param label
     */
    public void setLabel(String label) {
        this.label = label;
    }

    /**
     *
     * @return
     */
    public String getName() {
        return name;
    }

    /**
     *
     * @param name
     */
    public void setName(String name) {
        this.name = name;
    }

    /**
     *
     * @return
     */
    public String getNotes() {
        return notes;
    }

    /**
     *
     * @param notes
     */
    public void setNotes(String notes) {
        this.notes = notes;
    }

    /**
     *
     * @return
     */
    public String getResponseText() {
        return responseText;
    }

    /**
     *
     * @param responseText
     */
    public void setResponseText(String responseText) {
        this.responseText = responseText;
    }

    /**
     *
     * @return
     */
    public UserAction getAction() {
        return action;
    }

    /**
     *
     * @param action
     */
    public void setAction(UserAction action) {
        this.action = action;
    }

    @Override
    public String toString() {
        return "ResponseModel{" + "id=" + id + ", name=" + name + ", label=" + label + ", responseText=" + responseText + ", impact=" + impact + ", notes=" + notes + '}';
    }
}
