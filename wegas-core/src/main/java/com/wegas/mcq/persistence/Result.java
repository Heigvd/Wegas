/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2018 School of Business and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.mcq.persistence;

import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonTypeName;
import com.fasterxml.jackson.annotation.JsonView;
import com.wegas.core.ejb.VariableInstanceFacade;
import com.wegas.core.merge.annotations.WegasEntityProperty;
import com.wegas.core.i18n.persistence.TranslatableContent;
import com.wegas.core.persistence.AbstractEntity;
import com.wegas.core.persistence.LabelledEntity;
import com.wegas.core.persistence.WithPermission;
import com.wegas.core.persistence.game.Script;
import com.wegas.core.persistence.variable.Beanjection;
import com.wegas.core.rest.util.Views;
import com.wegas.core.security.util.WegasPermission;
import java.util.Collection;
import java.util.HashSet;
import java.util.Set;
import javax.persistence.*;

/**
 * @author Francois-Xavier Aeberhard (fx at red-agent.com)
 */
@Entity
@JsonTypeName(value = "Result")
@Table(
        name = "MCQResult",
        uniqueConstraints = {
            @UniqueConstraint(columnNames = {"choicedescriptor_id", "name"}),
            @UniqueConstraint(columnNames = {"choicedescriptor_id", "label"})
        },
        indexes = {
            @Index(columnList = "choicedescriptor_id"),
            @Index(columnList = "label_id"),
            @Index(columnList = "answer_id"),
            @Index(columnList = "ignorationanswer_id")
        }
)
@NamedQueries({
    @NamedQuery(name = "Result.findByName", query = "SELECT DISTINCT res FROM Result res WHERE res.choiceDescriptor.id=:choicedescriptorId AND res.name LIKE :name")
})
public class Result extends AbstractEntity implements LabelledEntity {

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
    @WegasEntityProperty(searchable = true)
    private String name;

    /**
     * Displayed name
     */
    @OneToOne(cascade = CascadeType.ALL, orphanRemoval = true)
    @WegasEntityProperty
    private TranslatableContent label;

    /**
     * Displayed answer when result selected and validated
     */
    @OneToOne(cascade = CascadeType.ALL, orphanRemoval = true)
    @WegasEntityProperty
    private TranslatableContent answer;

    /**
     * Displayed answer when MCQ result not selected and validated
     */
    @OneToOne(cascade = CascadeType.ALL, orphanRemoval = true)
    @WegasEntityProperty
    private TranslatableContent ignorationAnswer;

