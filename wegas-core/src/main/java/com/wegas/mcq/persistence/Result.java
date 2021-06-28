/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.mcq.persistence;

import static ch.albasim.wegas.annotations.CommonView.FEATURE_LEVEL.ADVANCED;
import ch.albasim.wegas.annotations.View;
import ch.albasim.wegas.annotations.WegasEntityProperty;
import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonView;
import com.wegas.core.ejb.RequestManager.RequestContext;
import com.wegas.core.ejb.VariableInstanceFacade;
import com.wegas.core.i18n.persistence.TranslatableContent;
import com.wegas.core.persistence.AbstractEntity;
import com.wegas.core.persistence.LabelledEntity;
import com.wegas.core.persistence.Orderable;
import com.wegas.core.persistence.WithPermission;
import com.wegas.core.persistence.annotations.WegasConditions.And;
import com.wegas.core.persistence.annotations.WegasConditions.IsDefined;
import com.wegas.core.persistence.annotations.WegasConditions.IsTrue;
import com.wegas.core.persistence.annotations.WegasConditions.Not;
import com.wegas.core.persistence.annotations.WegasRefs.Field;
import com.wegas.core.persistence.game.Script;
import com.wegas.core.persistence.variable.Beanjection;
import com.wegas.core.persistence.variable.VariableInstance;
import com.wegas.core.rest.util.Views;
import com.wegas.core.security.util.WegasPermission;
import com.wegas.editor.ValueGenerators.EmptyArray;
import com.wegas.editor.ValueGenerators.EmptyI18n;
import com.wegas.editor.ValueGenerators.EmptyScript;
import com.wegas.editor.ValueGenerators.Zero;
import com.wegas.editor.Visible;
import com.wegas.editor.view.Hidden;
import com.wegas.editor.view.I18nHtmlView;
import com.wegas.editor.view.I18nStringView;
import com.wegas.editor.view.NumberView;
import com.wegas.editor.view.ScriptView;
import java.util.Collection;
import java.util.HashSet;
import java.util.Set;
import javax.persistence.AttributeOverride;
import javax.persistence.AttributeOverrides;
import javax.persistence.CascadeType;
import javax.persistence.Column;
import javax.persistence.ElementCollection;
import javax.persistence.Embedded;
import javax.persistence.Entity;
import javax.persistence.GeneratedValue;
import javax.persistence.Id;
import javax.persistence.Index;
import javax.persistence.ManyToOne;
import javax.persistence.NamedQuery;
import javax.persistence.OneToOne;
import javax.persistence.Table;
import javax.persistence.UniqueConstraint;
import javax.persistence.Version;

/**
 * @author Francois-Xavier Aeberhard (fx at red-agent.com)
 */
@Entity
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
@NamedQuery(name = "Result.findByName", query = "SELECT DISTINCT res FROM Result res WHERE res.choiceDescriptor.id=:choicedescriptorId AND res.name LIKE :name")
public class Result extends AbstractEntity implements LabelledEntity, Orderable {

    private static final long serialVersionUID = 1L;

    @Version
    @Column(columnDefinition = "bigint default '0'::bigint")
    @WegasEntityProperty(
        nullable = false, optional = false, proposal = Zero.class,
        sameEntityOnly = true, view = @View(
            index = 0,
            label = "Version",
            readOnly = true,
            value = NumberView.class,
            featureLevel = ADVANCED
        ))
    private Long version;

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
    @WegasEntityProperty(searchable = true,
        nullable = false,
        view = @View(
            index = 1,
            label = "Script alias",
            featureLevel = ADVANCED,
            description = "Changing this may break your scripts! Use alphanumeric characters,'_','$'. No digit as first character."
        ))
    @Visible(HasMultipleResult.class)
    private String name;

    /**
     * Displayed name
     */
    @OneToOne(cascade = CascadeType.ALL, orphanRemoval = true)
    @WegasEntityProperty(
        optional = false, nullable = false, proposal = EmptyI18n.class,
        view = @View(index = 2, label = "Label", value = I18nStringView.class))
    @Visible(HasMultipleResult.class)
    private TranslatableContent label;

