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
import com.wegas.core.Helper;
import com.wegas.core.ejb.VariableInstanceFacade;
import com.wegas.core.persistence.annotations.WegasEntityProperty;
import com.wegas.core.persistence.annotations.WegasExtraProperty;
import com.wegas.core.i18n.persistence.TranslatableContent;
import com.wegas.core.persistence.AbstractEntity;
import com.wegas.core.persistence.DatedEntity;
import com.wegas.core.persistence.WithPermission;
import com.wegas.core.persistence.variable.Beanjection;
import com.wegas.core.rest.util.Views;
import com.wegas.core.security.util.WegasPermission;
import com.wegas.editor.View.I18nHtmlView;
import com.wegas.editor.View.ReadOnlyNumber;
import com.wegas.editor.View.ReadOnlyString;
import com.wegas.editor.View.View;
import java.util.Collection;
import java.util.Date;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import javax.persistence.*;

/**
 * @author Francois-Xavier Aeberhard (fx at red-agent.com)
 */
@Entity
@JsonTypeName(value = "Reply")
@Table(name = "MCQReply", indexes = {
    @Index(columnList = "choiceinstance_id"),
    @Index(columnList = "result_id")
})
@NamedQueries({
    @NamedQuery(name = "Reply.findByResultId", query = "SELECT r FROM Reply r WHERE r.result.id = :resultId")
})
public class Reply extends AbstractEntity implements DatedEntity {

    private static final long serialVersionUID = 1L;
    /**
     *
     */
    @Id
    @GeneratedValue
    @JsonView(Views.IndexI.class)
    private Long id;

    @Temporal(TemporalType.TIMESTAMP)
    @Column(columnDefinition = "timestamp with time zone")
    @WegasEntityProperty(optional = false, nullable = false,
            view = @View(label = "Created Time", value = ReadOnlyNumber.class))
    private Date createdTime = new Date();
    /**
     * <p>
     */
    @WegasEntityProperty(
            optional = false, nullable = false,
            view = @View(label = "Start Time", value = ReadOnlyNumber.class))
    private Long startTime;
    /**
     *
     */
    @Column(columnDefinition = "boolean default false")
    @WegasEntityProperty(view = @View(label = "Unread"),
            optional = false, nullable = false
    )
    private Boolean unread = false;
    /**
     *
     */
    @Column(columnDefinition = "boolean default false")
    @WegasEntityProperty(view = @View(label = "Ignored"),
            optional = false, nullable = false
    )
    private Boolean ignored = false;

    /**
     *
     */
    @Column(columnDefinition = "boolean default false")
    @WegasEntityProperty(
            optional = false, nullable = false,
            view = @View(label = "Validated"))
    private Boolean validated = false;
    /**
     *
     */
    @ManyToOne(optional = false)
    private Result result;

    @Transient
    @WegasEntityProperty(
            optional = false, nullable = false,
            view = @View(label = "Result Name", value = ReadOnlyString.class))
    private String resultName;

    @Transient
    @WegasEntityProperty(optional = false, nullable = false,
            view = @View(label = "Choice Name", value = ReadOnlyString.class))
    private String choiceName;

    /**
     *
     */
    @ManyToOne(optional = false)
    @JoinColumn(nullable = false)
    @JsonBackReference
    private ChoiceInstance choiceInstance;

    /**
     * @return the ignored status.
     */
    public Boolean getIgnored() {
        return ignored;
    }

    /**
     * @param ignored the ignored status to set.
     */
    public void setIgnored(Boolean ignored) {
        this.ignored = ignored;
    }

    /**
     * Is the reply validated.
     * <p>
     * impact (or ignoreationImapct in ignored rely case) of a validated reply has been applied
     *
     * @return
     */
    public Boolean isValidated() {
        return validated;
    }

    /**
     * Set validated
     *
     * @param validated
     */
    public void setValidated(Boolean validated) {
        this.validated = validated;
    }

    @Override
    public Long getId() {
        return this.id;
    }

    /**
     * @return the createdTime
     */
    @Override
    public Date getCreatedTime() {
        return createdTime != null ? new Date(createdTime.getTime()) : null;
    }

