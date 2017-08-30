/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2017 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.mcq.persistence;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.wegas.core.Helper;
import com.wegas.core.exception.client.WegasIncompatibleType;
import com.wegas.core.persistence.AbstractEntity;
import com.wegas.core.persistence.EntityComparators;
import com.wegas.core.persistence.game.Player;
import com.wegas.core.merge.annotations.WegasEntityProperty;
import com.wegas.core.persistence.variable.VariableInstance;
import javax.persistence.Entity;
import javax.persistence.Table;
import java.util.ArrayList;
import java.util.List;

import static java.lang.Boolean.FALSE;
import javax.persistence.Column;

/**
 * @author Francois-Xavier Aeberhard (fx at red-agent.com)
 */
@Entity
@Table(name = "MCQQuestionInstance")
public class QuestionInstance extends VariableInstance {

    private static final long serialVersionUID = 1L;
    //private static final Logger logger = LoggerFactory.getLogger(QuestionInstance.class);

    /**
     *
     */
    @WegasEntityProperty
    private Boolean active = true;
    /**
     *
     */
    @WegasEntityProperty
    private Boolean unread = true;
    /**
     * False until the user has clicked on the global question-wide "submit"
     * button.
     */
    @Column(columnDefinition = "boolean default false")
    @WegasEntityProperty
    private Boolean validated = FALSE;


    /**
     * @return the active
     */
    public Boolean getActive() {
        return active;
    }

    /**
     * @param active the active to set
     */
    public void setActive(Boolean active) {
        this.active = active;
    }

    /**
     * @return unmodifiable reply list, ordered by createdTime
     */
    @JsonIgnore
    public List<Reply> getSortedReplies() {
        return Helper.copyAndSort(this.getReplies(), new EntityComparators.CreateTimeComparator<>());
    }

    @JsonIgnore
    public List<Reply> getSortedReplies(Player p) {
        return Helper.copyAndSort(this.getReplies(p), new EntityComparators.CreateTimeComparator<>());
    }

    public List<Reply> getReplies(Player p) {
        List<Reply> replies = new ArrayList<>();
        QuestionDescriptor qD = (QuestionDescriptor) this.findDescriptor();

        for (ChoiceDescriptor cd : qD.getItems()) {
            if (this.isDefaultInstance()) {
                replies.addAll(cd.getDefaultInstance().getReplies());
            } else {
                replies.addAll(cd.getInstance(p).getReplies());
            }
        }

        return replies;
    }

    @JsonIgnore
    public List<Reply> getReplies() {
        List<Reply> replies = new ArrayList<>();
        QuestionDescriptor qD = (QuestionDescriptor) this.findDescriptor();

        for (ChoiceDescriptor cd : qD.getItems()) {
            if (this.isDefaultInstance()) {
                replies.addAll(cd.getDefaultInstance().getReplies());
            } else {
                replies.addAll(cd.getInstance().getReplies());
            }
        }

        return replies;
    }

    public void setReplies(List<Reply> replies) {
    }

    /**
     * @return the unread
     */
    public Boolean getUnread() {
        return this.unread;
    }

    /**
     * @param unread the unread to set
     */
    public void setUnread(Boolean unread) {
        this.unread = unread;
    }

    // *** Sugar *** //
    /**
     *
     */
    public void activate() {
        this.setActive(true);
    }

    /**
     *
     */
    public void desactivate() {
        this.setActive(false);
    }

    /**
     * @param validated the validation status to set
     */
    public void setValidated(Boolean validated) {
        this.validated = validated;
    }

    /**
     * @return The validation status of the question
     */
    public Boolean getValidated() {
        return this.validated;
    }

    /**
     * @param index
     *
     * @return iest choiceDescriptor
     */
    public ChoiceDescriptor item(int index) {
        return ((QuestionDescriptor) this.getDescriptor()).item(index);
    }

    @JsonIgnore
    public boolean isSelectable() {
        QuestionDescriptor qd = (QuestionDescriptor) this.findDescriptor();
        return (qd.getCbx() && !this.getValidated()) // a not yet validated cbx question
                || qd.getAllowMultipleReplies() // OR several answers are allowed 
                || this.getReplies().isEmpty(); // OR no reply yet
    }
}
