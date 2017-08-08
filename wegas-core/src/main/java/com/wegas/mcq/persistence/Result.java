/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2017 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.mcq.persistence;

import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonTypeName;
import com.fasterxml.jackson.annotation.JsonView;
import com.wegas.core.Helper;
import com.wegas.core.ejb.VariableInstanceFacade;
import com.wegas.core.exception.client.WegasIncompatibleType;
import com.wegas.core.persistence.AbstractEntity;
import com.wegas.core.persistence.LabelledEntity;
import com.wegas.core.persistence.NamedEntity;
import com.wegas.core.persistence.game.Script;
import com.wegas.core.persistence.merge.annotations.WegasEntityProperty;
import com.wegas.core.persistence.variable.Beanjection;
import com.wegas.core.persistence.variable.Scripted;
import com.wegas.core.persistence.variable.Searchable;
import com.wegas.core.rest.util.Views;

import javax.persistence.*;
import java.util.ArrayList;
import java.util.List;

/**
 * @author Francois-Xavier Aeberhard (fx at red-agent.com)
 */
@Entity
@JsonTypeName(value = "Result")
@Table(
        name = "MCQResult",
        uniqueConstraints = {
            @UniqueConstraint(columnNames = {"choicedescriptor_id", "name"}),
            @UniqueConstraint(columnNames = {"choicedescriptor_id", "label"}),},
        indexes = {
            @Index(columnList = "choicedescriptor_id")
        }
)
@NamedQueries({
    @NamedQuery(name = "Result.findByName", query = "SELECT DISTINCT res FROM Result res WHERE res.choiceDescriptor.id=:choicedescriptorId AND res.name LIKE :name")
})
public class Result extends NamedEntity implements Searchable, Scripted, LabelledEntity {

    private static final long serialVersionUID = 1L;

    @Version
    @Column(columnDefinition = "bigint default '0'::bigint")
    @WegasEntityProperty(sameEntityOnly = true)
    private Long version;

    public Long getVersion() {
        return version;
    }

    public void setVersion(Long version) {
        this.version = version;
    }

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
    @WegasEntityProperty
    private String name;

    /**
     * Displayed name
     */
    @WegasEntityProperty
    private String label;
    /**
     *
     */
    @Lob
    @Basic(fetch = FetchType.EAGER) // CARE, lazy fetch on Basics has some trouble.
    //@JsonView(Views.ExtendedI.class)
    @WegasEntityProperty
    private String answer;

    /**
     *
     */
    @Lob
    @Basic(fetch = FetchType.EAGER) // CARE, lazy fetch on Basics has some trouble.
    //@JsonView(Views.ExtendedI.class)
    @WegasEntityProperty
    private String ignorationAnswer;

    /*
     *
     */
    @ElementCollection
    @WegasEntityProperty
    private List<String> files = new ArrayList<>();
    /**
     *
     */
    @Embedded
    @JsonView(Views.EditorI.class)
    @WegasEntityProperty
    private Script impact;
    /**
     *
     */
    @Embedded
    @AttributeOverrides({
        @AttributeOverride(name = "content", column
                = @Column(name = "ignoration_content")),
        @AttributeOverride(name = "lang", column
                = @Column(name = "ignoration_language"))
    })
    @JsonView(Views.EditorI.class)
    @WegasEntityProperty
    private Script ignorationImpact;
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
    @OneToOne(mappedBy = "result", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonIgnore
    private CurrentResult currentResult;

    /**
     * This field is here so deletion will be propagated to replies.
     */
    @OneToOne(mappedBy = "result", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonIgnore
    private Replies replies;

    /**
     *
     */
    public Result() {
    }

    /**
     * @param name
     */
    public Result(String name) {
        this.name = name;
        this.label = name;
    }

    /**
     * @param name
     */
    public Result(String name, String label) {
        this.name = name;
        this.label = label;
    }

    @Override
    public Boolean containsAll(final List<String> criterias) {
        return Helper.insensitiveContainsAll(this.getName(), criterias)
                || Helper.insensitiveContainsAll(this.getAnswer(), criterias)
                || (this.getImpact() != null && this.getImpact().containsAll(criterias))
                || Helper.insensitiveContainsAll(this.getIgnorationAnswer(), criterias)
                || (this.getIgnorationImpact() != null && this.getIgnorationImpact().containsAll(criterias));
    }

    @Override
    public List<Script> getScripts() {
        List<Script> ret = new ArrayList<>();
        ret.add(this.getImpact());
        if (this.getIgnorationImpact() != null) {
            ret.add(this.getIgnorationImpact());
        }
        return ret;
    }

    /**
     * @param a
     */
    @Override
    public void __merge(AbstractEntity a) {
    }

    @Override
    public Long getId() {
        return this.id;
    }

    /**
     * @return the choiceDescriptor
     */
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
     * @return id from the parent choice descriptor
     */
    @JsonView(Views.IndexI.class)
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
     * @return the ignoration answer
     */
    public String getIgnorationAnswer() {
        return ignorationAnswer;
    }

    /**
     * @param answer the answer to set
     */
    public void setIgnorationAnswer(String answer) {
        this.ignorationAnswer = answer;
    }

    /**
     * @return the impact
     */
    public Script getIgnorationImpact() {
        return ignorationImpact;
    }

    /**
     * @param impact the impact to set
     */
    public void setIgnorationImpact(Script impact) {
        this.ignorationImpact = impact;
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
    @JsonIgnore
    public List<ChoiceInstance> getChoiceInstances() {
        return this.getCurrentResult().getChoiceInstances();
    }

    public void addChoiceInstance(ChoiceInstance choiceInstance) {
        CurrentResult cr = this.getCurrentResult();
        if (!cr.getChoiceInstances().contains(choiceInstance)) {
            cr.getChoiceInstances().add(choiceInstance);
        }
    }

    public boolean removeChoiceInstance(ChoiceInstance choiceInstance) {
        return this.getCurrentResult().remove(choiceInstance);
    }

    public CurrentResult getCurrentResult() {
        if (this.currentResult == null) {
            this.currentResult = new CurrentResult();
            this.currentResult.setResult(this);
        }

        return currentResult;
    }

    public Replies getReplies() {
        if (replies == null) {
            replies = new Replies();
            replies.setResult(this);
        }
        return replies;
    }

    public void addReply(Reply reply) {

        this.getReplies().add(reply);
    }

    void removeReply(Reply reply) {
        this.getReplies().remove(reply);
    }

    @Override
    public void updateCacheOnDelete(Beanjection beans) {
        VariableInstanceFacade vif = beans.getVariableInstanceFacade();

        for (ChoiceInstance cInstance : this.getChoiceInstances()) {
            if (cInstance != null) {
                cInstance = (ChoiceInstance) vif.find(cInstance.getId());
                if (cInstance != null) {
                    cInstance.setCurrentResult(null);
                }
            }
        }
    }

    @PrePersist
    private void prePersist() {
        this.getReplies();
        this.getCurrentResult();
    }
}
