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
import com.fasterxml.jackson.annotation.JsonManagedReference;
import com.fasterxml.jackson.annotation.JsonSubTypes;
import com.fasterxml.jackson.annotation.JsonView;
import com.fasterxml.jackson.databind.annotation.JsonDeserialize;
import com.wegas.core.Helper;
import com.wegas.core.exception.client.WegasIncompatibleType;
import com.wegas.core.exception.internal.WegasNoResultException;
import com.wegas.core.i18n.persistence.TranslatableContent;
import com.wegas.core.i18n.persistence.TranslationDeserializer;
import com.wegas.core.persistence.AbstractEntity;
import com.wegas.core.persistence.ListUtils;
import com.wegas.core.persistence.ListUtils.Updater;
import com.wegas.core.persistence.game.GameModel;
import com.wegas.core.persistence.game.Player;
import com.wegas.core.persistence.game.Script;
import com.wegas.core.persistence.variable.Beanjection;
import com.wegas.core.persistence.variable.DescriptorListI;
import com.wegas.core.persistence.variable.ListDescriptor;
import com.wegas.core.persistence.variable.Scripted;
import com.wegas.core.persistence.variable.VariableDescriptor;
import com.wegas.core.rest.util.Views;
import com.wegas.mcq.persistence.wh.WhQuestionDescriptor;
import java.util.ArrayList;
import java.util.List;
import javax.persistence.*;

/**
 *
 * @author Francois-Xavier Aeberhard (fx at red-agent.com)
 */
@Entity
@Table(indexes = {
    @Index(columnList = "question_id"),
    @Index(columnList = "description_id")
})
@Inheritance(strategy = InheritanceType.SINGLE_TABLE)
@JsonSubTypes(value = {
    @JsonSubTypes.Type(name = "SingleResultChoiceDescriptor", value = SingleResultChoiceDescriptor.class)
})
public class ChoiceDescriptor extends VariableDescriptor<ChoiceInstance> implements Scripted {

    private static final long serialVersionUID = 1L;
    // private static final Logger logger = LoggerFactory.getLogger(ChoiceDescriptor.class);
    /**
     *
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JsonIgnore
    @JsonBackReference
    private QuestionDescriptor question;
    /**
     *
     */
    @OneToMany(mappedBy = "choiceDescriptor", cascade = CascadeType.ALL, orphanRemoval = true)
    //    @OrderBy("id")
    @OrderColumn
    @JsonManagedReference
    @JsonView(Views.EditorI.class)
    private List<Result> results = new ArrayList<>();
    /**
     *
     */
    @OneToOne(cascade = CascadeType.ALL)
    @JsonDeserialize(using = TranslationDeserializer.class)
    private TranslatableContent description;

    /**
     *
     */
    private Long duration = 1L;
    /**
     *
     */
    private Long cost = 0L;

    /**
     * Total number of replies allowed. No default value.
     */
    private Integer maxReplies = null;

    @Override
    @JsonIgnore
    public List<Script> getScripts() {
        List<Script> ret = new ArrayList<>();
        //Avoid stream
        for (Result r : this.getResults()) {
            ret.addAll(r.getScripts());
        }
        return ret;
    }

    /**
     *
     * @param a
     */
    @Override
    public void merge(AbstractEntity a) {
        if (a instanceof ChoiceDescriptor) {
            ChoiceDescriptor other = (ChoiceDescriptor) a;
            this.setDescription(TranslatableContent.merger(this.getDescription(), other.getDescription()));
            super.merge(a);
            this.setMaxReplies(other.getMaxReplies());
            this.setDuration(other.getDuration());
            this.setCost(other.getCost());

            this.setResults(ListUtils.mergeLists(this.getResults(), other.getResults(), new Updater() {
                @Override
                public void addEntity(AbstractEntity entity) {
                    //Result newResult = (Result) entity;
                }

                @Override
                public void removeEntity(AbstractEntity entity) {
                    /*
                     * Since orphanRemoval does not trigger preRemove event,
                     * one should update bidirectional relation here in adition to Result.updateCacheOnDelete
                     */
                    if (entity instanceof Result) {
                        Result resultToRemove = (Result) entity;
                        resultToRemove.updateCacheOnDelete(beans);
                    }
                    /*for (ChoiceInstance ci : resultToRemove.getChoiceInstances()) {
                        ci.setCurrentResult(null);
                    }*/
                }
            }));

            Helper.setNameAndLabelForLabelledEntityList(this.getResults(), "result", this.getGameModel());
        } else {
            throw new WegasIncompatibleType(this.getClass().getSimpleName() + ".merge (" + a.getClass().getSimpleName() + ") is not possible");
        }
    }

    /**
     *
     * @param r
     */
    public void addResult(Result r) {
        this.results.add(r);
        r.setChoiceDescriptor(this);
    }

