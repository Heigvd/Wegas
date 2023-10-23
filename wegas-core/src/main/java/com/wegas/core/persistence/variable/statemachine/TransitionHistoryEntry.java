/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.core.persistence.variable.statemachine;

import com.wegas.core.persistence.Orderable;
import java.io.Serializable;
import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;

/**
 *
 * @author maxence
 */
@Embeddable
public class TransitionHistoryEntry implements Serializable, Orderable {

    private static final long serialVersionUID = -7711310789110595582L;

    @Column(name = "transitionid")
    private Long tansitionId;

    @Column(name = "transition_order")
    private Integer order;

    public TransitionHistoryEntry() {
        // ensure to have an empty constructor
    }

    public TransitionHistoryEntry(Long tansitionId, Integer order) {
        this.tansitionId = tansitionId;
        this.order = order;
    }

    @Override
    public Integer getOrder() {
        return order;
    }

    public void setOrder(Integer order) {
        this.order = order;
    }

    public Long getTansitionId() {
        return tansitionId;
    }

    public void setTansitionId(Long tansitionId) {
        this.tansitionId = tansitionId;
    }
}
