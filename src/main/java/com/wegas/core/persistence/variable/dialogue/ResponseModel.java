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

import com.wegas.core.persistence.game.Script;
import java.io.Serializable;
import javax.persistence.*;
import javax.xml.bind.annotation.XmlType;

/**
 *
 * @author Cyril Junod <cyril.junod at gmail.com>
 */
@Entity
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
    @JoinColumn(name = "action")
    private UserAction action;
    @Column(name = "response_name")
    private String name;
    @Column(name = "label")
    private String label;
    private String responseText;
    @Embedded
    private Script impact;
    private String notes;

    public ResponseModel() {
    }

    public Long getId() {
        return id;
    }

    public Script getImpact() {
        return impact;
    }

    public void setImpact(Script impact) {
        this.impact = impact;
    }

    public String getLabel() {
        return label;
    }

    public void setLabel(String label) {
        this.label = label;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }

    public String getResponseText() {
        return responseText;
    }

    public void setResponseText(String responseText) {
        this.responseText = responseText;
    }

    public UserAction getAction() {
        return action;
    }

    public void setAction(UserAction action) {
        this.action = action;
    }

    @Override
    public String toString() {
        return "ResponseModel{" + "id=" + id + ", name=" + name + ", label=" + label + ", responseText=" + responseText + ", impact=" + impact + ", notes=" + notes + '}';
    }
}
