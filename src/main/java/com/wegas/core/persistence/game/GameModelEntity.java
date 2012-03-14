/*
 * Wegas.
 * http://www.albasim.com/wegas/
 *
 * School of Business and Engineering Vaud, http://www.heig-vd.ch/
 * Media Engineering :: Information Technology Managment :: Comem
 *
 * Copyright (C) 2011
 */
package com.wegas.core.persistence.game;

import com.wegas.core.persistence.layout.WidgetEntity;
import com.wegas.core.persistence.variabledescriptor.VariableDescriptorEntity;
import java.io.Serializable;
import java.util.Collection;
import java.util.List;
import java.util.logging.Logger;
import javax.persistence.*;
import javax.validation.constraints.NotNull;
import javax.xml.bind.annotation.XmlID;
import javax.xml.bind.annotation.XmlTransient;
import javax.xml.bind.annotation.XmlType;
import org.codehaus.jackson.annotate.JsonManagedReference;

/**
 *
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
@Entity
@Table(uniqueConstraints =
@UniqueConstraint(columnNames = "name"))
@XmlType(name = "GameModel", propOrder = {"@class", "id", "name", "teams"})
public class GameModelEntity extends NamedEntity implements Serializable {

    private static final Logger logger = Logger.getLogger("GameModelEntity");
    //private static final Pattern p = Pattern.compile("(^get\\()([a-zA-Z0-9_\"]+)(\\)$)");
    /**
     *
     */
    @Id
    @XmlID
    @Column(name = "gamemodel_id")
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "gamemodel_seq")
    private Long id;
    /**
     *
     */
    @NotNull
    //@Pattern(regexp = "^\\w+$")
    private String name;
    /**
     *
     */
    @OneToMany(mappedBy = "gameModel", cascade = {CascadeType.ALL})
    @JsonManagedReference("gamemodel-variabledescriptor")
    private List<VariableDescriptorEntity> variableDescriptors;
    /**
     *
     */
    @OneToMany(mappedBy = "gameModel", cascade = {CascadeType.ALL})
    @JsonManagedReference("gamemodel-game")
    private List<GameEntity> games;
    /**
     *
     */
    @OneToMany(mappedBy = "gameModel", cascade = {CascadeType.ALL})
    @JsonManagedReference("gamemodel-widget")
    private List<WidgetEntity> widgets;
    /**
     * @fixme temporary solutions to store pages
     */
    private String cssUri;
    /**
     *
     * @fixme temporary solutions to store widgets
     */
    private String widgetsUri;

    /**
     *
     * @param force
     */
    public void propagateDefaultVariableInstance(boolean force) {
        for (VariableDescriptorEntity vd : this.getVariableDescriptors()) {
            vd.getScope().propagateDefaultVariableInstance(force);
        }
    }

    /**
     *
     * @return
     */
    @Override
    public Long getId() {
        return id;
    }

    /**
     *
     * @param id
     */
    @Override
    public void setId(Long id) {
        this.id = id;
    }

    /**
     *
     * @return
     */
    @Override
    public String getName() {
        return name;
    }

    /**
     *
     * @param name
     */
    @Override
    public void setName(String name) {
        this.name = name;
    }

    /**
     *
     * @return
     */
    @JsonManagedReference("gamemodel-variabledescriptor")
    public Collection<VariableDescriptorEntity> getVariableDescriptors() {
        return variableDescriptors;
    }

    /**
     *
     * @param variableDescriptor
     */
    @XmlTransient
    public void addVariableDescriptor(VariableDescriptorEntity variableDescriptor) {
        this.variableDescriptors.add(variableDescriptor);
        variableDescriptor.setGameModel(this);
    }

    /**
     *
     * @param game
     */
    @XmlTransient
    public void addGame(GameEntity game) {
        this.games.add(game);
        game.setGameModel(this);
    }

    /**
     *
     * @param variableDescriptors
     */
    @JsonManagedReference("gamemodel-variabledescriptor")
    public void setVariableDescriptors(List<VariableDescriptorEntity> variableDescriptors) {
        this.variableDescriptors = variableDescriptors;
    }

    /**
     * @return the games
     */
    @JsonManagedReference("gamemodel-game")
    @XmlTransient
    public List<GameEntity> getGames() {
        return games;
    }

    /**
     * @param games the games to set
     */
    @JsonManagedReference("gamemodel-game")
    public void setGames(List<GameEntity> games) {
        this.games = games;
    }

    /**
     * @return the widgets
     */
    @JsonManagedReference("gamemodel-widget")
    @XmlTransient
    public List<WidgetEntity> getWidgets() {
        return widgets;
    }

    /**
     * @param widgets the widgets to set
     */
    @JsonManagedReference("gamemodel-widget")
    public void setWidgets(List<WidgetEntity> widgets) {
        this.widgets = widgets;
    }

    /**
     * @return the cssUri
     */
    public String getCssUri() {
        return cssUri;
    }

    /**
     * @param cssUri the cssUri to set
     */
    public void setCssUri(String cssUri) {
        this.cssUri = cssUri;
    }

    /**
     * @return the widgetsUri
     */
    public String getWidgetsUri() {
        return widgetsUri;
    }

    /**
     * @param widgetsUri the widgetsUri to set
     */
    public void setWidgetsUri(String widgetsUri) {
        this.widgetsUri = widgetsUri;
    }
}
