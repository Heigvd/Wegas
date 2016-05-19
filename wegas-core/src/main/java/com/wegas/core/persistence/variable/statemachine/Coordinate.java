/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013, 2014, 2015 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.core.persistence.variable.statemachine;

import java.io.Serializable;
import javax.persistence.Column;
import javax.persistence.Embeddable;
import com.fasterxml.jackson.annotation.JsonTypeInfo;

/**
 *
 * @author Cyril Junod (cyril.junod at gmail.com)
 */
@Embeddable
@JsonTypeInfo(use = JsonTypeInfo.Id.NAME, include = JsonTypeInfo.As.PROPERTY, property = "@class")
public class Coordinate implements Serializable {

    private static final long serialVersionUID = 1L;
    @Column(columnDefinition = "SMALLINT")
    private Integer x;
    @Column(columnDefinition = "SMALLINT")
    private Integer y;

    /**
     *
     */
    public Coordinate() {
    }

    /**
     *
     * @return
     */
    public Integer getX() {
        return x;
    }

    /**
     *
     * @param x
     */
    public void setX(Integer x) {
        this.x = x;
    }

    /**
     *
     * @return
     */
    public Integer getY() {
        return y;
    }

    /**
     *
     * @param y
     */
    public void setY(Integer y) {
        this.y = y;
    }

    @Override
    public String toString() {
        return "EditorPositions{" + "X=" + x + ", Y=" + y + '}';
    }
}
