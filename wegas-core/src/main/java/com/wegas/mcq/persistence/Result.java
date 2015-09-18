/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013, 2014, 2015 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.mcq.persistence;

import com.wegas.core.Helper;
import com.wegas.core.persistence.AbstractEntity;
import com.wegas.core.persistence.game.Script;
import com.wegas.core.persistence.variable.Searchable;
import com.wegas.core.rest.util.Views;
import java.util.ArrayList;
import java.util.List;
import javax.persistence.*;
import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonTypeName;
import com.fasterxml.jackson.annotation.JsonView;
import com.wegas.core.persistence.LabelledEntity;
import com.wegas.core.persistence.NamedEntity;
import com.wegas.core.persistence.variable.Scripted;

/**
 *
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
@Entity
//@XmlType(name = "Result")
@JsonTypeName(value = "Result")
@Table(name = "MCQResult", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"choicedescriptor_id", "name"}),
    @UniqueConstraint(columnNames = {"choicedescriptor_id", "label"})
})
public class Result extends NamedEntity implements Searchable, Scripted, LabelledEntity {

    private static final long serialVersionUID = 1L;
    /**
     *
     */
    @Id
    @GeneratedValue
    @JsonView(Views.IndexI.class)
    private Long id;
    /**
     * Internal Name
     */
    private String name;

    /**
     * Displayed name
     */
    private String label;
    /**
     *
     */
    @Column(length = 4096)
    //@Basic(fetch = FetchType.LAZY) // CARE, lazy fetch on Basics has some trouble.
    //@JsonView(Views.ExtendedI.class)
    private String answer;

    /*
     *
     */
    @ElementCollection
    private List<String> files = new ArrayList<>();
    /**
     *
     */
    @Embedded
    @JsonView(Views.EditorExtendedI.class)
    private Script impact;
    /**
     *
     */
    @ManyToOne
    @JsonBackReference
    @JoinColumn(name = "choicedescriptor_id")
    private ChoiceDescriptor choiceDescriptor;
    /**
     * This link is here so the reference is updated on remove.
     */
    @OneToMany(mappedBy = "currentResult", cascade = CascadeType.MERGE)
    //@XmlTransient
    @JsonIgnore
    private List<ChoiceInstance> choiceInstances;
    /**
     * This field is here so deletion will be propagated to replies.
     */
    @OneToMany(mappedBy = "result", cascade = CascadeType.REMOVE, orphanRemoval = true)
    //@XmlTransient
    @JsonIgnore
    private List<Reply> replies;

    /**
     *
     */
    public Result() {
    }

    /**
     *
     * @param name
     */
    public Result(String name) {
        this.name = name;
        this.label = name;
    }

    /**
     *
     * @param name
     */
    public Result(String name, String label) {
        this.name = name;
        this.label = label;
    }

    @Override
    public Boolean contains(final String criteria) {
        return this.containsAll(new ArrayList<String>() {
            {
                add(criteria);
            }
        });
    }

    @Override
    public Boolean containsAll(final List<String> criterias) {
        return Helper.insensitiveContainsAll(this.getName(), criterias)
                || Helper.insensitiveContainsAll(this.getAnswer(), criterias)
                || (this.getImpact() != null && this.getImpact().containsAll(criterias));
    }

    @Override
    public List<Script> getScripts() {
        List<Script> ret = new ArrayList<>();
        ret.add(this.impact);
        return ret;
    }

    /**
     *
     * @param a
     */
    @Override
    public void merge(AbstractEntity a) {
        Result other = (Result) a;
        this.setName(other.getName());
        this.setLabel(other.getLabel());
        this.setAnswer(other.getAnswer());
        this.setImpact(other.getImpact());
        this.setFiles(other.getFiles());
        this.setChoiceDescriptor(other.getChoiceDescriptor());
    }

//    @PreRemove
//    private void preRemove() {                                                  // When a response is destroyed
//
//        for (ChoiceInstance c : this.getChoiceInstances()) {                    // remove it from all the instance it is the current result
//            c.setCurrentResult(null);
//            c.setCurrentResultId(null);
//        }
//        while (!this.getChoiceInstances().isEmpty()) {
//            this.getChoiceInstances().remove(0);
//        }
//    }
    @Override
    public Long getId() {
        return this.id;
    }

    /**
     * @return the choiceDescriptor
     */
    //@XmlTransient
    @JsonIgnore
    public ChoiceDescriptor getChoiceDescriptor() {
        return choiceDescriptor;
    }

    /**
     * @param choiceDescriptor the choiceDescriptor to set
     */
    public void setChoiceDescriptor(ChoiceDescriptor choiceDescriptor) {
        this.choiceDescriptor = choiceDescriptor;
    }

    /**
     *
     * @return
     */
    public Long getChoiceDescriptorId() {
        return choiceDescriptor.getId();
    }

    public void setChoiceDescriptorId(Long id) {
        // NOTHING TO TO....
    }

    /**
     * @return the answer
     */
    public String getAnswer() {
        return answer;
    }

    /**
     * @param answer the answer to set
     */
    public void setAnswer(String answer) {
        this.answer = answer;
    }

    /**
     * @return the impact
     */
    public Script getImpact() {
        return impact;
    }

    /**
     * @param impact the impact to set
     */
    public void setImpact(Script impact) {
        this.impact = impact;
    }

    /**
     * @return the name
     */
    @Override
    public String getName() {
        return name;
    }

    /**
     * @param name the name to set
     */
    @Override
    public void setName(String name) {
        this.name = name;
    }

    /**
     * @return the label
     */
    @Override
    public String getLabel() {
        return label;
    }

    /**
     * @param label the label to set
     */
    @Override
    public void setLabel(String label) {
        this.label = label;
    }

    /**
     * @return the files
     */
    public List<String> getFiles() {
        return files;
    }

    /**
     * @param files the files to set
     */
    public void setFiles(List<String> files) {
        this.files = files;
    }

    /**
     * @return the choiceInstances
     */
    //@XmlTransient
    @JsonIgnore
    public List<ChoiceInstance> getChoiceInstances() {
        return choiceInstances;
    }

    /**
     * @param choiceInstances the choiceInstances to set
     */
    public void setChoiceInstances(List<ChoiceInstance> choiceInstances) {
        this.choiceInstances = choiceInstances;
    }
}
