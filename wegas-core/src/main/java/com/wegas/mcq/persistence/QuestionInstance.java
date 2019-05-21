/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2018 School of Business and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.mcq.persistence;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.wegas.core.Helper;
import com.wegas.core.persistence.EntityComparators;
import com.wegas.core.persistence.InstanceOwner;
import com.wegas.core.persistence.game.Player;
import com.wegas.core.persistence.annotations.WegasEntityProperty;
import com.wegas.core.persistence.variable.VariableInstance;
import com.wegas.editor.ValueGenerators.False;
import com.wegas.editor.ValueGenerators.True;
import com.wegas.editor.View.Hidden;
import com.wegas.editor.View.View;
import static java.lang.Boolean.FALSE;
import java.util.ArrayList;
import java.util.List;
import javax.persistence.Column;
import javax.persistence.Entity;

/**
 * @author Francois-Xavier Aeberhard (fx at red-agent.com)
 */
@Entity
public class QuestionInstance extends VariableInstance implements ReadableInstance {

    private static final long serialVersionUID = 1L;
    //private static final Logger logger = LoggerFactory.getLogger(QuestionInstance.class);

    /**
     *
     */
    @WegasEntityProperty(proposal = True.class, view = @View(label = "Active"))
    private Boolean active = true;
    /**
     *
     */
    @WegasEntityProperty(proposal = True.class,
            view = @View(label = "Unread", value = Hidden.class))
    private Boolean unread = true;
    /**
     * False until the user has clicked on the global question-wide "submit"
     * button.
     */
    @Column(columnDefinition = "boolean default false")
    @WegasEntityProperty(
            proposal = False.class,
            view = @View(label = "Validated", value = Hidden.class))
    private Boolean validated = FALSE;

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

    /**
     * get all, only validated or only not validated replies
     *
     * @param p
     * @param validatedFilter true : only validated, false: only not validated; null:both
     *
     * @return
     */
    public List<Reply> getReplies(Player p, Boolean validatedFilter) {
        List<Reply> replies = new ArrayList<>();
        QuestionDescriptor qD = (QuestionDescriptor) this.findDescriptor();

        for (ChoiceDescriptor cd : qD.getItems()) {
            if (this.isDefaultInstance()) {
                replies.addAll(cd.getDefaultInstance().getReplies(validatedFilter));
            } else {
                replies.addAll(cd.getInstance(p).getReplies(validatedFilter));
            }
        }

        return replies;
    }

    public List<Reply> getReplies(Player p) {
        return this.getReplies(p, null);
    }

    @JsonIgnore
    public List<Reply> getReplies() {
        InstanceOwner owner = this.getOwner();
        return this.getReplies(owner != null ? owner.getAnyLivePlayer() : null);
    }

    public void setReplies(List<Reply> replies) {
    }

    /**
     * @return the unread
     */
    @Override
    public Boolean isUnread() {
        return this.unread;
    }

    /**
     * @param unread the unread to set
     */
    @Override
    public void setUnread(Boolean unread) {
        this.unread = unread;
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

    /**
     *
     */
    public void deactivate() {
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
    public Boolean isValidated() {
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
        Integer maxReplies = qd.getMaxReplies();
        // the question must be selectable
        boolean selectable = (qd.getCbx() && !this.isValidated()) // a not yet validated cbx question
                || maxReplies == null // OR number of answers is unlimited
                || this.getReplies().size() < maxReplies; // OR maximum number not reached
        if (selectable) {
            //and at least one choice should bee selectable too
            InstanceOwner owner = this.getOwner();
            Player p = owner != null ? owner.getAnyLivePlayer() : null;

            for (ChoiceDescriptor cd : qd.getItems()) {
                if (cd.isSelectable(p)) {
                    // at least 1 choice is still selectable -> OK
                    return true;
                }
            }
            // no selectable left
            return false;
        }
        return selectable;
    }
}