    // ~~~  Sugar to use from scripts ~~~
    /**
     * @param player
     * @param resultName
     *
     * @throws com.wegas.core.exception.internal.WegasNoResultException
     */
    public void setCurrentResult(Player player, String resultName) throws WegasNoResultException {
        ChoiceInstance instance = this.getInstance(player);
        Result resultByName = getResultByName(resultName);
        this.changeCurrentResult(instance, resultByName);
    }

    public void changeCurrentResult(ChoiceInstance choiceInstance, Result newCurrentResult) {
        //Result previousResult = choiceInstance.getCurrentResult();
        /*if (previousResult != null) {
            previousResult.removeChoiceInstance(choiceInstance);
        }*/

 /*if (newCurrentResult != null) {
            newCurrentResult.addChoiceInstance(choiceInstance);
        }*/
        choiceInstance.setCurrentResult(newCurrentResult);
    }

    /**
     * Select this choice result matching given name
     * <p>
     * @param name result-to-find's name
     *
     * @return the specified result
     *
     * @throws com.wegas.core.exception.internal.WegasNoResultException
     */
    public Result getResultByName(String name) throws WegasNoResultException {
        for (Result r : this.getResults()) {
            if (r.getName().equals(name)) {
                return r;
            }
        }
        throw new WegasNoResultException();
    }

    /**
     *
     * @param p
     */
    public void activate(Player p) {
        this.getInstance(p).activate();
    }

    /**
     *
     * @param p
     */
    public void desactivate(Player p) {
        this.getInstance(p).desactivate();
    }

    /**
     * @return the description
     */
    public TranslatableContent getDescription() {
        return description;
    }

    /**
     * @param description the description to set
     */
    public void setDescription(TranslatableContent description) {
        this.description = description;
        if (this.description != null) {
            this.description.setParentDescriptor(this);
        }
    }

    /**
     * @return the duration
     */
    public Long getDuration() {
        return duration;
    }

    /**
     * @param duration the duration to set
     */
    public void setDuration(Long duration) {
        this.duration = duration;
    }

    /**
     * @return the maximum number of replies allowed
     */
    public Integer getMaxReplies() {
        return maxReplies;
    }

    /**
     * @param maxReplies the maximum number of replies allowed
     */
    public void setMaxReplies(Integer maxReplies) {
        this.maxReplies = maxReplies;
    }

    /**
     * @return the results
     */
    public List<Result> getResults() {
        return results;
    }

    /**
     * @param results the results to set
     */
    public void setResults(List<Result> results) {
        if (results != null) {
            for (Result r : results) {
                r.setChoiceDescriptor(this);
            }
        }
        this.results = results;
    }

    /**
     * Is the player instance active ?
     *
     * @param p <p>
     * @return player instance active status
     */
    public boolean isActive(Player p) {
        return this.getInstance(p).getActive();
    }

    /**
     * has the choice been explicitely ignored ?
     * <p>
     * ie. the choice has not been selected and is no longer selectable
     *
     * @param p
     *
     * @return true only if the choice is not selectable any longer
     */
    public boolean hasBeenIgnored(Player p) {
        QuestionInstance qi = this.getQuestion().getInstance(p);

        if (this.getQuestion().getCbx()) {
            if (!qi.getValidated()) {
                //Check box not yet validated -> no choices have been submited, nor ignorated
                return false;
            } else {
                for (Reply r : this.getInstance(p).getReplies()) {
                    // reply for this choice found
                    return r.getIgnored();
                }
                return false;
            }
        } else {
            // Is the Choice linked to at least a reply => not ignored
            if (!this.getInstance(p).getReplies().isEmpty()) {
                return false;
            }

            // this choice has not been selected
            if (this.getQuestion().getMaxReplies() != null) {
                // maximum number of choice is set. reached ?
                return qi.getReplies(p).size() >= this.getQuestion().getMaxReplies();
            } else {
                // no limit, the choice is still selectable
                return false;
            }
        }
    }

    /**
     * Is the choice selectable.
     * This method only cares about the choice itself not the whole question.
     * It means is will return true even when the question is no longer anserable
     *
     * @param p
     *
     * @return
     */
    public boolean isSelectable(Player p) {
        if (this.getMaxReplies() != null) {
            // maximum limit reached ?
            return this.getInstance(p).getReplies().size() < this.getMaxReplies();
        }
        // no-limit
        return true;
    }

