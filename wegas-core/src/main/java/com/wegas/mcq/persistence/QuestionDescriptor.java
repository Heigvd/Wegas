/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2017 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.mcq.persistence;

import com.wegas.core.Helper;
import com.wegas.core.persistence.AbstractEntity;
import com.wegas.core.persistence.game.GameModel;
import com.wegas.core.persistence.game.Player;
import com.wegas.core.persistence.variable.DescriptorListI;
import com.wegas.core.persistence.variable.VariableDescriptor;
import com.wegas.core.rest.util.Views;
import java.util.ArrayList;
import java.util.List;
import javax.persistence.Basic;
import javax.persistence.CascadeType;
import javax.persistence.ElementCollection;
import javax.persistence.Entity;
import javax.persistence.FetchType;
import javax.persistence.JoinColumn;
import javax.persistence.Lob;
import javax.persistence.OneToMany;
import javax.persistence.OrderColumn;
import javax.persistence.Table;
import com.fasterxml.jackson.annotation.JsonManagedReference;
import com.fasterxml.jackson.annotation.JsonView;
import com.wegas.core.merge.annotations.WegasEntityProperty;
import static java.lang.Boolean.FALSE;
import javax.persistence.Column;
import javax.persistence.NamedQueries;
import javax.persistence.NamedQuery;

/**
 *
 * @author Francois-Xavier Aeberhard (fx at red-agent.com)
 */
@Entity
@Table(name = "MCQQuestionDescriptor")
@NamedQueries({
    @NamedQuery(name = "QuestionDescriptor.findDistinctChildrenLabels", query = "SELECT DISTINCT(cd.label) FROM ChoiceDescriptor cd WHERE cd.question.id = :containerId")
})
public class QuestionDescriptor extends VariableDescriptor<QuestionInstance> implements DescriptorListI<ChoiceDescriptor> {

    private static final long serialVersionUID = 1L;
    /**
     *
     */
    @Lob
    @Basic(fetch = FetchType.EAGER) // CARE, lazy fetch on Basics has some trouble.
    @JsonView(Views.ExtendedI.class)
    @WegasEntityProperty
    private String description;
    /**
     *
     */
    @WegasEntityProperty
    private boolean allowMultipleReplies = false;
    /**
     * Set this to true when the choice is to be selected with an HTML
     * radio/checkbox
     */
    @Column(columnDefinition = "boolean default false")
    @WegasEntityProperty
    private Boolean cbx = FALSE;
    /**
     * Determines if choices are presented horizontally in a tabular fashion
     */
    @Column(columnDefinition = "boolean default false")
    @WegasEntityProperty
    private Boolean tabular = FALSE;
    /**
     *
     */
    @OneToMany(mappedBy = "question", cascade = {CascadeType.ALL}/*, orphanRemoval = true*/)
    //@BatchFetch(BatchFetchType.IN)
    @JoinColumn(referencedColumnName = "variabledescriptor_id")
    @JsonManagedReference
    @OrderColumn
    
    @WegasEntityProperty(includeByDefault = false, callback = DescriptorListI.UpdateChild.class)
    private List<ChoiceDescriptor> items = new ArrayList<>();
    /**
     *
     */
    @ElementCollection
    @JsonView(Views.ExtendedI.class)
    //@JsonView(Views.EditorI.class)
    @WegasEntityProperty
    private List<String> pictures = new ArrayList<>();

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
        QuestionInstance instance = this.getInstance(p);
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
     * @return the multipleReplies
     */
    public boolean getAllowMultipleReplies() {
        return allowMultipleReplies;
    }

    /**
     * @param allowMultipleReplies
     */
    public void setAllowMultipleReplies(boolean allowMultipleReplies) {
        this.allowMultipleReplies = allowMultipleReplies;
    }

    /**
     * @return the checkbox flag
     */
    public Boolean getCbx() {
        return cbx;
    }

    /**
     * @param cb if the checkbox mode is set
     */
    public void setCbx(Boolean cb) {
        this.cbx = cb;
    }

    /**
     * @return the tabular flag
     */
    public Boolean getTabular() {
        return tabular;
    }

    /**
     * @param tab if the tabular layout mode is set
     */
    public void setTabular(Boolean tab) {
        this.tabular = tab;
    }

    /**
     * @return the pictures
     */
    public List<String> getPictures() {
        return pictures;
    }

    /**
     * @param pictures the pictures to set
     */
    public void setPictures(List<String> pictures) {
        this.pictures = pictures;
    }

    @Override
    public void setGameModel(GameModel gm) {
        super.setGameModel(gm);
        for (ChoiceDescriptor cd : this.getItems()) {
            cd.setGameModel(gm);
        }
    }

    /**
     *
     * @param p
     *
     * @return true if the player has already answers this question
     */
    public boolean isReplied(Player p) {
        QuestionInstance instance = this.getInstance(p);
        if (this.getCbx()) {
            return instance.getValidated();
        } else {
            return !instance.getReplies(p).isEmpty();
        }
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

    /**
     * @return the variableDescriptors
     */
    @Override
    @JsonView(Views.ExportI.class)
    public List<ChoiceDescriptor> getItems() {
        return items;
    }

    /**
     * @param items
     */
    @Override
    public void setItems(List<ChoiceDescriptor> items) {
        if (this.items != items) {
            // do not clear new list if it's the same 
            this.items.clear();
        }
        for (ChoiceDescriptor cd : items) {
            this.addItem(cd);
        }
    }

    /**
     *
     * @param index
     *
     * @return the iest choiceDescriptor
     *
     * @throws IndexOutOfBoundsException
     */
    @Override
    public ChoiceDescriptor item(int index) {
        return this.getItems().get(index);
    }

    /**
     *
     * @param item
     */
    @Override
    public void addItem(ChoiceDescriptor item) {
        this.addItem(null, item);
    }

    @Override
    public void addItem(Integer index, ChoiceDescriptor item) {
        if (this.getGameModel() != null) {
            this.getGameModel().addToVariableDescriptors(item);
        }

        if (!this.getItems().contains(item)) {
            if (index != null) {
                this.getItems().add(index, item);
            } else {
                this.getItems().add(item);
            }
        }
        item.setQuestion(this);
    }

    @Override
    public int size() {
        return this.getItems().size();
    }

    @Override
    public boolean remove(ChoiceDescriptor item) {
        item.setQuestion(null);
        this.getGameModel().removeFromVariableDescriptors(item);
        return this.getItems().remove(item);
    }

    @Override
    public Boolean containsAll(List<String> criterias) {
        return Helper.insensitiveContainsAll(this.getDescription(), criterias)
                || super.containsAll(criterias);
    }

    // This method seems to be unused:
    public int getUnreadCount(Player player) {
        QuestionInstance instance = this.getInstance(player);
        if (this.getCbx()) {
            return instance.getActive() && !instance.getValidated() ? 1 : 0;
        } else {
            return instance.getActive() && instance.getReplies(player).isEmpty() ? 1 : 0;
        }
    }
}
