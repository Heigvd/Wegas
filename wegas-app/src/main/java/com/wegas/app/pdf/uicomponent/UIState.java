/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2018 School of Business and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.app.pdf.uicomponent;

import com.wegas.app.pdf.helper.UIHelper;
import com.wegas.core.i18n.ejb.I18nFacade;
import com.wegas.core.persistence.game.Player;
import com.wegas.core.persistence.variable.statemachine.AbstractState;
import com.wegas.core.persistence.variable.statemachine.AbstractTransition;
import com.wegas.core.persistence.variable.statemachine.DialogueState;
import com.wegas.core.persistence.variable.statemachine.DialogueTransition;
import com.wegas.core.persistence.variable.statemachine.State;
import java.io.IOException;
import java.util.List;
import javax.faces.component.FacesComponent;
import javax.faces.component.UIComponentBase;
import javax.faces.context.FacesContext;
import javax.faces.context.ResponseWriter;

/**
 *
 * Faces component that print a StateMachine/Trigger State as xHTML. <br /> <br />
 * <pre>
 * <b>Usage:</b>
 * &lt;<b>State</b> <b>value</b>="#{the State object}"
 *        <b>stateID</b>="State number"
 *        <b>player</b>="#{the player to print the state for (may be the test player)}"
 *        <b>editorMode</b>="#{boolean : toggle editor or player export mode}" /%gt;
 *
 * editorMode: is used regardless currentUser permission (this is quite OK
 *             for the time since this component is only included from a UIGameModel instance,
 *             who has already checked such a permission...)
 * </pre>
 * <p>
 * See WEB-INF/web.xml & WEB-INF/wegas-taglib.xml for tag and params definitions
 *
 * @author Maxence Laurent (maxence.laurent at gmail.com)
 */
@FacesComponent("com.wegas.app.pdf.uicomponent.State")
public class UIState extends UIComponentBase {

    private Boolean editorMode;
    private Player player;
    private I18nFacade i18nFacade;

    public UIState() {
        super();
    }

    public UIState(AbstractState state, Long id, Player player, Boolean editorMode, Boolean defaultValues) {
        this();
        getAttributes().put("value", state);
        getAttributes().put("stateID", id);
        getAttributes().put("player", player);
        getAttributes().put("editorMode", editorMode);
        getAttributes().put("defaultValues", defaultValues);
    }

    private I18nFacade getI18nFacade() {
        if (i18nFacade == null) {
            i18nFacade = I18nFacade.lookup();
        }
        return i18nFacade;
    }

    @Override
    public String getFamily() {
        return "com.wegas.app.pdf.uicomponent.State";
    }

    /**
     * Print State Machine State Please use encodeAll();
     *
     * @param context
     *
     * @throws IOException
     */
    @Override
    public void encodeBegin(FacesContext context) throws IOException {
        super.encodeBegin(context);
        ResponseWriter writer = context.getResponseWriter();

        AbstractState state = (AbstractState) getAttributes().get("value");
        Long id = (Long) getAttributes().get("stateID");
        editorMode = (Boolean) getAttributes().get("editorMode");
        this.player = (Player) getAttributes().get("player");
        //Boolean defaultValues = (Boolean) getAttributes().get("defaultValues");

        UIHelper.startDiv(writer, UIHelper.CSS_CLASS_VARIABLE_CONTAINER);
        UIHelper.printText(context, writer, state.getClass().getSimpleName(), UIHelper.CSS_CLASS_VARIABLE_SUBTITLE);
        UIHelper.printProperty(context, writer, UIHelper.TEXT_ID, id.toString());
        if (state instanceof State){
        UIHelper.printProperty(context, writer, UIHelper.TEXT_NAME, ((State)state).getLabel());
        }

        if (state instanceof DialogueState) {
            UIHelper.printPropertyTextArea(context, writer, UIHelper.TEXT_TEXT, getI18nFacade().interpolate(((DialogueState) state).getText().translateOrEmpty(player), player), false, editorMode);
        }

        UIHelper.printPropertyImpactScript(context, writer, UIHelper.TEXT_ON_ENTER_IMPACT, state.getOnEnterEvent());

        UIHelper.startDiv(writer, UIHelper.CSS_CLASS_FOLDER);

        if (state.getTransitions().isEmpty()) {
            UIHelper.printText(context, writer, "THERE IS NO TRANSITIONS", UIHelper.CSS_CLASS_ERROR);
        } else {
            for (AbstractTransition t : (List<AbstractTransition>)state.getTransitions()) {
                encode(context, writer, t);
            }
        }

        UIHelper.endDiv(writer);
        UIHelper.endDiv(writer);
    }

    public void encode(FacesContext context, ResponseWriter writer, AbstractTransition transition) throws IOException {
        UIHelper.startDiv(writer, UIHelper.CSS_CLASS_VARIABLE_CONTAINER);
        UIHelper.printText(context, writer, transition.getClass().getSimpleName(), UIHelper.CSS_CLASS_VARIABLE_SUBTITLE);

        UIHelper.printProperty(context, writer, UIHelper.TEXT_ID, transition.getId());
        UIHelper.printProperty(context, writer, UIHelper.TEXT_INDEX, transition.getIndex());
        UIHelper.printProperty(context, writer, UIHelper.TEXT_NEXT_STATE, transition.getNextStateId());

        if (transition instanceof DialogueTransition) {
            UIHelper.printPropertyTextArea(context, writer, UIHelper.TEXT_TEXT, getI18nFacade().interpolate(((DialogueTransition) transition).getActionText().translateOrEmpty(player), player), true, editorMode);
        }

        UIHelper.printPropertyScript(context, writer, UIHelper.TEXT_CONDITION, transition.getTriggerCondition());
        UIHelper.printPropertyImpactScript(context, writer, UIHelper.TEXT_IMPACT_TEXT, transition.getPreStateImpact());

        UIHelper.endDiv(writer);
    }

}
