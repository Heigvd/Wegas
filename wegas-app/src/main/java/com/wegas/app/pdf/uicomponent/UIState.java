/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.app.pdf.uicomponent;

import com.wegas.app.pdf.helper.UIHelper;
import com.wegas.core.persistence.variable.statemachine.DialogueState;
import com.wegas.core.persistence.variable.statemachine.DialogueTransition;
import com.wegas.core.persistence.variable.statemachine.State;
import com.wegas.core.persistence.variable.statemachine.Transition;
import java.io.IOException;
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
*        <b>player</b>="#{the player to print the state for (may be the default player)}"
*        <b>editorMode</b>="#{boolean : toggle editor or player export mode}" /%gt;
* 
 * editorMode: is used regardless currentUser permission (this is quite OK 
 *             for the time since this component is only included from a UIGameModel instance,
 *             who has already checked such a permission...)
 * </pre>
 * 
* See WEB-INF/web.xml & WEB-INF/wegas-taglib.xml for tag and params definitions
*
 * @author Maxence Laurent (maxence.laurent at gmail.com)
 */
@FacesComponent("com.wegas.app.pdf.uicomponent.State")
public class UIState extends UIComponentBase {

    private Boolean editorMode;

    @Override
    public String getFamily() {
        return "com.wegas.app.pdf.uicomponent.State";
    }

    /**
     * Print State Machine State
     * Please use encodeAll();
     *
     * @param context
     * @throws IOException
     */
    @Override
    public void encodeBegin(FacesContext context) throws IOException {
        super.encodeBegin(context);
        ResponseWriter writer = context.getResponseWriter();

        State state = (State) getAttributes().get("value");
        Long id = (Long) getAttributes().get("stateID");
        editorMode = (Boolean) getAttributes().get("editorMode");

        UIHelper.startDiv(writer, UIHelper.CSS_CLASS_VARIABLE_CONTAINER);
        UIHelper.printText(context, writer, state.getClass().getSimpleName(), UIHelper.CSS_CLASS_VARIABLE_SUBTITLE);
        UIHelper.printProperty(context, writer, UIHelper.TEXT_ID, id.toString());
        UIHelper.printProperty(context, writer, UIHelper.TEXT_NAME, state.getLabel());

        if (state instanceof DialogueState) {
            UIHelper.printPropertyTextArea(context, writer, UIHelper.TEXT_TEXT, ((DialogueState) state).getText(), false, editorMode);
        }

        UIHelper.printPropertyImpactScript(context, writer, UIHelper.TEXT_ON_ENTER_IMPACT, state.getOnEnterEvent());

        UIHelper.startDiv(writer, UIHelper.CSS_CLASS_FOLDER);

        if (state.getTransitions().isEmpty()) {
            UIHelper.printText(context, writer, "THERE IS NO TRANSITIONS", UIHelper.CSS_CLASS_ERROR);
        } else {
            for (Transition t : state.getTransitions()) {
                encode(context, writer, t);
            }
        }

        UIHelper.endDiv(writer);
        UIHelper.endDiv(writer);
    }

    public void encode(FacesContext context, ResponseWriter writer, Transition transition) throws IOException {
        UIHelper.startDiv(writer, UIHelper.CSS_CLASS_VARIABLE_CONTAINER);
        UIHelper.printText(context, writer, transition.getClass().getSimpleName(), UIHelper.CSS_CLASS_VARIABLE_SUBTITLE);

        UIHelper.printProperty(context, writer, UIHelper.TEXT_ID, transition.getId());
        UIHelper.printProperty(context, writer, UIHelper.TEXT_INDEX, transition.getIndex());
        UIHelper.printProperty(context, writer, UIHelper.TEXT_NEXT_STATE, transition.getNextStateId());

        if (transition instanceof DialogueTransition) {
            UIHelper.printPropertyTextArea(context, writer, UIHelper.TEXT_TEXT, ((DialogueTransition) transition).getActionText(), true, editorMode);
        }

        UIHelper.printPropertyScript(context, writer, UIHelper.TEXT_CONDITION, transition.getTriggerCondition());
        UIHelper.printPropertyImpactScript(context, writer, UIHelper.TEXT_IMPACT_TEXT, transition.getPreStateImpact());

        UIHelper.endDiv(writer);
    }

}
