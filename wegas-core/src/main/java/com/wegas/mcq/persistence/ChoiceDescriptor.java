/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.mcq.persistence;

import ch.albasim.wegas.annotations.CommonView;
import ch.albasim.wegas.annotations.DependencyScope;
import ch.albasim.wegas.annotations.IMergeable;
import ch.albasim.wegas.annotations.Scriptable;
import ch.albasim.wegas.annotations.View;
import ch.albasim.wegas.annotations.WegasCallback;
import ch.albasim.wegas.annotations.WegasEntityProperty;
import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonManagedReference;
import com.fasterxml.jackson.annotation.JsonSubTypes;
import com.fasterxml.jackson.annotation.JsonView;
import com.wegas.core.Helper;
import com.wegas.core.exception.internal.WegasNoResultException;
import com.wegas.core.i18n.persistence.TranslatableContent;
import com.wegas.core.persistence.EntityComparators;
import com.wegas.core.persistence.annotations.WegasConditions.And;
import com.wegas.core.persistence.annotations.WegasConditions.Equals;
import com.wegas.core.persistence.annotations.WegasConditions.IsDefined;
import com.wegas.core.persistence.annotations.WegasConditions.IsTrue;
import com.wegas.core.persistence.annotations.WegasConditions.Not;
import com.wegas.core.persistence.annotations.WegasConditions.Or;
import com.wegas.core.persistence.annotations.WegasEntity;
import com.wegas.core.persistence.annotations.WegasRefs.Const;
import com.wegas.core.persistence.annotations.WegasRefs.Field;
import com.wegas.core.persistence.game.GameModel;
import com.wegas.core.persistence.game.Player;
import com.wegas.core.persistence.variable.DescriptorListI;
import com.wegas.core.persistence.variable.ListDescriptor;
import com.wegas.core.persistence.variable.VariableDescriptor;
import com.wegas.core.rest.util.Views;
import com.wegas.editor.ValueGenerators.EmptyArray;
import com.wegas.editor.ValueGenerators.EmptyI18n;
import com.wegas.editor.ValueGenerators.One;
import com.wegas.editor.ValueGenerators.Zero;
import com.wegas.editor.Visible;
import com.wegas.editor.view.Hidden;
import com.wegas.editor.view.I18nHtmlView;
import com.wegas.editor.view.NumberView;
import com.wegas.mcq.persistence.wh.WhQuestionDescriptor;
import java.util.ArrayList;
import java.util.List;
import javax.persistence.CascadeType;
import javax.persistence.Entity;
import javax.persistence.FetchType;
import javax.persistence.Index;
import javax.persistence.Inheritance;
import javax.persistence.InheritanceType;
import javax.persistence.ManyToOne;
import javax.persistence.OneToMany;
import javax.persistence.OneToOne;
import javax.persistence.Table;

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
@WegasEntity(callback = ChoiceDescriptor.ChoiceDescriptorMergeCallback.class)
public class ChoiceDescriptor extends VariableDescriptor<ChoiceInstance> {

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
    //@OrderColumn
    @JsonManagedReference
    @JsonView(Views.EditorI.class)
    @WegasEntityProperty(callback = ResultMergeCallback.class,
        proposal = EmptyArray.class,
        optional = false, nullable = false,
        view = @View(
            index = 5,
            value = Hidden.class,
            label = ""
        ))
    private List<Result> results = new ArrayList<>();
    /**
     *
     */
    @OneToOne(cascade = CascadeType.ALL)
    @WegasEntityProperty(
        optional = false, nullable = false, proposal = EmptyI18n.class,
        view = @View(
            index = 1,
            label = "Description",
            value = I18nHtmlView.class
        ))
    private TranslatableContent description;

    /**
     *
     */
    @WegasEntityProperty(proposal = One.class, view = @View(label = "Duration", value = Hidden.class))
    private Long duration = 1L;
    /**
     *
     */
    @WegasEntityProperty(proposal = Zero.class, view = @View(label = "Cost", value = Hidden.class))
    private Long cost = 0L;

    /**
     * Total number of replies allowed. No default value.
     */
    @WegasEntityProperty(view = @View(
        index = 10,
        label = "Max. number replies",
        value = NumberView.WithInfinityPlaceholder.class,
        layout = CommonView.LAYOUT.shortInline
    ))
    @Visible(IsNotQuestionCbxOrMaxEqOne.class)
    private Integer maxReplies = null;

    /**
     *
     * @param r
     */
    public void addResult(Result r) {
        if (!this.results.contains(r)) {
            this.results.add(r);
        }
        r.setChoiceDescriptor(this);
    }

