/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2018 School of Business and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.test;

import com.wegas.core.ejb.VariableDescriptorFacade;
import com.wegas.core.i18n.persistence.TranslatableContent;
import com.wegas.core.persistence.game.GameModel;
import com.wegas.core.persistence.game.Script;
import com.wegas.core.persistence.variable.DescriptorListI;
import com.wegas.core.persistence.variable.ListDescriptor;
import com.wegas.core.persistence.variable.ListInstance;
import com.wegas.core.persistence.variable.ModelScoped;
import com.wegas.core.persistence.variable.VariableDescriptor;
import com.wegas.core.persistence.variable.primitive.EnumItem;
import com.wegas.core.persistence.variable.primitive.NumberDescriptor;
import com.wegas.core.persistence.variable.primitive.NumberInstance;
import com.wegas.core.persistence.variable.primitive.ObjectDescriptor;
import com.wegas.core.persistence.variable.primitive.ObjectInstance;
import com.wegas.core.persistence.variable.primitive.StringDescriptor;
import com.wegas.core.persistence.variable.primitive.StringInstance;
import com.wegas.core.persistence.variable.scope.TeamScope;
import com.wegas.core.persistence.variable.statemachine.TriggerDescriptor;
import com.wegas.core.persistence.variable.statemachine.TriggerInstance;
import com.wegas.mcq.persistence.Result;
import com.wegas.messaging.persistence.InboxDescriptor;
import com.wegas.messaging.persistence.InboxInstance;
import java.util.ArrayList;
import java.util.List;
import javax.ejb.LocalBean;
import javax.ejb.Stateless;
import javax.inject.Inject;

/**
 *
 * @author maxence
 */
@Stateless
@LocalBean
public class WegasFactory {

    @Inject
    private VariableDescriptorFacade variableDescriptorFacade;

    /**
     * Build a result
     *
     * @param name name and English label
     *
     * @return a new Result
     */
    public Result createResult(String name) {
        Result result = new Result();
        result.setName(name);
        result.setLabel(TranslatableContent.build("en", name));

        return result;
    }

    /**
     * Build a new Result with given name and label.
     *
     * @param name  internal result name
     * @param label result label
     *
     * @return a new result
     */
    public Result createResult(String name, TranslatableContent label) {
        Result result = new Result();
        result.setName(name);
        result.setLabel(label);

        return result;
    }

    public ObjectDescriptor createObjectDescriptor(GameModel gameModel, DescriptorListI parent, String name, String label, ModelScoped.Visibility visibility, String... values) {
        ObjectDescriptor desc = new ObjectDescriptor();
        desc.setName(name);
        desc.setLabel(TranslatableContent.build(gameModel.getLanguages().get(0).getCode(), label));
        desc.setVisibility(visibility);
        desc.setScope(new TeamScope());

        desc.setDefaultInstance(new ObjectInstance());
        ObjectInstance defaultInstance = desc.getDefaultInstance();

        int i = 0;
        for (String prop : values) {
            desc.setProperty("prop" + i, prop);
            defaultInstance.setProperty("prop" + i, prop);
            i++;
        }

        createDescriptor(gameModel, desc, parent);

        return desc;
    }

    public void createDescriptor(GameModel gameModel, VariableDescriptor desc, DescriptorListI parent) {
        if (parent == null || parent instanceof GameModel) {
            variableDescriptorFacade.create(gameModel.getId(), desc);
        } else {
            variableDescriptorFacade.createChild(parent.getId(), desc);
        }
    }


    public NumberDescriptor createNumberDescriptor(GameModel gameModel, DescriptorListI parent, String name, String label, ModelScoped.Visibility visibility, Double min, Double max, Double defaultValue, Double... history) {
        NumberDescriptor desc = new NumberDescriptor();
        List<Double> hist = new ArrayList<>();
        for (Double h : history) {
            hist.add(h);
        }
        desc.setName(name);
        desc.setLabel(TranslatableContent.build(gameModel.getLanguages().get(0).getCode(), label));
        desc.setVisibility(visibility);
        desc.setScope(new TeamScope());
        desc.setMinValue(min);
        desc.setMaxValue(max);
        desc.setDefaultInstance(new NumberInstance());
        desc.getDefaultInstance().setValue(defaultValue);
        desc.getDefaultInstance().setHistory(hist);

        this.createDescriptor(gameModel, desc, parent);

        return desc;
    }

    public TriggerDescriptor createTriggerDescriptor(GameModel gameModel, DescriptorListI parent, String name, String label, ModelScoped.Visibility visibility, String condition, String impact) {
        TriggerDescriptor desc = new TriggerDescriptor();
        desc.setName(name);
        desc.setLabel(TranslatableContent.build(gameModel.getLanguages().get(0).getCode(), label));
        desc.setVisibility(visibility);
        desc.setScope(new TeamScope());

        desc.setOneShot(Boolean.FALSE);
        desc.setDisableSelf(Boolean.FALSE);
        desc.setPostTriggerEvent(new Script("Javascript", impact));
        desc.setTriggerEvent(new Script("Javascript", condition));

        desc.setDefaultInstance(new TriggerInstance());

        this.createDescriptor(gameModel, desc, parent);

        return desc;
    }

    public StringDescriptor createString(GameModel gameModel, DescriptorListI parent, String name, String label, String value, String... allowedValues) {
        StringDescriptor desc = new StringDescriptor();
        desc.setDefaultInstance(new StringInstance());
        desc.setName(name);
        String code = gameModel.getLanguages().get(0).getCode();
        desc.setLabel(TranslatableContent.build(code, label));

        List<EnumItem> items = new ArrayList<>();
        for (String aV : allowedValues) {
            EnumItem enumItem = new EnumItem();
            enumItem.setName(aV);
            enumItem.setLabel(TranslatableContent.build(code, aV));
            items.add(enumItem);
        }
        desc.setAllowedValues(items);

        desc.getDefaultInstance().setTrValue(TranslatableContent.build(code, value));

        this.createDescriptor(gameModel, desc, parent);

        return desc;
    }

    public InboxDescriptor createInbox(GameModel gameModel, DescriptorListI parent, String name, String label) {
        InboxDescriptor desc = new InboxDescriptor();
        desc.setDefaultInstance(new InboxInstance());
        desc.setName(name);
        desc.setLabel(TranslatableContent.build(gameModel.getLanguages().get(0).getCode(), label));

        this.createDescriptor(gameModel, desc, parent);

        return desc;
    }

    public ListDescriptor createList(GameModel gameModel, DescriptorListI parent, String name, String label) {
        ListDescriptor desc = new ListDescriptor();
        desc.setDefaultInstance(new ListInstance());
        desc.setName(name);
        desc.setLabel(TranslatableContent.build(gameModel.getLanguages().get(0).getCode(), label));

        this.createDescriptor(gameModel, desc, parent);

        return desc;
    }


}
