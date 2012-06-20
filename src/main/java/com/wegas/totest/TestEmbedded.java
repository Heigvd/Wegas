/*
 * Wegas.
 *
 * http://www.albasim.com/wegas/  *
 * School of Business and Engineering Vaud, http://www.heig-vd.ch/
 * Media Engineering :: Information Technology Managment :: Comem
 *
 * Copyright (C) 2012
 */
package com.wegas.totest;

import java.io.Serializable;
import javax.persistence.Column;
import javax.persistence.Embeddable;

/**
 *
 * @author fx
 */
@Embeddable
public class TestEmbedded implements Serializable {

    @Column(name = "P_NUMBER")
    private String number;

    public TestEmbedded() {
    }

    public TestEmbedded(String mm) {
        this.number = mm;
    }

    /**
     * @return the number
     */
    public String getNumber() {
        return number;
    }

    /**
     * @param number the number to set
     */
    public void setNumber(String number) {
        this.number = number;
    }
}
