
/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.survey.persistence;

import ch.albasim.wegas.annotations.Scriptable;
import ch.albasim.wegas.annotations.View;
import ch.albasim.wegas.annotations.WegasEntityProperty;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonManagedReference;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.annotation.JsonProperty.Access;
import com.fasterxml.jackson.annotation.JsonView;
import com.wegas.core.i18n.persistence.TranslatableContent;
import com.wegas.core.persistence.game.GameModel;
import com.wegas.core.persistence.game.Player;
import com.wegas.core.persistence.variable.Beanjection;
import com.wegas.core.persistence.variable.DescriptorListI;
import com.wegas.core.persistence.variable.VariableDescriptor;
import com.wegas.core.rest.util.Views;
import com.wegas.core.security.ejb.AccountFacade;
import com.wegas.core.security.persistence.token.SurveyToken;
import com.wegas.core.security.persistence.token.Token;
import com.wegas.editor.ValueGenerators;
import com.wegas.editor.ValueGenerators.EmptyI18n;
import com.wegas.editor.view.Hidden;
import com.wegas.editor.view.I18nHtmlView;
import com.wegas.survey.persistence.SurveyInstance.SurveyStatus;
import com.wegas.survey.persistence.input.SurveySectionDescriptor;
import java.util.ArrayList;
import java.util.List;
import javax.persistence.CascadeType;
import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.Index;
import javax.persistence.ManyToMany;
import javax.persistence.OneToMany;
import javax.persistence.OneToOne;
import javax.persistence.OrderColumn;
import javax.persistence.Table;
import javax.persistence.Transient;

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
     * List of sections inside this survey.
     */
    @OneToMany(mappedBy = "survey", cascade = CascadeType.ALL)
    @JsonManagedReference(value = "survey-sections")
    @OrderColumn(name = "index")
    //@JsonView(Views.EditorI.class)
    @WegasEntityProperty(includeByDefault = false,
        optional = false, nullable = false, proposal = ValueGenerators.EmptyArray.class,
        view = @View(value = Hidden.class, label = "Items"), notSerialized = true)
    private List<SurveySectionDescriptor> items = new ArrayList<>();

    /**
     * Invitation to participate to this survey sent by email.
     */
    @ManyToMany
    //@JsonView(Views.ExtendedI.class)
    @JsonIgnore
    private List<SurveyToken> tokens;

    /**
     * Read-only information about presence of any tokens, meaning that players have been invited to
     * the survey by email. Only for use by the trainer dashboard.
     */
    @JsonView(Views.EditorI.class)
    @JsonProperty(access = Access.READ_ONLY)
    public Boolean getHasTokens() {
        return tokens.size() > 0;
    }

    /**
     * True unless it should be hidden from trainer/scenarist listings.
     */
    @Column(columnDefinition = "boolean default true")
    @WegasEntityProperty(
        optional = false, nullable = false, proposal = ValueGenerators.True.class,
        view = @View(label = "isPublished"))
    private Boolean isPublished = true;

    public SurveyDescriptor() {
        // ensure there is an empty constructor
    }

    /**
     * @return the items (i.e. the sections)
     */
    @Override
    @JsonView(Views.ExportI.class)
    @Scriptable(label = "getItems", wysiwyg = false)
    public List<SurveySectionDescriptor> getItems() {
        return this.items;
    }

    /**
     * Get the list of invitation to participate
     *
     * @return invitation sent by email
     */
    public List<SurveyToken> getTokens() {
        return tokens;
    }

    /**
     * Set invitations
     *
     * @param tokens list of invitations
     */
    public void setTokens(List<SurveyToken> tokens) {
        this.tokens = tokens;
    }

    public void removeToken(SurveyToken token) {
        this.tokens.remove(token);
    }

    /**
     * @param items the items (i.e. sections) to set
     */
    @Override
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

    public Boolean getIsPublished() {
        return isPublished;
    }

    public void setIsPublished(Boolean b) {
        isPublished = b;
    }

// ~~~~~~ Sugar for scripts ~~~~~~~~
    /**
     *
     * @param p
     */
    @Scriptable
    public void activate(Player p) {
        this.getInstance(p).setActive(true);
    }

    /**
     *
     * @param p
     */
    @Scriptable
    public void deactivate(Player p) {
        this.getInstance(p).setActive(false);
    }

    /**
     *
     * @param p
     */
    @Scriptable
    public void request(Player p) {
        this.getInstance(p).setStatus(SurveyStatus.REQUESTED);
    }

    /**
     *
     * @param p
     */
    @Scriptable
    public void complete(Player p) {
        this.getInstance(p).setStatus(SurveyStatus.COMPLETED);
    }

    /**
     *
     * @param p
     */
    @Scriptable
    public void close(Player p) {
        this.getInstance(p).setStatus(SurveyStatus.CLOSED);
    }

    /**
     *
     * @param p
     *
     * @return true if the player's survey is active
     */
    @Scriptable(label = "is active")
    public boolean isActive(Player p) {
        return this.getInstance(p).getActive();
    }

    /**
     * {@link #isActive ...}
     *
     * @param p
     *
     * @return true if the player's survey is not active
     */
    @Scriptable(label = "is not active")
    public boolean isNotActive(Player p) {
        return this.getInstance(p).getActive() == false;
    }

    /**
     *
     * @param p
     *
     * @return true if the player has already started the survey
     */
    @Scriptable(label = "is ongoing")
    public boolean isOngoing(Player p) {
        return this.getInstance(p).getStatus() == SurveyStatus.ONGOING;
    }

    /**
     * {@link #isStarted ...}
     *
     * @param p
     *
     * @return true if the player has not yet started the survey
     */
    @Scriptable(label = "is not ongoing")
    public boolean isNotOngoing(Player p) {
        return this.getInstance(p).getStatus() != SurveyStatus.ONGOING;
    }

    /**
     *
     * @param p
     *
     * @return true if the player has already completed the survey
     */
    @Scriptable(label = "has been completed")
    public boolean isCompleted(Player p) {
        return this.getInstance(p).getStatus() == SurveyStatus.COMPLETED;
    }

    /**
     * {@link #isCompleted ...}
     *
     * @param p
     *
     * @return true if the player has not yet completed the survey
     */
    @Scriptable(label = "has not been completed")
    public boolean isNotCompleted(Player p) {
        return this.getInstance(p).getStatus() != SurveyStatus.COMPLETED;
    }

    /**
     *
     * @param p
     *
     * @return true if the player has closed the survey
     */
    @Scriptable(label = "is closed")
    public boolean isClosed(Player p) {
        return this.getInstance(p).getStatus() == SurveyStatus.CLOSED;
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
        return this.getInstance(p).getStatus() != SurveyStatus.CLOSED;
    }

    @Override
    public void updateCacheOnDelete(Beanjection beans) {
        if (this.tokens != null) {
            AccountFacade accountFacade = beans.getAccountFacade();

            for (SurveyToken token : tokens) {
                if (token != null) {
                    Token find = accountFacade.findToken(token.getId());
                    if (find instanceof SurveyToken) {
                        ((SurveyToken) find).removeSurvey(this);
                    }
                }
            }
        }

        super.updateCacheOnDelete(beans);
    }
}
