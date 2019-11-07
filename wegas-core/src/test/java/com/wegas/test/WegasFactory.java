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
import com.wegas.core.persistence.variable.ModelScoped.Visibility;
import com.wegas.core.persistence.variable.VariableDescriptor;
import com.wegas.core.persistence.variable.primitive.EnumItem;
import com.wegas.core.persistence.variable.primitive.NumberDescriptor;
import com.wegas.core.persistence.variable.primitive.NumberInstance;
import com.wegas.core.persistence.variable.primitive.ObjectDescriptor;
import com.wegas.core.persistence.variable.primitive.ObjectInstance;
import com.wegas.core.persistence.variable.primitive.StringDescriptor;
import com.wegas.core.persistence.variable.primitive.StringInstance;
import com.wegas.core.persistence.variable.scope.TeamScope;
import com.wegas.core.persistence.variable.statemachine.State;
import com.wegas.core.persistence.variable.statemachine.StateMachineDescriptor;
import com.wegas.core.persistence.variable.statemachine.StateMachineInstance;
import com.wegas.core.persistence.variable.statemachine.Transition;
import com.wegas.core.persistence.variable.statemachine.TriggerDescriptor;
import com.wegas.mcq.persistence.Result;
import com.wegas.messaging.persistence.InboxDescriptor;
import com.wegas.messaging.persistence.InboxInstance;
import com.wegas.resourceManagement.persistence.TaskDescriptor;
import com.wegas.resourceManagement.persistence.TaskInstance;
import java.util.ArrayList;
import java.util.Iterator;
import java.util.List;
import java.util.Map;
import java.util.Map.Entry;
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

    /**
     * Create and persist an ObjectDescriptor.
     * values will be used to initialised both descriptor and default instance properties.
     * Properties: "prop0" -> values[0], "prop1" -> values[1], ..., "propN" -> values[n]
     *
     * @param gameModel  object descriptor owner
     * @param parent     will add the new object to this parent. null means rootlevel descriptor
     * @param name       descriptor name
     * @param label      descriptor label, first language from the gameModel
     * @param visibility descriptor visibility
     * @param values     the properties
     *
     * @return
     */
    public ObjectDescriptor createObjectDescriptor(GameModel gameModel, DescriptorListI parent, String name, String label, Visibility visibility, String... values) {
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

    /**
     * Create a number descriptor in the gameModel.
     *
     *
     * @param gameModel    object descriptor owner
     * @param parent       will add the new object to this parent. null means rootlevel descriptor
     * @param name         descriptor name
     * @param label        descriptor label, first language from the gameModel
     * @param visibility   descriptor visibility
     * @param min          min bound
     * @param max          max bound
     * @param defaultValue default value, must fits within the bounds
     * @param history      past values (optional)
     *
     * @return the brand new number descriptor
     */
    public NumberDescriptor createNumberDescriptor(GameModel gameModel, DescriptorListI parent, String name, String label, Visibility visibility, Double min, Double max, Double defaultValue, Double... history) {
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

    /**
     *
     * @param gameModel  object descriptor owner
     * @param parent     will add the new object to this parent. null means rootlevel descriptor
     * @param name       descriptor name
     * @param label      descriptor label, first language from the gameModel
     * @param visibility descriptor visibility
     * @param condition  JavaScript condition
     * @param impact     JavaScript impact
     *
     * @return the brand new trigger descriptor
     */
    public TriggerDescriptor createTriggerDescriptor(GameModel gameModel, DescriptorListI parent, String name, String label, Visibility visibility, String condition, String impact) {
        TriggerDescriptor desc = new TriggerDescriptor();
        desc.setName(name);
        desc.setLabel(TranslatableContent.build(gameModel.getLanguages().get(0).getCode(), label));
        desc.setVisibility(visibility);
        desc.setScope(new TeamScope());

        desc.setOneShot(Boolean.FALSE);
        desc.setDisableSelf(Boolean.FALSE);
        desc.setPostTriggerEvent(new Script("Javascript", impact));
        desc.setTriggerEvent(new Script("Javascript", condition));

        desc.setDefaultInstance(new StateMachineInstance());

        this.createDescriptor(gameModel, desc, parent);

        return desc;
    }

    /**
     * create an empty state machine.
     *
     * @param gameModel  object descriptor owner
     * @param parent     will add the new object to this parent. null means rootlevel descriptor
     * @param name       descriptor name
     * @param label      descriptor label, first language from the gameModel
     * @param visibility descriptor visibility
     *
     * @return brand new persisted state machine
     */
    public StateMachineDescriptor createStateMachineDescriptor(GameModel gameModel, DescriptorListI parent,
            String name, String label, Visibility visibility) {
        StateMachineDescriptor desc = new StateMachineDescriptor();
        desc.setName(name);
        desc.setLabel(TranslatableContent.build(gameModel.getLanguages().get(0).getCode(), label));
        desc.setVisibility(visibility);
        desc.setScope(new TeamScope());

        desc.setDefaultInstance(new StateMachineInstance());

        this.createDescriptor(gameModel, desc, parent);

        return desc;
    }

    /**
     * Add a state to a state machine.
     * If the new state is the first, it become the default state (default instance current state).
     *
     * @param fsmD   the state machine
     * @param index  the state index
     * @param impact impact to apply
     *
     * @return the updated statemachine
     */
    public StateMachineDescriptor createState(StateMachineDescriptor fsmD, Long index, String impact) {
        StateMachineDescriptor find = (StateMachineDescriptor) variableDescriptorFacade.find(fsmD.getId());

        State state = new State();
        state.setOnEnterEvent(new Script("JavaScript", impact));
        find.addState(index, state);
        if (find.getStates().size() == 1) {
            find.getDefaultInstance().setCurrentStateId(index);
        }

        return find;
    }

    public StateMachineDescriptor removeState(StateMachineDescriptor fsmD, Long index) {

        // remove transition to this state
        for (Entry<Long, State> entry : fsmD.getStates().entrySet()) {
            State state = entry.getValue();

            for (Iterator<Transition> it = state.getTransitions().iterator(); it.hasNext();) {
                Transition t = it.next();
                if (t.getNextStateId() == index) {
                    it.remove();
                }
            }
        }

        fsmD.getStates().remove(fsmD.getStates().get(index));

        StateMachineDescriptor find = (StateMachineDescriptor) variableDescriptorFacade.find(fsmD.getId());
        find.merge(fsmD);

        return find;
    }

    /**
     * Add a transition between to states
     *
     * @param fsmD      the state machine
     * @param from      the transition stating point
     * @param to        the transition target
     * @param condition trigger condition
     * @param impact    transition impact
     * @param index     transition index (priority: lower indexes are evaluated first)
     *
     * @return the updated statemachine
     */
    public StateMachineDescriptor createTransition(StateMachineDescriptor fsmD, Long from, Long to, String condition, String impact, Integer index) {
        StateMachineDescriptor find = (StateMachineDescriptor) variableDescriptorFacade.find(fsmD.getId());

        Transition t = new Transition();
        t.setNextStateId(to);
        t.setIndex(index);
        t.setTriggerCondition(new Script(condition));
        t.setPreStateImpact(new Script(impact));

        Map<Long, State> states = find.getStates();
        State fromState = states.get(from);
        fromState.addTransition(t);

        return find;
    }

public TaskDescriptor createTask(GameModel gameModel, DescriptorListI parent, String name, String label, String index, String description) {
        TaskDescriptor desc = new TaskDescriptor();
        desc.setDefaultInstance(new TaskInstance());
        desc.setName(name);

        String code = gameModel.getLanguages().get(0).getCode();
        desc.setLabel(TranslatableContent.build(code, label));
        desc.setDescription(TranslatableContent.build(code, description));


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
