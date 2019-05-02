/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2018 School of Business and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.reviewing.persistence.evaluation;

import com.wegas.core.persistence.annotations.WegasEntityProperty;
import com.wegas.core.persistence.variable.primitive.Enumeration;
import com.fasterxml.jackson.databind.annotation.JsonDeserialize;
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
    @OneToMany(mappedBy = "parentEvaluation", cascade = {CascadeType.ALL}, fetch = FetchType.LAZY, orphanRemoval = true)
    @JsonDeserialize(using = EnumItem.ListDeserializer.class)
    @WegasEntityProperty
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
    public void setContainer(EvaluationDescriptorContainer container) {
        super.setContainer(container);
        if (container !=null){
            this.setCategories(categories);
        }
    }

    @Override
    public void registerItem(EnumItem item) {
        if (item.getLabel() != null && this.getContainer() != null){
            item.getLabel().setParentDescriptor(this.getContainer().getParent());
        }
        item.setParentEvaluation(this);
    }

    @Override
    protected CategorizedEvaluationInstance newInstance() {
        return new CategorizedEvaluationInstance();
    }
}
