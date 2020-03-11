/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2019 School of Business and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.survey.persistence;

import ch.albasim.wegas.annotations.Scriptable;
import ch.albasim.wegas.annotations.View;
import ch.albasim.wegas.annotations.WegasEntityProperty;
import com.fasterxml.jackson.annotation.JsonManagedReference;
import com.fasterxml.jackson.annotation.JsonView;
import com.wegas.core.i18n.persistence.TranslatableContent;
import com.wegas.core.persistence.annotations.Param;
import com.wegas.core.persistence.game.GameModel;
import com.wegas.core.persistence.game.Player;
import com.wegas.core.persistence.variable.DescriptorListI;
import com.wegas.core.persistence.variable.VariableDescriptor;
import com.wegas.core.rest.util.Views;
import com.wegas.editor.ValueGenerators;
import com.wegas.editor.ValueGenerators.EmptyI18n;
import com.wegas.editor.View.Hidden;
import com.wegas.editor.View.I18nHtmlView;
import com.wegas.survey.persistence.input.SurveySectionDescriptor;
import java.util.ArrayList;
import java.util.List;
import javax.persistence.CascadeType;
import javax.persistence.Entity;
import javax.persistence.Index;
import javax.persistence.OneToMany;
import javax.persistence.OneToOne;
import javax.persistence.OrderColumn;
import javax.persistence.Table;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * Descriptor of the Survey variable<br>
 *
 * @author Jarle Hulaas
 * @see SurveyDescriptor
 */

@Entity
@Table(
        indexes = {
            @Index(columnList = "description_id"),
            @Index(columnList = "descriptionend_id")
        }
)
public class SurveyDescriptor extends VariableDescriptor<SurveyInstance>
        implements DescriptorListI<SurveySectionDescriptor> {

    private static final long serialVersionUID = 1L;
    private static final Logger logger = LoggerFactory.getLogger(SurveyDescriptor.class);


    @OneToOne(cascade = CascadeType.ALL)
    @WegasEntityProperty(
            optional = false, nullable = false, proposal = EmptyI18n.class,
            view = @View(label = "Introductory description", value = I18nHtmlView.class))
    private TranslatableContent description;

    
    @OneToOne(cascade = CascadeType.ALL)
    @WegasEntityProperty(
            optional = false, nullable = false, proposal = EmptyI18n.class,
            view = @View(label = "Closing remarks", value = I18nHtmlView.class))
    private TranslatableContent descriptionEnd;

    /**
     * List of sections inside this survey
     */
    @OneToMany(mappedBy = "survey", cascade = CascadeType.ALL)
    @JsonManagedReference(value="survey-sections")
    @OrderColumn(name = "index")
    //@JsonView(Views.EditorI.class)
    @WegasEntityProperty(includeByDefault = false,
            optional = false, nullable = false, proposal = ValueGenerators.EmptyArray.class,
            view = @View(value = Hidden.class, label = "Items"), notSerialized = true)
    private List<SurveySectionDescriptor> items = new ArrayList<>();

    
    public SurveyDescriptor() {

    }
    
    /**
     * @return the items (i.e. sections)
     */
    @Override
    @JsonView(Views.ExportI.class)
    public List<SurveySectionDescriptor> getItems() {
        return this.items;
    }
    
    /**
     * @param items the items (i.e. sections) to set
     */
    public void setItems(List<SurveySectionDescriptor> items) {
        this.items = items;
        for (SurveySectionDescriptor ssd : items) {
            ssd.setSurvey(this);
        }
    }

    @Override
    public void setGameModel(GameModel gm) {
        super.setGameModel(gm);
        for (SurveySectionDescriptor ssd : this.getItems()) {
            ssd.setGameModel(gm);
        }
    }

    /**
     *
     * @param item
     */
    @Override
    public void setChildParent(SurveySectionDescriptor item) {
        item.setSurvey(this);
    }


    @Override
    public void resetItemsField() {
        this.items = new ArrayList<>();
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
     * @return the final description
     */
    public TranslatableContent getDescriptionEnd() {
        return descriptionEnd;
    }

    /**
     * @param descriptionEnd the final description to set
     */
    public void setDescriptionEnd(TranslatableContent descriptionEnd) {
        this.descriptionEnd = descriptionEnd;
        if (this.descriptionEnd != null) {
            this.descriptionEnd.setParentDescriptor(this);
        }
    }
    
    
// ~~~~~~ Sugar for scripts ~~~~~~~~
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
    @Scriptable
    public boolean isActive(Player p) {
        return this.getInstance(p).getActive();
    }

    /**
     *
     * @param p
     */
    @Scriptable
    public void activate(Player p) {
        this.setActive(p, true);
    }

    /**
     *
     * @param p
     */
    @Scriptable
    public void deactivate(Player p) {
        this.setActive(p, false);
    }

    /**
     *
     * @param p
     */
    @Scriptable
    public void request(Player p) {
        this.getInstance(p).setRequested(true);
    }

    /**
     *
     * @param p
     */
    @Scriptable
    public void validate(Player p) {
        this.getInstance(p).setValidated(true);
    }

    /**
     *
     * @param p
     */
    @Scriptable
    public void close(Player p) {
        this.getInstance(p).setClosed(true);
    }

    /**
     * Validate the survey.
     * One can no longer answer a validated survey.
     *
     * @param p
     * @param value
     */
    @Scriptable(label = "validate")
    public void setValidated(Player p, @Param(proposal = ValueGenerators.True.class) boolean value) {
        this.getInstance(p).setValidated(value);
    }

    /**
     *
     * @param p
     *
     * @return true if the player has already validated the survey
     */
    @Scriptable(label = "has been validated")
    public boolean isValidated(Player p) {
        return this.getInstance(p).getValidated();
    }

    /**
     * {@link #isValidated ...}
     *
     * @param p
     *
     * @return true if the player has not yet validated the survey
     */
    @Scriptable(label = "has not been validated")
    public boolean isNotValidated(Player p) {
        return !this.getInstance(p).getValidated();
    }

    /**
     *
     * @param p
     *
     * @return true if the player has already started the survey
     */
    @Scriptable(label = "is started")
    public boolean isStarted(Player p) {
        return this.getInstance(p).getStarted();
    }

    /**
     * {@link #isStarted ...}
     *
     * @param p
     *
     * @return true if the player has not yet started the survey
     */
    @Scriptable(label = "is not started")
    public boolean isNotStarted(Player p) {
        return !this.getInstance(p).getStarted();
    }

    /**
     *
     * @param p
     *
     * @return true if the player has closed the survey
     */
    @Scriptable(label = "is closed")
    public boolean isClosed(Player p) {
        return this.getInstance(p).getClosed();
    }

    /**
     * {@link #isStarted ...}
     *
     * @param p
     *
     * @return true if the player has not yet started the survey
     */
    @Scriptable(label = "is not closed")
    public boolean isNotClosed(Player p) {
        return !this.getInstance(p).getClosed();
    }
    

}
