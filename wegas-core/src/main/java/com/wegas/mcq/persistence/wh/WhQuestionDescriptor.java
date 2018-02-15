/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2018 School of Business and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.mcq.persistence.wh;

import com.wegas.core.Helper;
import com.wegas.core.exception.client.WegasIncompatibleType;
import com.wegas.core.persistence.AbstractEntity;
import com.wegas.core.persistence.ListUtils;
import com.wegas.core.persistence.game.Player;
import com.wegas.core.persistence.variable.Beanjection;
import com.wegas.core.persistence.variable.VariableDescriptor;
import com.wegas.reviewing.persistence.evaluation.EvaluationDescriptor;
import java.util.ArrayList;
import java.util.List;
import javax.persistence.Basic;
import javax.persistence.CascadeType;
import javax.persistence.Entity;
import javax.persistence.FetchType;
import javax.persistence.Lob;
import javax.persistence.OneToMany;

/**
 *
 * @author Maxence
 */
@Entity
public class WhQuestionDescriptor extends VariableDescriptor<WhQuestionInstance> {

    private static final long serialVersionUID = 1L;
    /**
     *
     */
    @Lob
    @Basic(fetch = FetchType.EAGER) // CARE, lazy fetch on Basics has some trouble.
    private String description;

    @OneToMany(mappedBy = "whQuestionContainer", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<EvaluationDescriptor> answers = new ArrayList<>();


    /**
     * @return the description
     */
    public String getDescription() {
        return description;
    }

    /**
     * @param description the description to set
     */
    public void setDescription(String description) {
        this.description = description;
    }

    public List<EvaluationDescriptor> getAnswers() {
        return answers;
    }

    public void setAnswers(List<EvaluationDescriptor> answers) {
        this.answers = answers;
    }

    /**
     *
     * @param a
     */
    @Override
    public void merge(AbstractEntity a) {
        if (a instanceof WhQuestionDescriptor) {
            super.merge(a);
            WhQuestionDescriptor other = (WhQuestionDescriptor) a;
            this.setDescription(other.getDescription());
            this.setAnswers(ListUtils.mergeLists(this.getAnswers(), other.getAnswers()));
        } else {
            throw new WegasIncompatibleType(this.getClass().getSimpleName() + ".merge (" + a.getClass().getSimpleName() + ") is not possible");
        }
    }

// ~~~ Sugar for scripts ~~~
    /**
     *
     * @param p
     * @param value
     */
    public void setActive(Player p, boolean value) {
        this.getInstance(p).setActive(value);
    }

    /**
     *
     * @param p
     *
     * @return the player instance active status
     */
    public boolean isActive(Player p) {
        WhQuestionInstance instance = this.getInstance(p);
        return instance.getActive();
    }

    /**
     *
     * @param p
     */
    public void activate(Player p) {
        this.setActive(p, true);
    }

    /**
     *
     * @param p
     */
    public void desactivate(Player p) {
        this.setActive(p, false);
    }

    /**
     *
     * @param p
     *
     * @return true if the player has already answers this question
     */
    public boolean isReplied(Player p) {
        WhQuestionInstance instance = this.getInstance(p);
        return instance.isValidated();
    }

    /**
     * {@link #isReplied ...}
     *
     * @param p
     *
     * @return true if the player has not yet answers this question
     */
    public boolean isNotReplied(Player p) {
        return !this.isReplied(p);
    }

    @Override
    public Boolean containsAll(List<String> criterias) {
        return Helper.insensitiveContainsAll(this.getDescription(), criterias)
                || super.containsAll(criterias);
    }

    // This method seems to be unused:
    public int getUnreadCount(Player player) {
        WhQuestionInstance instance = this.getInstance(player);
        return instance.getActive() && !instance.isValidated() ? 1 : 0;
    }

    @Override
    public void revive(Beanjection beans) {
        super.revive(beans);
    }
}
