/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013, 2014, 2015 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.mcq.persistence;

import com.wegas.core.Helper;
import com.wegas.core.persistence.AbstractEntity;
import com.wegas.core.persistence.ListUtils;
import com.wegas.core.persistence.game.Player;
import com.wegas.core.persistence.variable.VariableDescriptor;
import com.wegas.core.rest.util.Views;
import java.util.ArrayList;
import java.util.List;
import javax.persistence.*;
import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonManagedReference;
import com.fasterxml.jackson.annotation.JsonSubTypes;
import com.fasterxml.jackson.annotation.JsonView;
import com.wegas.core.exception.internal.WegasNoResultException;
import com.wegas.core.persistence.game.Script;
import com.wegas.core.persistence.variable.Scripted;
import static java.lang.Boolean.FALSE;

/**
 *
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
@Entity
@Table(name = "MCQChoiceDescriptor")
@Inheritance(strategy = InheritanceType.SINGLE_TABLE)
//@XmlType(name = "ChoiceDescriptor")
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
    //@XmlTransient
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
    @Basic(fetch = FetchType.LAZY)
    @Lob
    @JsonView(Views.ExtendedI.class)
    private String description;
    
        /**
     * Set this to true when the choice is to be selected with an HTML checkbox
     */
    private Boolean cbx = FALSE;

    /**
     *
     */
    private Long duration = 1L;
    /**
     *
     */
    private Long cost = 0L;

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
        ChoiceDescriptor other = (ChoiceDescriptor) a;
        this.setDescription(other.getDescription());
        super.merge(a);
        this.setDuration(other.getDuration());
        this.setCost(other.getCost());
        Boolean tmpl = other.getCbx();
        this.setCbx(tmpl);
        
        ListUtils.mergeReplace(this.getResults(), other.getResults());

        // Has currentResult been removed ?
        ChoiceInstance defaultInstance = (ChoiceInstance) this.getDefaultInstance();
        if (!this.getResults().contains(defaultInstance.getCurrentResult())) {
            defaultInstance.setCurrentResult(null);
        }

        // Detect new results
        List<String> labels = new ArrayList<>();
        List<String> names = new ArrayList<>();
        List<Result> newResults = new ArrayList<>();

        for (Result r : this.getResults()) {
            if (r.getId() != null) {
                // Store name and label existing result
                labels.add(r.getLabel());
                names.add(r.getName());
            } else {
                newResults.add(r);
            }
        }

        // set names and labels unique
        for (Result r : newResults) {
            Helper.setNameAndLabelForResult(r, names, labels);
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

    // ***  Sugar to use from scripts *** //
    /**
     * @param player
     * @param resultName
     * @throws com.wegas.core.exception.internal.WegasNoResultException
     */
    public void setCurrentResult(Player player, String resultName) throws WegasNoResultException {
        Result resultByName = getResultByName(resultName);
        this.getInstance(player).setCurrentResult(resultByName);
    }

    /**
     * Select this choice result matching given name
     * <p>
     * @param name result-to-find's name
     * @return the specified result
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
    public String getDescription() {
        return description;
    }

    /**
     * @param description the description to set
     */
    public void setDescription(String description) {
        this.description = description;
    }
    
    /**
     * @return the checkbox flag
     */
    public Boolean getCbx() {
        return cbx;
    }

    /**
     * @param cb: if the checkbox mode is set
     */
    public void setCbx(Boolean cb) {
        this.cbx = cb;
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
     * @return the results
     */
    public List<Result> getResults() {
        return results;
    }

    /**
     * @param results the results to set
     */
    public void setResults(List<Result> results) {
        this.results = results;
    }

    /**
     *
     * @param p <p>
     * @return
     */
    public boolean isActive(Player p) {
        return this.getInstance(p).getActive();
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
        for (Reply r : this.getQuestion().getInstance(p).getReplies()) {
            if (r.getResult().getChoiceDescriptor().equals(this)) {
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
        for (Reply r : this.getQuestion().getInstance(p).getReplies()) {
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

    /**
     * @param question the question to set
     */
    @JsonBackReference
    public void setQuestion(QuestionDescriptor question) {
        this.question = question;
    }

    @Override
    public Boolean containsAll(List<String> criterias) {
        if (Helper.insensitiveContainsAll(this.getDescription(), criterias)
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
}