    // ~~~  Sugar to use from scripts ~~~
    /**
     * @param player
     * @param resultName
     *
     * @throws com.wegas.core.exception.internal.WegasNoResultException
     */
    @Scriptable(dependsOn = DependencyScope.NONE)
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
        for (Result r : this.getRawResults()) {
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
    @Scriptable(dependsOn = DependencyScope.NONE)
    public void activate(Player p) {
        this.getInstance(p).activate();
    }

    /**
     *
     * @param p
     */
    @Deprecated
    public void desactivate(Player p) {
        this.deactivate(p);
    }

    @Scriptable(dependsOn = DependencyScope.NONE)
    public void deactivate(Player p) {
        this.getInstance(p).deactivate();
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
        return Helper.copyAndSortModifiable(this.results, new EntityComparators.OrderComparator<>());
    }

    /**
     * @return the results
     */
    @JsonIgnore
    public List<Result> getRawResults() {
        return results;
    }

    /**
     * @param results the results to set
     */
    public void setResults(List<Result> results) {
        if (results != null) {
            int i=0;
            for (Result r : results) {
                r.setChoiceDescriptor(this);
                r.setIndex(i++);
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
    @Scriptable(dependsOn = DependencyScope.SELF)
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
    @Scriptable(dependsOn = DependencyScope.SELF)
    public boolean hasBeenIgnored(Player p) {
        // Is there any not ignored validated reply link to this choice
        for (Reply r : this.getInstance(p).getReplies(Boolean.TRUE)) {
            if (!r.getIgnored()) {
                // validated and not ignored reply found
                return false;
            }
        }

        /*
         * At this point, we're sure this choice has not been selected & validated
         */
        // has the question been explicitly validated (either CBX case or by a specific impact)
        if (this.getQuestion().getValidated(p)) {
            // validated -> no longer answerable
            return true;
        } else {
            // question not validated & this choice not (selected && validated)
            return !this.getQuestion().isStillAnswerabled(p);
        }
    }

    /**
     * Is the choice selectable. This method only cares about the choice itself not the whole
     * question. It means is will return true even when the question is no longer answerable
     *
     * @param p
     *
     * @return
     */
    @Scriptable(dependsOn = DependencyScope.SELF)
    public boolean isSelectable(Player p) {
        if (this.getMaxReplies() != null) {
            // maximum limit reached ?
            return this.getInstance(p).getReplies().size() < this.getMaxReplies();
        }
        // no-limit
        return true;
    }

    /**
     * has the choice not (yet) been validated ? <br>
     * Such a case happened for
     * <ul>
     * <li>MCQ Questions, after the question has been validated, for all unselected choices, or
     * before the validation, for all choices</li>
     * <li>Standard question, if the choice is not linked to any validated reply </li>
     * </ul>
     *
     * @param p the player
     *
     * @return return true if this choice can be selected by the player
     */
    @Scriptable(dependsOn = DependencyScope.SELF)
    public boolean hasNotBeenSelected(Player p) {
        return !this.hasBeenSelected(p);
    }

    /**
     * Does this choice has been validated by the given player
     * <p>
     * @param p the player
     * <p>
     * @return true if one or more question replies referencing this choice exist
     */
    @Scriptable(dependsOn = DependencyScope.SELF)
    public boolean hasBeenSelected(Player p) {
        for (Reply r : this.getInstance(p).getReplies(Boolean.TRUE)) {
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
     * @return true if one or more question reply referencing the given result exist
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
     * @return true if one or more question reply referencing the given result exist
     *
     * @throws com.wegas.core.exception.internal.WegasNoResultException
     */
    @Scriptable(dependsOn = DependencyScope.SELF)
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
    public DescriptorListI<? extends VariableDescriptor> getParentOrNull() {
        if (this.getQuestion() != null) {
            return this.getQuestion();
        } else {
            return super.getParentOrNull();
        }
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

    public static class ChoiceDescriptorMergeCallback implements WegasCallback {

        @Override
        public void postUpdate(IMergeable entity, Object ref, Object identifier) {
            if (entity instanceof ChoiceDescriptor) {
                ChoiceDescriptor cd = (ChoiceDescriptor) entity;
                // set names and labels unique
                Helper.setNameAndLabelForLabelledEntityList(cd.getResults(), "result", cd.getGameModel());
            }
        }

    }

    public static class ResultMergeCallback implements WegasCallback {

        @Override
        public Object remove(Object entity, IMergeable container, Object identifier) {
            if (entity instanceof Result) {
                Result resultToRemove = (Result) entity;
                resultToRemove.updateCacheOnDelete(resultToRemove.getChoiceDescriptor().beans);
            }
            return null;
        }
    }

    public static class IsNotQuestionCbxOrMaxEqOne extends Not {

        public IsNotQuestionCbxOrMaxEqOne() {
            super(new Or(
                new And(
                    // choice is answerable only once in CBX questions
                    new IsDefined(new Field(QuestionDescriptor.class, "cbx")),
                    new IsTrue(new Field(QuestionDescriptor.class, "cbx"))
                ),
                new And(
                    // choice is answerable only once if global max is one
                    new IsDefined(new Field(QuestionDescriptor.class, "maxReplies")),
                    new Equals(new Field(QuestionDescriptor.class, "maxReplies"), new Const(1))
                )
            )
            );
        }
    }
}