    /*
     *
     */
    @ElementCollection
    @WegasEntityProperty
    private Set<String> files = new HashSet<>();
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
        @AttributeOverride(name = "language", column
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
    private ChoiceDescriptor choiceDescriptor;

    /**
     *
     */
    public Result() {
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
        if (this.choiceDescriptor !=null){
            if (this.getLabel() != null){
            this.getLabel().setParentDescriptor(choiceDescriptor);
            }
            if (this.getAnswer() != null){
                this.getAnswer().setParentDescriptor(choiceDescriptor);
            }
            if (this.getIgnorationAnswer() != null){
                this.getIgnorationAnswer().setParentDescriptor(choiceDescriptor);
            }
        }
    }

    /**
     * @return the answer
     */
    public TranslatableContent getAnswer() {
        return answer;
    }

    /**
     * @param answer the answer to set
     */
    public void setAnswer(TranslatableContent answer) {
        this.answer = answer;
        if (this.answer != null) {
            this.answer.setParentDescriptor(this.getChoiceDescriptor());
        }
    }

    /**
     * @return the impact
     */
    public Script getImpact() {
        this.touchImpact();
        return impact;
    }

    /**
     * @param impact the impact to set
     */
    public void setImpact(Script impact) {
        this.impact = impact;
        this.touchImpact();
    }

    private void touchImpact(){
        if (this.impact != null) {
            this.impact.setParent(this, "impact");
        }
    }

    /**
     * @return the ignoration answer
     */
    public TranslatableContent getIgnorationAnswer() {
        return ignorationAnswer;
    }

    /**
     * @param answer the answer to set
     */
    public void setIgnorationAnswer(TranslatableContent answer) {
        this.ignorationAnswer = answer;
        if (this.ignorationAnswer != null) {
            this.ignorationAnswer.setParentDescriptor(this.getChoiceDescriptor());
        }
    }

    /**
     * @return the impact
     */
    public Script getIgnorationImpact() {
        this.touchIgnorationImpact();
        return ignorationImpact;
    }

    /**
     * @param impact the impact to set
     */
    public void setIgnorationImpact(Script impact) {
        this.ignorationImpact = impact;
        this.touchIgnorationImpact();
    }

    private void touchIgnorationImpact(){
        if (this.ignorationImpact!=null){
            this.ignorationImpact.setParent(this, "ign");
        }
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
    public TranslatableContent getLabel() {
        return label;
    }

    /**
     * @param label the label to set
     */
    @Override
    public void setLabel(TranslatableContent label) {
        this.label = label;
        if (this.label != null) {
            this.label.setParentDescriptor(this.getChoiceDescriptor());
        }
    }

    /**
     * @return the files
     */
    public Set<String> getFiles() {
        return files;
    }

    /**
     * @param files the files to set
     */
    public void setFiles(Set<String> files) {
        this.files = files;
    }

    /*
     * @return the choiceInstances
     *
     * @JsonIgnore
     * public List<ChoiceInstance> getChoiceInstances() {
     * return currentResult.getChoiceInstances();
     * }
     */

    /*
    public void addChoiceInstance(ChoiceInstance choiceInstance) {
        CurrentResult cr = this.getCurrentResult();
        if (!cr.getChoiceInstances().contains(choiceInstance)) {
            cr.getChoiceInstances().add(choiceInstance);
        }
    }
     */
 /*
    public boolean removeChoiceInstance(ChoiceInstance choiceInstance) {
        return this.getCurrentResult().remove(choiceInstance);
    }
     */

 /*
    public CurrentResult getCurrentResult() {
        if (this.currentResult == null) {
            this.currentResult = new CurrentResult();
            this.currentResult.setResult(this);
        }

        return currentResult;
    }
     */
 /*
    public Replies getReplies() {
        return replies;
    }
     */

 /*
    public void addReply(Reply reply) {
        if (replies == null) {
            replies = new Replies();
            replies.setResult(this);
        }
        return replies;
    }

    public void addReply(Reply reply) {

        this.getReplies().add(reply);
    }
     */

 /*
    void removeReply(Reply reply) {
        this.getReplies().remove(reply);
    }
     */
    @Override
    public void updateCacheOnDelete(Beanjection beans) {
        VariableInstanceFacade vif = beans.getVariableInstanceFacade();

        // JPA query to fetch ChoiceInstance ci
        Collection<ChoiceInstance> choiceInstances = beans.getQuestionDescriptorFacade().getChoiceInstancesByResult(this);

        // clear currentResult
        for (ChoiceInstance cInstance : choiceInstances) {
            if (cInstance != null) {
                cInstance = (ChoiceInstance) vif.find(cInstance.getId());
                if (cInstance != null) {
                    cInstance.setCurrentResult(null);
                }
            }
        }

        // Destroy replies
        beans.getQuestionDescriptorFacade().cascadeDelete(this);
    }

    @Override
    public WithPermission getMergeableParent() {
        return getChoiceDescriptor();
    }

    @Override
    public Collection<WegasPermission> getRequieredUpdatePermission() {
        Collection<WegasPermission> perms = this.getMergeableParent().getRequieredUpdatePermission();
        // see issue #1441
        perms.add(this.getParentGameModel().getAssociatedTranslatePermission(""));
        return perms;
    }

    @Override
    public Collection<WegasPermission> getRequieredReadPermission() {
        return this.getChoiceDescriptor().getRequieredReadPermission();
    }

    /*
    @PrePersist
    private void prePersist() {
        this.getReplies();
        this.getCurrentResult();
    }
     */
}
