/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.mcq.persistence;

import com.wegas.core.persistence.AbstractEntity;
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
import javax.xml.bind.annotation.XmlType;
import org.codehaus.jackson.annotate.JsonManagedReference;
import org.codehaus.jackson.map.annotate.JsonView;

/**
 *
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
@Entity
@XmlType(name = "QuestionDescriptor")
@Table(name = "MCQQuestionDescriptor")
public class QuestionDescriptor extends VariableDescriptor<QuestionInstance> implements DescriptorListI<ChoiceDescriptor> {

    private static final long serialVersionUID = 1L;
    /**
     *
     */
    @Lob
    @Basic(fetch = FetchType.LAZY)
    @JsonView(Views.ExtendedI.class)
    private String description;
    /**
     *
     */
    private boolean allowMultipleReplies = false;
    /**
     *
     */
    @OneToMany(mappedBy = "question", cascade = {CascadeType.ALL}, orphanRemoval = true)
    //@BatchFetch(BatchFetchType.IN)
    @JoinColumn(referencedColumnName = "variabledescriptor_id")
    @JsonManagedReference
    @OrderColumn
    private List<ChoiceDescriptor> items = new ArrayList<>();
    /**
     *
     */
    @ElementCollection
    //@JsonView(Views.EditorI.class)
    private List<String> pictures = new ArrayList<>();

    /**
     *
     * @param a
     */
    @Override
    public void merge(AbstractEntity a) {
        super.merge(a);
        QuestionDescriptor other = (QuestionDescriptor) a;
        this.setDescription(other.getDescription());
        this.setAllowMultipleReplies(other.getAllowMultipleReplies());
        this.setPictures(other.getPictures());
    }
// *** Sugar for scripts *** //

    /**
     *
     * @param p
     * @param value
     */
    public void setActive(Player p, boolean value) {
        ((QuestionInstance) this.getInstance(p)).setActive(value);
    }

    /**
     *
     * @param p
     * @return
     */
    public Boolean isActive(Player p) {
        QuestionInstance instance = (QuestionInstance) this.getInstance(p);
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

    /**
     *
     * @param p
     * @return
     */
    public Boolean isReplied(Player p) {
        QuestionInstance instance = (QuestionInstance) this.getInstance(p);
        return !instance.getReplies().isEmpty();
    }

    /**
     * @return the variableDescriptors
     */
    @Override
    public List<ChoiceDescriptor> getItems() {
        return items;
    }

    /**
     * @param items
     */
    @Override
    public void setItems(List<ChoiceDescriptor> items) {
        for (ChoiceDescriptor cd : items) {     //@todo: due to duplication, fix this
            cd.setQuestion(this);
            cd.setGameModel(this.getGameModel());
        }
        this.items = items;
    }

    /**
     *
     * @param item
     */
    @Override
    public void addItem(ChoiceDescriptor item) {
        this.items.add(item);
        item.setQuestion(this);
        item.setGameModel(this.getGameModel());
    }

    /**
     *
     * @param index
     * @return
     */
    @Override
    public ChoiceDescriptor item(int index) {
        return this.items.get(index);
    }

    @Override
    public void addItem(int index, ChoiceDescriptor item) {
        this.items.add(index, item);
        item.setQuestion(this);
        item.setGameModel(this.getGameModel());
    }

    @Override
    public int size() {
        return this.items.size();
    }

    @Override
    public boolean remove(ChoiceDescriptor item) {
        return this.items.remove(item);
    }
}
