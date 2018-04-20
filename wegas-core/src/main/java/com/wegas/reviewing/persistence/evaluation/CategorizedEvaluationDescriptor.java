/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2018 School of Business and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.reviewing.persistence.evaluation;

import com.wegas.core.persistence.variable.primitive.Enumeration;
import com.fasterxml.jackson.databind.annotation.JsonDeserialize;
import com.wegas.core.Helper;
import com.wegas.core.exception.client.WegasIncompatibleType;
import com.wegas.core.persistence.AbstractEntity;
import com.wegas.core.persistence.ListUtils;
import com.wegas.core.persistence.variable.primitive.EnumItem;
import java.util.ArrayList;
import java.util.List;
import javax.persistence.CascadeType;
import javax.persistence.Entity;
import javax.persistence.FetchType;
import javax.persistence.OneToMany;

/**
 * Define an evaluation as a categorisation. For instance : [ very bad ; bad ;
 * acceptable ; good ; very good ], [true ; false], [off topic, irrelevant,
 * relevant]
 *
 *
 * @author Maxence Laurent (maxence.laurent at gmail.com)
 */
@Entity
public class CategorizedEvaluationDescriptor
        extends EvaluationDescriptor<CategorizedEvaluationInstance>
        implements Enumeration {

    private static final long serialVersionUID = 1L;

    /**
     * List of allowed categories
     */
    @OneToMany(mappedBy = "parentEvaluation", cascade = {CascadeType.ALL}, fetch = FetchType.LAZY)
    @JsonDeserialize(using = EnumItem.ListDeserializer.class)
    private List<EnumItem> categories = new ArrayList<>();

    /**
     * Get the list of allowed categories
     *
     * @return allowed categories
     */
    public List<EnumItem> getCategories() {
        return this.getSortedEnumItems();
    }

    @Override
    public List<EnumItem> getEnumItems() {
        return this.categories;
    }

    /**
     * set the list of allowed categories
     *
     * @param categories allowed categories
     */
    public void setCategories(List<EnumItem> categories) {
        this.categories = categories;
        if (categories != null) {
            int i = 0;
            for (EnumItem category : this.categories) {
                category.setOrder(i++);
                registerItem(category);
            }
        }
    }

    @Override
    public void registerItem(EnumItem item) {
        item.setParentEvaluation(this);
    }

    @Override
    public void merge(AbstractEntity a) {
        if (a instanceof CategorizedEvaluationDescriptor) {
            super.merge(a);
            CategorizedEvaluationDescriptor o = (CategorizedEvaluationDescriptor) a;
            // make sure to use getCategories to sort them
            this.setCategories(ListUtils.mergeLists(this.getCategories(), o.getCategories()));
        } else {
            throw new WegasIncompatibleType(this.getClass().getSimpleName() + ".merge (" + a.getClass().getSimpleName() + ") is not possible");
        }
    }

    @Override
    public Boolean containsAll(List<String> criterias) {
        return super.containsAll(criterias)
                || this.itemsContainsAll(criterias);
    }

    @Override
    protected CategorizedEvaluationInstance newInstance() {
        return new CategorizedEvaluationInstance();
    }
}
