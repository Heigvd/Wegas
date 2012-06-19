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
import java.util.Map;
import javax.persistence.*;
import javax.xml.bind.annotation.XmlType;

/**
 *
 * @author Cyril Junod <cyril.junod at gmail.com>
 */
@Entity
@Table(name = "user_action",
uniqueConstraints = {
    @UniqueConstraint(columnNames = {"dialogue_id", "name"}),
    @UniqueConstraint(columnNames = {"dialogue_id", "label"})
})
@XmlType(name = "")
public class UserAction implements Serializable {

    @Id
    @GeneratedValue
    private Long id;
    @ManyToOne
    @JoinColumn(name = "dialogue_id")
    private DialogueDescriptor dialogue;
    @Column(name = "label")
    private String label;
    @Column(name = "name")
    private String name;
    private String notes;
    @Embedded
    private Script impact;
    @OneToMany(mappedBy = "action", cascade = CascadeType.ALL)
    @MapKeyColumn(name = "response_name", insertable = false, updatable = false)
    private Map<String, ResponseModel> responseModels;

    public UserAction() {
    }

    public DialogueDescriptor getDialogue() {
        return dialogue;
    }

    public void setDialogue(DialogueDescriptor dialogue) {
        this.dialogue = dialogue;
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

    public Map<String, ResponseModel> getResponseModels() {
        return responseModels;
    }

    public void setResponseModels(Map<String, ResponseModel> responseModels) {
        this.responseModels = responseModels;
    }

    @Override
    public String toString() {
        return "UserAction{" + "id=" + id + ", label=" + label + ", name=" + name + ", notes=" + notes + ", impact=" + impact + ", responseModels=" + responseModels + '}';
    }
}
