/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2018 School of Business and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.mcq.persistence;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonManagedReference;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.wegas.core.Helper;
import com.wegas.core.exception.client.WegasErrorMessage;
import com.wegas.core.exception.internal.WegasNoResultException;
import com.wegas.core.persistence.annotations.WegasEntityProperty;
import com.wegas.core.persistence.ListUtils;
import com.wegas.core.persistence.variable.Beanjection;
import com.wegas.core.persistence.variable.VariableInstance;
import com.wegas.editor.View.EntityArrayFiledSelect;
import com.wegas.editor.View.Hidden;
import com.wegas.editor.View.View;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;
import javax.persistence.*;
import org.eclipse.persistence.annotations.BatchFetch;
import org.eclipse.persistence.annotations.BatchFetchType;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 *
 * @author Francois-Xavier Aeberhard (fx at red-agent.com)
 */
@Entity
@Table(indexes = {
    @Index(columnList = "currentresult_id")
})
@NamedQueries({
    @NamedQuery(name = "ChoiceInstance.findByResultId", query = "SELECT ci FROM ChoiceInstance ci WHERE ci.currentResult.id = :resultId")
})
public class ChoiceInstance extends VariableInstance implements ReadableInstance {

    private static final long serialVersionUID = 1L;

    private static final Logger logger = LoggerFactory.getLogger(ChoiceInstance.class);

    /**
     *
     */
    @WegasEntityProperty(view = @View(label = "Active from start"))
    private Boolean active = true;
    /**
     *
     */
    @WegasEntityProperty(view = @View(label = "Unread", value = Hidden.class))
    private Boolean unread = true;
    /**
     *
     * @ManyToOne(fetch = FetchType.LAZY)
     * @JsonIgnore
     * private CurrentResult currentResult;
     */

    /**
     *
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JsonIgnore
    private Result currentResult;

    /**
     *
     */
    @OneToMany(mappedBy = "choiceInstance", cascade = {CascadeType.ALL}, orphanRemoval = true)
    @BatchFetch(BatchFetchType.JOIN)
    @JsonManagedReference
    //@JoinFetch
    @WegasEntityProperty(view = @View(label = "Replies", value = Hidden.class))
    private List<Reply> replies = new ArrayList<>();

    /**
     *
     */
    @Transient
    @WegasEntityProperty(view = @View(label = "Default result", value = EntityArrayFiledSelect.ResultsSelect.class))
    private String currentResultName;

    @Transient
    /**
     * @deprecated
     */
    @WegasEntityProperty(view = @View(label = "deprecated current result index", value = Hidden.class))
    private Integer currentResultIndex = null;

    public ChoiceInstance() {
    }

    /**
     * get the result to apply if the choice is selected. Either the
     * currentResult if defined, the first otherwise
     *
     * @return the currentResult or the first one
     *
     * @throws WegasErrorMessage if not result are defined
     */
    @JsonIgnore
    public Result getResult() {
        if (this.getCurrentResult() != null) {
            return this.getCurrentResult();
        } else {
            try {
                return ((ChoiceDescriptor) this.getDescriptor()).getResults().get(0);
            } catch (ArrayIndexOutOfBoundsException ex) {
                //return null;
                throw WegasErrorMessage.error("No result found for choice \"" + this.getDescriptor().getLabel() + "\"");
            }
        }
    }

    /**
     * @return the currentResultName
     */
    public String getCurrentResultName() {
        if (!Helper.isNullOrEmpty(currentResultName)) {
            return currentResultName;
        } else if (this.getCurrentResult() != null) {
            return getCurrentResult().getName();
        } else {
            return null;
        }
    }

