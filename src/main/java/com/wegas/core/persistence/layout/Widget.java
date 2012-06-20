/*
 * Wegas.
 * http://www.albasim.com/wegas/
 *
 * School of Business and Engineering Vaud, http://www.heig-vd.ch/
 * Media Engineering :: Information Technology Managment :: Comem
 *
 * Copyright (C) 2012
 */
package com.wegas.core.persistence.layout;

import com.wegas.core.persistence.AbstractEntity;
import com.wegas.core.persistence.game.GameModel;
import com.wegas.core.persistence.NamedEntity;
import java.io.Serializable;
import java.util.logging.Logger;
import javax.persistence.*;
import javax.validation.constraints.NotNull;
import javax.xml.bind.annotation.XmlID;
import javax.xml.bind.annotation.XmlType;
import org.codehaus.jackson.annotate.JsonBackReference;

/**
 *
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
@Entity
@Table(uniqueConstraints =
@UniqueConstraint(columnNames = "name"))
@XmlType(name = "Widget")
public class Widget extends NamedEntity implements Serializable {

    private static final Logger logger = Logger.getLogger("WidgetEntity");
    /**
     *
     */
    @Id
    @XmlID
    @Column(name = "widget_id")
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "widget_seq")
    private Long id;
    /**
     *
     */
    @NotNull
    private String name;
    /**
     *
     */
    @ManyToOne
    @JoinColumn(name = "gamemodelid")
    private GameModel gameModel;
    /**
     *
     */
    @Column(length = 4096)
    private String content;

    /**
     *
     */
    @Override
    public void merge(AbstractEntity n) {
        super.merge(n);
        Widget g = (Widget) n;
        this.setContent(g.getContent());
    }


    /**
     * @return the gameModel
     */
    @JsonBackReference("gamemodel-widget")
    public GameModel getGameModel() {
        return gameModel;
    }

    /**
     * @param gameModel the gameModel to set
     */
    @JsonBackReference("gamemodel-widget")
    public void setGameModel(GameModel gameModel) {
        this.gameModel = gameModel;
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
     * @return the content
     */
    public String getContent() {
        return content;
    }

    /**
     * @param content the content to set
     */
    public void setContent(String content) {
        this.content = content;
    }
}
