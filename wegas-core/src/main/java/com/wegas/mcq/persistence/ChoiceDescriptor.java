/*
 * Wegas
 * http://www.albasim.ch/wegas/
 *
 * Copyright (c) 2013 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.mcq.persistence;

import com.wegas.core.persistence.AbstractEntity;
import com.wegas.core.persistence.ListUtils;
import com.wegas.core.persistence.game.GameModel;
import com.wegas.core.persistence.game.Player;
import com.wegas.core.persistence.game.Script;
import com.wegas.core.persistence.variable.VariableDescriptor;
import com.wegas.core.rest.util.Views;
import java.util.ArrayList;
import java.util.List;
import javax.persistence.*;
import javax.xml.bind.annotation.XmlTransient;
import javax.xml.bind.annotation.XmlType;
import org.codehaus.jackson.annotate.JsonBackReference;
import org.codehaus.jackson.annotate.JsonManagedReference;
import org.codehaus.jackson.annotate.JsonSubTypes;
import org.codehaus.jackson.map.annotate.JsonView;

/**
 *
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
@Entity
@Table(name = "MCQChoiceDescriptor")
@XmlType(name = "ChoiceDescriptor")
@JsonSubTypes(value = {
    @JsonSubTypes.Type(name = "SingleResultChoiceDescriptor", value = SingleResultChoiceDescriptor.class)
})
public class ChoiceDescriptor extends VariableDescriptor<ChoiceInstance> {

    private static final long serialVersionUID = 1L;
    // private static final Logger logger = LoggerFactory.getLogger(ChoiceDescriptor.class);
    /**
     *
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @XmlTransient
    @JsonBackReference
    private QuestionDescriptor question;
    /**
     *
     */
    @OneToMany(mappedBy = "choiceDescriptor", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("id")
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
     *
     */
    @Embedded
    @JsonView(Views.EditorI.class)
    private Script impact;
    /**
     *
     */
    private Long duration = Long.valueOf(1);
    /**
     *
     */
    private Long cost = Long.valueOf(0);

    /**
     *
     * @param a
     */
    @Override
    public void merge(AbstractEntity a) {
        super.merge(a);
        ChoiceDescriptor other = (ChoiceDescriptor) a;
        this.setDescription(other.getDescription());
        this.setImpact(other.getImpact());
        this.setDuration(other.getDuration());
        this.setCost(other.getCost());
        ListUtils.mergeLists(this.getResults(), other.getResults());
        ListUtils.mergeLists(this.getResults(), other.getResults()); ///// @todo: WHY !!!!!
    }

    @Override
    public GameModel getGameModel() { //@todo correct this, due to missing elements while duplication. Fix it
        GameModel gm = super.getGameModel();
        if (gm == null) {
            gm = this.getQuestion().getGameModel();
            this.setGameModel(gm);
        }
        return gm;
    }

    /**
     * When a choice is created, we automatically add a result by default
     */
    @PrePersist
    public void prePersist2() {
        if (this.getResults().isEmpty()) {
            this.addResult(new Result("Default"));              // When a choice is created, we automatically add a result by default
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
     *
     * @param player
     * @param index
     */
    public void setCurrentResultByIndex(Player player, int index) {
        this.getInstance(player).setCurrentResultByIndex(index);
    }

    /**
     *
     * @param player
     * @param resultId
     */
    public void setCurrentResult(Player player, Long resultId) {
        this.getInstance(player).setCurrentResultId(resultId);
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
     * @return the impact
     */
    public Script getImpact() {
        return impact;
    }

    /**
     * @param impact the impact to set
     */
    public void setImpact(Script impact) {
        this.impact = impact;
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
     * @param p
     * @return
     */
    public Boolean isActive(Player p) {
        return this.getInstance(p).getActive();
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
}
