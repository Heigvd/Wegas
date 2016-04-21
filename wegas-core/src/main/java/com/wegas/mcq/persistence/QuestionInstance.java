/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013, 2014, 2015 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.mcq.persistence;

import com.wegas.core.persistence.AbstractEntity;
import com.wegas.core.persistence.variable.VariableInstance;
import java.util.ArrayList;
import java.util.List;
import javax.persistence.CascadeType;
import javax.persistence.Entity;
import javax.persistence.OneToMany;
import javax.persistence.Table;
import com.fasterxml.jackson.annotation.JsonManagedReference;
import com.wegas.core.exception.client.WegasIncompatibleType;
import static java.lang.Boolean.FALSE;
import javax.persistence.OrderBy;
import org.eclipse.persistence.annotations.BatchFetch;
import org.eclipse.persistence.annotations.BatchFetchType;

/**
 *
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
@Entity
@Table(name = "MCQQuestionInstance")
public class QuestionInstance extends VariableInstance {

    private static final long serialVersionUID = 1L;
    //private static final Logger logger = LoggerFactory.getLogger(QuestionInstance.class);
    /**
     *
     */
    @OneToMany(mappedBy = "questionInstance", cascade = {CascadeType.ALL}, orphanRemoval = true)
    @BatchFetch(BatchFetchType.JOIN)
    @JsonManagedReference
    //@JoinFetch
    @OrderBy("id ASC")
    private List<Reply> replies = new ArrayList<>();
    /**
     *
     */
    private Boolean active = true;
    /**
     *
     */
    private Boolean unread = true;
    /**
     * False until the user has clicked on the global question-wide "submit"
     * button.
     */
    private Boolean validated = FALSE;

    /**
     *
     * @param a
     */
    @Override
    public void merge(AbstractEntity a) {
        if (a instanceof QuestionInstance) {
            QuestionInstance other = (QuestionInstance) a;
            this.setActive(other.getActive());
            this.setUnread(other.getUnread());
            Boolean v = other.getValidated();
            this.setValidated(v);
            this.setReplies(new ArrayList<>()); //@TODO merge them
            this.addReplies(other.getReplies());
        } else {
            throw new WegasIncompatibleType(this.getClass().getSimpleName() + ".merge (" + a.getClass().getSimpleName() + ") is not possible");
        }
    }

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
     * @return the replies
     */
    @JsonManagedReference
    public List<Reply> getReplies() {
        return replies;
    }

    /**
     * @param replies the replies to set
     */
    @JsonManagedReference
    public void setReplies(List<Reply> replies) {
        this.replies = replies;
    }

    /**
     *
     * @param reply
     */
    public void addReply(Reply reply) {
        this.getReplies().add(reply);
        reply.setQuestionInstance(this);
    }

    /**
     *
     * @param replies
     */
    public void addReplies(List<Reply> replies) {
        for (Reply r : replies) {
            this.addReply(r);
        }
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
     *
     * @param index
     * @return
     */
    public ChoiceDescriptor item(int index) {
        return ((QuestionDescriptor) this.getDescriptor()).item(index);
    }
}