    /**
     * has the choice not (yet) been selected ? <br>
     * Such a case happened for
     * <ul>
     * <li>MCQ Questions, after the question has been validated, for all
     * unselected choices, or before the validation, for all choices </li>
     * <li>Standard question, if the choice is not linked to a reply </li>
     * </ul>
     *
     * @param p the player
     *
     * @return return true if this choice can be selected by the player
     */
    public boolean hasNotBeenSelected(Player p) {
        if (this.getQuestion().getCbx()) {
            if (!this.getQuestion().getInstance(p).getValidated()) {
                //Check box not yet validated -> no chocie have been selected
                return true;
            } else {
                for (Reply r : this.getInstance(p).getReplies()) {
                    // reply for this choice found
                    return r.getIgnored();
                }
                return false;
            }
        } else {
            if (!this.getInstance(p).getReplies().isEmpty()) {
                // Choice is linked to a reply => not ignored
                return false;
            }
            return true;
        }
    }

    /**
     * Does this choice has been selected by the given player
     * <p>
     * @param p the player
     * <p>
     * @return true if one or more question replies referencing this choice
     *         exist
     */
    public boolean hasBeenSelected(Player p) {
        if (this.getQuestion().getCbx() && !this.getQuestion().getInstance(p).getValidated()) {
            return false;
        }
        for (Reply r : this.getInstance(p).getReplies()) {
            if (!r.getIgnored()) {
                return true;
            }
        }
        return false;
    }

    /**
     * Does this result has been selected by the given player
     * <p>
     * @param p      the player
     * @param result <p>
     * @return true if one or more question reply referencing the given result
     *         exist
     */
    public boolean hasResultBeenApplied(Player p, Result result) {
        for (Reply r : this.getInstance(p).getReplies()) {
            if (r.getResult().equals(result)) {
                return true;
            }
        }
        return false;
    }

    /**
     * Does this result has been selected by the given player
     * <p>
     * @param p          the player
     * @param resultName result name
     * <p>
     * @return true if one or more question reply referencing the given result
     *         exist
     *
     * @throws com.wegas.core.exception.internal.WegasNoResultException
     */
    public boolean hasResultBeenApplied(Player p, String resultName) throws WegasNoResultException {
        return this.hasResultBeenApplied(p, this.getResultByName(resultName));
    }

    /**
     * @return the cost
     */
    public Long getCost() {
        return cost;
    }

    /**
     * @param cost the cost to set
     */
    public void setCost(Long cost) {
        this.cost = cost;
    }

    /**
     * @return the question
     */
    public QuestionDescriptor getQuestion() {
        return question;
    }

    @JsonIgnore
    @Override
    public DescriptorListI<? extends VariableDescriptor> getParent() {
        if (this.getQuestion() != null) {
            return this.getQuestion();
        } else {
            return super.getParent();
        }
    }

    /**
     * @param question the question to set
     */
    @JsonBackReference
    public void setQuestion(QuestionDescriptor question) {
        this.question = question;
        logger.trace("set {} question to {}", this, this.question);
        if (question != null) { // Hum... question should never be null...
            this.setRoot(null);
            this.setParentList(null);
            this.setParentWh(null);
        }
    }

    @Override
    public void setRoot(GameModel rootGameModel) {
        super.setRoot(rootGameModel);
        if (this.getRoot() != null) {
            this.setQuestion(null);
        }
    }

    @Override
    public void setParentList(ListDescriptor parentList) {
        super.setParentList(parentList);
        if (this.getParentList() != null) {
            this.setQuestion(null);
        }
    }

    @Override
    public void setParentWh(WhQuestionDescriptor parentWh) {
        super.setParentWh(parentWh);
        if (this.getParentWh() != null) {
            this.setQuestion(null);
        }
    }

    @Override
    public Boolean containsAll(List<String> criterias) {
        if (Helper.insensitiveContainsAll(getDescription(), criterias)
                || super.containsAll(criterias)) {
            return true;
        }
        for (Result r : this.getResults()) {
            if (r.containsAll(criterias)) {
                return true;
            }
        }
        return false;
    }

    @Override
    public void revive(Beanjection beans) {
        if (this.title != null) {
            String importedLabel = getLabel().translateOrEmpty(this.getGameModel());
            if (importedLabel == null) {
                importedLabel = "";
            }
            // title = "", label= "" => prefix = "", label=""
            // title = "", label= "[r5b] Meet someone" => prefix = "[r5b] Meet someone", label=""
            // title = "Meet someone", label= "[r5b] Meet someone" => prefix = "[r5b]", label="Meet someone"
            // title = "Meet someone", label="" => prefix = "", label="Meet someone"
            this.setEditorTag(importedLabel.replace(title, "").trim());

            this.setLabel(TranslatableContent.build("def", title));
            this.title = null;
        }
        for (Result r : results) {
            if (r.getLabel() != null) {
                r.getLabel().setParentDescriptor(this);
            }
            if (r.getAnswer() != null) {
                r.getAnswer().setParentDescriptor(this);
            }
            if (r.getIgnorationAnswer() != null) {
                r.getIgnorationAnswer().setParentDescriptor(this);
            }
        }
        super.revive(beans);
    }
}
