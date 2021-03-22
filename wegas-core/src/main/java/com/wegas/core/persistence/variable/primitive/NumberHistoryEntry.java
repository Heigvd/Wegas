/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.core.persistence.variable.primitive;

import com.wegas.core.persistence.Orderable;
import java.io.Serializable;
import javax.persistence.Column;
import javax.persistence.Embeddable;

/**
 *
 * @author maxence
 */
@Embeddable
public class NumberHistoryEntry implements Serializable, Orderable {

    private static final long serialVersionUID = -7711310789110595582L;

    @Column(name = "history")
    private Double value;

    @Column(name = "history_order")
    private Integer order;

    public NumberHistoryEntry() {
        // ensure to have an empty constructor
    }

    public NumberHistoryEntry(Double value, int order) {
        this.value = value;
        this.order = order;
    }

    @Override
    public Integer getOrder() {
        return order;
    }

    public void setOrder(Integer order) {
        this.order = order;
    }

    public Double getValue() {
        return value;
    }

    public void setValue(Double value) {
        this.value = value;
    }
}