    /**
     * @param currentResultName
     */
    public void setCurrentResultName(String currentResultName) {
        if (!Objects.equals(this.getCurrentResultName(), currentResultName)) {
            this.currentResultName = currentResultName;

            if (!Helper.isNullOrEmpty(this.currentResultName)) {
                ChoiceDescriptor choiceDesc = (ChoiceDescriptor) this.findDescriptor();
                if (choiceDesc != null) {
                    try {
                        Result newResult = choiceDesc.getResultByName(this.currentResultName);
                        // Result found -> set it and clear the transient name
                        this.setCurrentResult(newResult);
                        this.currentResultName = null;
                    } catch (WegasNoResultException ex) {
                        // not found, clear currentResult but not currentResultName
                        this.currentResult = null;
                    }
                }

            } else {
                //Name and currentResult are null
                this.currentResult = null;
            }
        }
    }

    /**
     * @deprecated
     * @return the currentResult index
     */
    @JsonIgnore
    public Integer getCurrentResultIndex() {
        return currentResultIndex;
    }

    /**
     * @deprecated
     */
    @JsonProperty
    public void setCurrentResultIndex(Integer index) {
        this.currentResultIndex = index;
    }

    /**
     * @return the active
     */
    @Override
    public Boolean getActive() {
        return active;
    }

    /**
     * @param active the active to set
     */
    @Override
    public void setActive(Boolean active) {
        this.active = active;
    }

    /**
     * @return the unread
     */
    @Override
    public Boolean isUnread() {
        return unread;
    }

    /**
     * @param unread the unread to set
     */
    @Override
    public void setUnread(Boolean unread) {
        this.unread = unread;
    }

    /**
     * @return the replies
     */
    @JsonManagedReference
    public List<Reply> getReplies() {
        return replies;
    }

    public List<Reply> getReplies(Boolean validatedFilter) {
        List<Reply> subReplies = new ArrayList<>();

        if (validatedFilter != null) {
            for (Reply r : replies) {
                if (validatedFilter.equals(r.isValidated())) {
                    subReplies.add(r);
                }
            }
        } else {
            subReplies.addAll(replies);
        }
        return subReplies;
    }

    /**
     * @param replies the replies to set
     */
    @JsonManagedReference
    public void setReplies(List<Reply> replies) {
        this.replies = replies;
        for (Reply r : this.replies) {
            r.setChoiceInstance(this);
        }
    }

    /**
     * @param reply
     */
    public void addReply(Reply reply) {
        reply.setChoiceInstance(this);
        this.setReplies(ListUtils.cloneAdd(this.getReplies(), reply));
    }

    void removeReply(Reply reply) {
        this.replies.remove(reply);
    }

    /**
     * @param replies
     */
    public void addReplies(List<Reply> replies) {
        for (Reply r : replies) {
            this.addReply(r);
        }
    }

    // ~~~ Sugar ~~~
    /**
     *
     */
    public void activate() {
        this.setActive(true);
    }

    /**
     *
     */
    @Deprecated
    public void desactivate() {
        this.deactivate();
    }

    public void deactivate() {
        this.setActive(false);
    }

    /**
     * @return the currentResult
     */
    @JsonIgnore
    public Result getCurrentResult() {
        return this.currentResult;
    }

    /**
     * @param currentResult the currentResult to set
     */
    public void setCurrentResult(Result currentResult) {
        this.currentResult = currentResult;
        if (currentResult != null) {
            // do not need the name anylonger
            this.currentResultName = null;
        }
    }

    /*
    @Override
    public void updateCacheOnDelete(Beanjection beans) {
        Result cr = this.getCurrentResult();
        if (cr != null) {
            ChoiceDescriptor cd = cr.getChoiceDescriptor();
            if (cd != null) {
                VariableDescriptorFacade vdf = beans.getVariableDescriptorFacade();
                cd = (ChoiceDescriptor) vdf.find(cd.getId());
                if (cd != null) {
                    try {
                        cr = cd.getResultByName(cr.getName());
                        cr.removeChoiceInstance(this);
                    } catch (WegasNoResultException ex) {
                    }

                }
            }
        }

        super.updateCacheOnDelete(beans);
    }*/
    @Override
    public void revive(Beanjection beans) {
        beans.getQuestionDescriptorFacade().reviveChoiceInstance(this);
    }
}
