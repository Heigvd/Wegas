/*
 * Wegas
 * http://www.albasim.ch/wegas/
 *
 * Copyright (c) 2013 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.mcq.persistence;

import com.wegas.core.persistence.AbstractEntity;
import com.wegas.core.persistence.game.Script;
import com.wegas.core.rest.util.Views;
import java.util.ArrayList;
import java.util.List;
import javax.persistence.*;
import javax.xml.bind.annotation.XmlTransient;
import javax.xml.bind.annotation.XmlType;
import org.codehaus.jackson.annotate.JsonBackReference;
import org.codehaus.jackson.map.annotate.JsonView;

/**
 *
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
@Entity
@XmlType(name = "Result")
@Table(name = "MCQResult")
public class Result extends AbstractEntity {

    private static final long serialVersionUID = 1L;
//    private static final Logger logger = LoggerFactory.getLogger(MCQReplyInstanceEntity.class);
    /**
     *
     */
    @Id
    @GeneratedValue
    @JsonView(Views.IndexI.class)
    private Long id;
    /**
     *
     */
    private String name;
    /**
     *
     */
    @Column(length = 4096)
    private String answer;

    /*
     *
     */
    @ElementCollection(fetch = FetchType.LAZY)
    private List<String> files = new ArrayList<>();
    /**
     *
     */
    @Embedded
    private Script impact;
    /**
     *
     */
    @ManyToOne
    @JsonBackReference
    @JoinColumn(name = "choicedescriptor_id")
    private ChoiceDescriptor choiceDescriptor;
    /**
     *
     */
    @Column(name = "choicedescriptor_id", updatable = false, insertable = false)
    @JsonView(Views.IndexI.class)
    private Long choiceDescriptorId;
    /**
     * This link is here so the reference is updated on remove.
     */
    @OneToMany(mappedBy = "currentResult")
    @XmlTransient
    private List<ChoiceInstance> choiceInstances;
    /**
     * This field is here so deletion will be propagated to replies.
     */
    @OneToMany(mappedBy = "result")
    @XmlTransient
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
    }

    /**
     *
     * @param a
     */
    @Override
    public void merge(AbstractEntity a) {
        Result other = (Result) a;
        this.setName(other.getName());
        this.setAnswer(other.getAnswer());
        this.setImpact(other.getImpact());
        this.setFiles(other.getFiles());
    }

    //@PreRemove
    //private void preRemove() {
    //   for (ChoiceInstance c : this.getLinkedChoiceInstances()) {
    //       c.setCurrentResponse(null);
    //   }
    //   this.getChoiceDescriptor().propagateCurrentResult();
    //}
    @Override
    public Long getId() {
        return this.id;
    }

    /**
     * @return the choiceDescriptor
     */
    @XmlTransient
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
        return this.choiceDescriptorId;
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
    public String getName() {
        return name;
    }

    /**
     * @param name the name to set
     */
    public void setName(String name) {
        this.name = name;
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
    @XmlTransient
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