    /**
     * Displayed answer when result selected and validated
     */
    @OneToOne(cascade = CascadeType.ALL, orphanRemoval = true)
    @WegasEntityProperty(
        optional = false, nullable = false, proposal = EmptyI18n.class,
        view = @View(index = 3, label = "Feedback", value = I18nHtmlView.class))
    private TranslatableContent answer;

    /**
     * Displayed answer when MCQ result not selected and validated
     */
    @OneToOne(cascade = CascadeType.ALL, orphanRemoval = true)
    @WegasEntityProperty(
        optional = false, nullable = false, proposal = EmptyI18n.class,
        view = @View(
            index = 4,
            label = "Feedback when ignored",
            value = I18nHtmlView.class,
            borderTop = true
        ))
    @Visible(IsQuestionCbx.class)
    private TranslatableContent ignorationAnswer;

    @JsonIgnore
    private Integer index;

    /*
     *
     */
    @ElementCollection
    @WegasEntityProperty(view = @View(label = "Files", value = Hidden.class),
        optional = false, nullable = false, proposal = EmptyArray.class)
    private Set<String> files = new HashSet<>();
    /**
     *
     */
    @Embedded
    @JsonView(Views.EditorI.class)
    @WegasEntityProperty(
        optional = false, nullable = false, proposal = EmptyScript.class,
        view = @View(label = "Impact", value = ScriptView.Impact.class))
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
    @WegasEntityProperty(
        optional = false, nullable = false, proposal = EmptyScript.class,
        view = @View(label = "Impact when ignored", value = ScriptView.Impact.class))
    @Visible(IsQuestionCbx.class)
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
        // useless but ensure there is an empty constructor
    }

    @Override
    public Long getId() {
        return this.id;
    }

    @Override
    @JsonIgnore
    public Integer getOrder() {
        return getIndex();
    }

    public Integer getIndex() {
        return index;
    }

    public void setIndex(Integer index) {
        this.index = index;
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
        if (this.choiceDescriptor != null) {
            if (this.getLabel() != null) {
                this.getLabel().setParentDescriptor(choiceDescriptor);
            }
            if (this.getAnswer() != null) {
                this.getAnswer().setParentDescriptor(choiceDescriptor);
            }
            if (this.getIgnorationAnswer() != null) {
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

    private void touchImpact() {
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

    private void touchIgnorationImpact() {
        if (this.ignorationImpact != null) {
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
    public Long getVersion() {
        return version;
    }

    public void setVersion(Long version) {
        this.version = version;
    }

    @Override
    public void updateCacheOnDelete(Beanjection beans) {
        VariableInstanceFacade vif = beans.getVariableInstanceFacade();

        // JPA query to fetch ChoiceInstance ci
        Collection<ChoiceInstance> choiceInstances = beans.getQuestionDescriptorFacade().getChoiceInstancesByResult(this);

        // clear currentResult
        for (ChoiceInstance cInstance : choiceInstances) {
            if (cInstance != null) {
                VariableInstance instance = vif.find(cInstance.getId());
                if (instance instanceof ChoiceInstance) {
                    ((ChoiceInstance) instance).setCurrentResult(null);
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
    public Collection<WegasPermission> getRequieredUpdatePermission(RequestContext context) {
        Collection<WegasPermission> perms = this.getMergeableParent().getRequieredUpdatePermission(context);
        // see issue #1441
        perms.add(this.getParentGameModel().getAssociatedTranslatePermission(""));
        return perms;
    }

    @Override
    public Collection<WegasPermission> getRequieredReadPermission(RequestContext context) {
        return this.getChoiceDescriptor().getRequieredReadPermission(context);
    }

    /*
    @PrePersist
    private void prePersist() {
        this.getReplies();
        this.getCurrentResult();
    }
     */
    public static class HasMultipleResult extends Not {

        public HasMultipleResult() {
            // hide the label if the result stands in a singleResultChoiceDescriptor
            // -> display it only if parent is not a srcd
            super(new IsDefined(new Field(SingleResultChoiceDescriptor.class, null)));
        }
    }

    public static class IsQuestionCbx extends And {

        public IsQuestionCbx() {
            super(
                new IsDefined(new Field(QuestionDescriptor.class, "cbx")),
                new IsTrue(new Field(QuestionDescriptor.class, "cbx"))
            );
        }
    }

}