    /**
     * @param createdTime the createdTime to set
     */
    public void setCreatedTime(Date createdTime) {
        this.createdTime = createdTime != null ? new Date(createdTime.getTime()) : null;
    }

    /**
     * @return the MCQDescriptor
     */
    @JsonIgnore
    @JsonBackReference
    public ChoiceInstance getChoiceInstance() {
        return choiceInstance;
    }

    /**
     * @param choiceInstance
     */
    @JsonBackReference
    public void setChoiceInstance(ChoiceInstance choiceInstance) {
        this.choiceInstance = choiceInstance;
    }

    public String getChoiceName() {
        if (!Helper.isNullOrEmpty(choiceName)) {
            return choiceName;
        }
        if (this.getResult() != null && this.getResult().getChoiceDescriptor() != null) {
            return this.getResult().getChoiceDescriptor().getName();
        } else {
            return null;
        }
    }

    public void setChoiceName(String choiceName) {
        this.choiceName = choiceName;
    }

    public String getResultName() {
        if (resultName != null) {
            // for backward compat, empty string is a valid result name
            return resultName;
        }
        if (this.getResult() != null) {
            return this.getResult().getName();
        } else {
            return null;
        }
    }

    public void setResultName(String resultName) {
        this.resultName = resultName;
    }

    /**
     * @return true if the reply has not yet been read by a player
     */
    public Boolean getUnread() {
        return unread;
    }

    /**
     * @param unread
     */
    public void setUnread(Boolean unread) {
        this.unread = unread;
    }

    /**
     * @return the startTime
     */
    public Long getStartTime() {
        return startTime;
    }

    /**
     * @param startTime the startTime to set
     */
    public void setStartTime(Long startTime) {
        this.startTime = startTime;
    }

    /**
     * @return the result
     */
    @JsonIgnore
    public Result getResult() {
        return result;
    }

    public void setResult(Result r) {
        this.result = r;
        this.setResultName(null);
        this.setChoiceName(null);
    }

    @WegasExtraProperty(view = @View(label = "Answer", value = I18nHtmlView.class))
    public TranslatableContent getAnswer() {
        if (result != null && this.isValidated()) {
            return result.getAnswer();
        } else {
            return null;
        }
    }

    public void setAnswer(Object answer) {
        // Make Jackson happy
    }

    @WegasExtraProperty(view = @View(label = "Ignoration Answer", value = I18nHtmlView.class))
    public TranslatableContent getIgnorationAnswer() {
        if (result != null && this.isValidated()) {
            return result.getIgnorationAnswer();
        } else {
            return null;
        }
    }

    public void setIgnorationAnswer(Object answer) {
        // Make Jackson happy
    }

    @WegasExtraProperty(view = @View(label = "Files"))
    public Set<String> getFiles() {
        if (result != null && this.isValidated()) {
            return result.getFiles();
        } else {
            return new HashSet<>();
        }
    }

    public void setFiles(List<String> files) {
        // Make Jackson happy
    }

    @Override
    public void updateCacheOnDelete(Beanjection beans) {
        VariableInstanceFacade vif = beans.getVariableInstanceFacade();
        ChoiceInstance cInst = this.getChoiceInstance();
        if (cInst != null) {
            cInst = (ChoiceInstance) vif.find(cInst.getId());
            if (cInst != null) {
                cInst.removeReply(this);
            }
        }

        /*
        QuestionDescriptorFacade qF = beans.getQuestionDescriptorFacade();
        Result theResult = this.getResult();
        if (theResult != null) {
            theResult = qF.findResult(theResult.getId());
            if (theResult != null) {
                theResult.removeReply(this);
            }
        }
         */
        super.updateCacheOnDelete(beans);
    }

    @Override
    public WithPermission getMergeableParent() {
        return getChoiceInstance();
    }

    @Override
    public Collection<WegasPermission> getRequieredUpdatePermission() {
        return this.getChoiceInstance().getRequieredUpdatePermission();
    }

    @Override
    public Collection<WegasPermission> getRequieredReadPermission() {
        return this.getChoiceInstance().getRequieredReadPermission();
    }
}
