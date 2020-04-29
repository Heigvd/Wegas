/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2018 School of Business and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.app.pdf.uicomponent;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.wegas.app.pdf.helper.UIHelper;
import com.wegas.core.i18n.ejb.I18nFacade;
import com.wegas.core.persistence.game.Player;
import com.wegas.core.persistence.variable.ListDescriptor;
import com.wegas.core.persistence.variable.VariableDescriptor;
import com.wegas.core.persistence.variable.VariableInstance;
import com.wegas.core.persistence.variable.primitive.BooleanDescriptor;
import com.wegas.core.persistence.variable.primitive.BooleanInstance;
import com.wegas.core.persistence.variable.primitive.NumberDescriptor;
import com.wegas.core.persistence.variable.primitive.NumberInstance;
import com.wegas.core.persistence.variable.primitive.ObjectDescriptor;
import com.wegas.core.persistence.variable.primitive.StringDescriptor;
import com.wegas.core.persistence.variable.primitive.StringInstance;
import com.wegas.core.persistence.variable.primitive.TextDescriptor;
import com.wegas.core.persistence.variable.primitive.TextInstance;
import com.wegas.core.persistence.variable.statemachine.AbstractStateMachineDescriptor;
import com.wegas.core.persistence.variable.statemachine.DialogueDescriptor;
import com.wegas.core.persistence.variable.statemachine.State;
import com.wegas.core.persistence.variable.statemachine.StateMachineDescriptor;
import com.wegas.core.persistence.variable.statemachine.StateMachineInstance;
import com.wegas.core.persistence.variable.statemachine.TriggerDescriptor;
import com.wegas.mcq.persistence.ChoiceDescriptor;
import com.wegas.mcq.persistence.ChoiceInstance;
import com.wegas.mcq.persistence.QuestionDescriptor;
import com.wegas.mcq.persistence.QuestionInstance;
import com.wegas.mcq.persistence.Reply;
import com.wegas.mcq.persistence.Result;
import com.wegas.mcq.persistence.SingleResultChoiceDescriptor;
import com.wegas.mcq.persistence.wh.WhQuestionDescriptor;
import com.wegas.mcq.persistence.wh.WhQuestionInstance;
import com.wegas.messaging.persistence.InboxDescriptor;
import com.wegas.messaging.persistence.InboxInstance;
import com.wegas.messaging.persistence.Message;
import com.wegas.resourceManagement.persistence.ResourceDescriptor;
import com.wegas.resourceManagement.persistence.ResourceInstance;
import com.wegas.resourceManagement.persistence.TaskDescriptor;
import com.wegas.resourceManagement.persistence.TaskInstance;
import com.wegas.resourceManagement.persistence.WRequirement;
import java.io.IOException;
import java.lang.reflect.InvocationTargetException;
import java.lang.reflect.Method;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import javax.faces.component.FacesComponent;
import javax.faces.component.UIComponentBase;
import javax.faces.component.html.HtmlGraphicImage;
import javax.faces.context.FacesContext;
import javax.faces.context.ResponseWriter;

/**
 *
 * Faces component that print a VariableDescriptor as xHTML.
 * <p>
 * <p>
 * <
 * pre>
 * <b>Usage:</b>
 * &lt;<b>VariableDescriptor</b> <b>value</b>="#{the varDesc object}"
 * <b>player</b>="#{the player to print the varDesc for (may be the test player)}"
 * <b>editorMode</b>="#{boolean : toggle editor or player export mode}" /%gt;
 * <p>
 * editorMode: is used regardless currentUser permission (this is quite OK
 * for the time since this component is only included from a UIGameModel instance,
 * who has already checked such a permission...)
 * </pre>
 *
 * @TODO : editorMode is used regardless currentUser permission (this is quite
 * OK for the time since this component is only included from a UIGameModel
 * instance, who has already checked such a permission...)
 *
 * See WEB-INF/web.xml & WEB-INF/wegas-taglib.xml for tag and params definitions
 *
 * @author Maxence Laurent (maxence.laurent at gmail.com)
 */

/*FACES 2.2 : @FacesComponent(createTag = true, tagName = "VariableDesc", namespace = "http://xmlns.jcp.org/jsf/wegas-pdf")*/
@FacesComponent("com.wegas.app.pdf.uicomponent.VariableDescriptor")
public class UIVariableDescriptor extends UIComponentBase {

    public UIVariableDescriptor() {
        super();
    }

    public UIVariableDescriptor(VariableDescriptor vd, Player player, Boolean editorMode, Boolean defaultValue) {
        super();
        getAttributes().put("value", vd);
        getAttributes().put("player", player);
        getAttributes().put("editorMode", editorMode);
        getAttributes().put("defaultValues", defaultValue);
    }

    Player player;
    Boolean editorMode;
    Boolean defaultValues;

    private I18nFacade i18nFacade;

    @Override
    public String getFamily() {
        return "com.wegas.app.pdf.uicomponent.VariableDescriptor";
    }

    private I18nFacade getI18nFacade() {
        if (i18nFacade == null) {
            i18nFacade = I18nFacade.lookup();
        }
        return i18nFacade;
    }

    /**
     * Print a variable descriptor Please use encodeAll() and dont forget to add
     * attributes
     *
     * @param context
     *
     * @throws IOException
     */
    @Override
    public void encodeBegin(FacesContext context) throws IOException {
        VariableDescriptor vd = (VariableDescriptor) getAttributes().get("value");
        player = (Player) getAttributes().get("player");
        editorMode = (Boolean) getAttributes().get("editorMode");
        defaultValues = (Boolean) getAttributes().get("defaultValues");

        if (vd != null) {
            ResponseWriter responseWriter = context.getResponseWriter();
            dispatch(context, responseWriter, vd);
        } else {
            throw new IOException("Missing required attribute(s)");
        }
    }

    /**
     * According to VariableDescriptor type, branches the correct encode method
     * <p>
     * Todo : use inheritance...
     *
     * @param context
     * @param writer
     * @param vDesc   the variable descriptor to encode
     *
     * @throws IOException
     */
    private void dispatch(FacesContext context, ResponseWriter writer, VariableDescriptor vDesc) throws IOException {
        switch (vDesc.getClass().getSimpleName().replaceAll("Descriptor", "")) {
            case "List":
                encode(context, writer, (ListDescriptor) vDesc);
                break;
            case "WhQuestion":
                encode(context, writer, (WhQuestionDescriptor) vDesc);
                break;
            case "Question":
                encode(context, writer, (QuestionDescriptor) vDesc);
                break;
            case "Object":
                encode(context, writer, (ObjectDescriptor) vDesc);
                break;
            case "String":
                encode(context, writer, (StringDescriptor) vDesc);
                break;
            case "Text":
                encode(context, writer, (TextDescriptor) vDesc);
                break;
            case "Dialogue":
                encode(context, writer, (DialogueDescriptor) vDesc);
                break;
            case "Trigger":
                encode(context, writer, (TriggerDescriptor) vDesc);
                break;
            case "StateMachine":
                encode(context, writer, (StateMachineDescriptor) vDesc);
                break;
            case "Resource":
                encode(context, writer, (ResourceDescriptor) vDesc);
                break;
            case "Task":
                encode(context, writer, (TaskDescriptor) vDesc);
                break;
            case "Inbox":
                encode(context, writer, (InboxDescriptor) vDesc);
                break;
            case "Number":
                encode(context, writer, (NumberDescriptor) vDesc);
                break;
            case "Boolean":
                encode(context, writer, (BooleanDescriptor) vDesc);
                break;
            default:
                fallback(context, writer, vDesc);
                break;
        }

    }

    /**
     * Print properties that are common to all VaraibleDescriptor (kind of
     * super.encode())
     *
     * @param context
     * @param writer
     * @param vDesc
     *
     * @throws IOException
     */
    private void encodeBase(FacesContext context, ResponseWriter writer, VariableDescriptor vDesc, Boolean editorMode) throws IOException {
        String type = vDesc.getClass().getSimpleName();
        String title;

        UIHelper.startDiv(writer, UIHelper.CSS_CLASS_VARIABLE_CONTAINER + " wegas-pdf-" + type + " wegas-variable-" + vDesc.getName());
        /**
         * Some entity have a specific label to be displayed for players (called
         * title) if any, use it rather than std label
         */
        if (editorMode) {
            title = vDesc.getEditorLabel();
        } else {
            title = getI18nFacade().interpolate(vDesc.getLabel().translateOrEmpty(player), player);
        }

        writer.write("<a name=\"vd" + vDesc.getId() + "\" />");
        UIHelper.printText(context, writer, title, UIHelper.CSS_CLASS_VARIABLE_TITLE
                + " " + UIHelper.CSS_CLASS_PREFIX + type.toLowerCase());

        //UIHelper.printProperty(context, writer, "Internal Type", vDesc.getClass().getSimpleName());
        //UIHelper.printProperty(context, writer, UIHelper.TEXT_NAME, vDesc.getLabel());
        if (editorMode) {
            UIHelper.printProperty(context, writer, "Type", type);
            UIHelper.printProperty(context, writer, "ScriptAlias", vDesc.getName());
        }
    }

    /**
     *
     * This basic encode method detect all getter from the variable descriptor
     * and display their values
     *
     * @param context
     * @param writer
     * @param vDesc
     *
     * @throws IOException
     */
    public void fallback(FacesContext context, ResponseWriter writer, VariableDescriptor vDesc) throws IOException {
        // Never show to players
        if (editorMode) {
            VariableInstance instance = vDesc.getInstance(defaultValues, player);

            //UIHelper.startDiv(writer, UIHelper.CSS_CLASS_VARIABLE_CONTAINER);
            encodeBase(context, writer, vDesc, editorMode);
            UIHelper.printText(context, writer, "Fallback", UIHelper.CSS_CLASS_ERROR);

            printMethods(context, writer, "Descriptor", vDesc);
            printMethods(context, writer, "Instance", instance);

            UIHelper.endDiv(writer);
        }
    }

    private static void printMethods(FacesContext context, ResponseWriter writer, String title, Object o) throws IOException {
        UIHelper.printText(context, writer, title, UIHelper.CSS_CLASS_VARIABLE_SUBSUBTITLE);
        for (Method m : o.getClass().getDeclaredMethods()) {
            // Only care about non-JsonIgnored getter
            if (m.getName().matches("^get.*")
                    && m.getParameterTypes().length == 0
                    && m.getAnnotation(JsonIgnore.class) == null) {
                try {
                    Object invoke = m.invoke(o);
                    String name, value;
                    name = m.getName().replaceFirst("get", "");
                    value = "N/A";
                    if (invoke != null) {
                        value = invoke.toString();
                    }
                    UIHelper.printProperty(context, writer, name, value);
                } catch (IllegalAccessException | IllegalArgumentException | InvocationTargetException ex) {
                }
            }
        }

    }

    /**
     * Specific output for TextDescriptor
     *
     * @param context
     * @param writer
     * @param obj
     *
     * @throws IOException
     */
    public void encode(FacesContext context, ResponseWriter writer, TextDescriptor obj) throws IOException {
        //UIHelper.startDiv(writer, UIHelper.CSS_CLASS_VARIABLE_CONTAINER);
        encodeBase(context, writer, obj, editorMode);
        TextInstance instance = obj.getInstance(defaultValues, player);
        UIHelper.printPropertyTextArea(context, writer, "Value", getI18nFacade().interpolate(instance.getTrValue().translateOrEmpty(player), player), false, true);
        UIHelper.endDiv(writer);
    }

    /**
     * Specific output for TextDescriptor
     *
     * @param context
     * @param writer
     * @param obj
     *
     * @throws IOException
     */
    public void encode(FacesContext context, ResponseWriter writer, StringDescriptor obj) throws IOException {
        //UIHelper.startDiv(writer, UIHelper.CSS_CLASS_VARIABLE_CONTAINER);
        encodeBase(context, writer, obj, editorMode);

        StringInstance instance = obj.getInstance(defaultValues, player);
        UIHelper.printPropertyTextArea(context, writer, "Value", getI18nFacade().interpolate(instance.getTrValue().translateOrEmpty(player), player), false, true);
        UIHelper.endDiv(writer);
    }

    /**
     * Specific output for TaskDescriptor
     *
     * @param context
     * @param writer
     * @param task
     *
     * @throws IOException
     */
    public void encode(FacesContext context, ResponseWriter writer, TaskDescriptor task) throws IOException {
        TaskInstance instance = task.getInstance(defaultValues, player);

        // dont't print inactive tasks for players, but always print them for editors
        if ((editorMode) || (instance.getActive())) {
            //UIHelper.startDiv(writer, UIHelper.CSS_CLASS_VARIABLE_CONTAINER);
            encodeBase(context, writer, task, editorMode);

            UIHelper.printPropertyTextArea(context, writer, UIHelper.TEXT_DESCRIPTION, getI18nFacade().interpolate(task.getDescription().translateOrEmpty(player), player), false, editorMode);

            if (editorMode) {
                if (task.getIndex() != null) {
                    UIHelper.printProperty(context, writer, UIHelper.TEXT_INDEX, task.getIndex());
                }
                UIHelper.printProperty(context, writer, UIHelper.TEXT_ACTIVE, instance.getActive());
            }

            UIHelper.printProperty(context, writer, UIHelper.TEXT_DURATION, instance.getProperty("duration"));

            // Should hide some properties to players...
            UIHelper.printKeyValueMap(context, writer, instance.getProperties());
            UIHelper.printKeyValueMap(context, writer, task.getProperties());

            UIHelper.printText(context, writer, UIHelper.TEXT_PREDECESSORS, UIHelper.CSS_CLASS_VARIABLE_SUBTITLE);

            UIHelper.startDiv(writer, UIHelper.CSS_CLASS_VARIABLE_CONTAINER);
            writer.startElement("ul", this);
            if (task.getPredecessorNames().isEmpty()) {
                writer.startElement("li", this);
                UIHelper.printText(context, writer, "[NONE]", UIHelper.CSS_CLASS_PROPERTY_VALUE_NA);
                writer.endElement("li");
            } else {
                for (String p : task.getPredecessorNames()) {
                    writer.startElement("li", this);
                    UIHelper.printText(context, writer, p, null);
                    writer.endElement("li");
                }
            }
            writer.endElement("ul");

            UIHelper.endDiv(writer); // end predecessors div

            UIHelper.printText(context, writer, UIHelper.TEXT_REQUIERMENT_REQUIERMENTS, UIHelper.CSS_CLASS_VARIABLE_SUBTITLE);

            UIHelper.startDiv(writer, UIHelper.CSS_CLASS_VARIABLE_CONTAINER);
            writer.startElement("ul", this);
            for (WRequirement req : task.getDefaultInstance().getRequirements()) {
                String str = req.getQuantity() + "x " + req.getWork() + " lvl " + req.getLevel() + " (limit=" + req.getLimit() + ")";
                writer.startElement("li", this);
                UIHelper.printText(context, writer, str, null);
                writer.endElement("li");
            }
            writer.endElement("ul");
            UIHelper.endDiv(writer); // end Requierments

            UIHelper.endDiv(writer); // end main container
        }
    }

    /**
     * Specific output for ResourceDescriptor
     * <p>
     * Display all properties
     *
     * @param context
     * @param writer
     * @param resource
     *
     * @throws IOException
     * @todo PLAYER
     */
    public void encode(FacesContext context, ResponseWriter writer, ResourceDescriptor resource) throws IOException {
        ResourceInstance instance = resource.getInstance(defaultValues, player);

        // Hide inactive resources for players
        if ((editorMode) || (instance.getActive())) {
            //UIHelper.startDiv(writer, UIHelper.CSS_CLASS_VARIABLE_CONTAINER);
            encodeBase(context, writer, resource, editorMode);
            UIHelper.printProperty(context, writer, UIHelper.TEXT_LABEL, resource.getLabel());

            UIHelper.printPropertyTextArea(context, writer, UIHelper.TEXT_DESCRIPTION, getI18nFacade().interpolate(resource.getDescription().translateOrEmpty(player), player), false, editorMode);

            /*if (!instance.getSkillsets().isEmpty()) {
                UIHelper.printProperty(context, writer, UIHelper.TEXT_MAIN_SKILL, instance.getMainSkill() + " (lvl: " + resource.getDefaultInstance().getMainSkillLevel() + ")");
            }*/
            //UIHelper.printProperty(context, writer, UIHelper.TEXT_MORAL, instance.getPropertyD("motivation"));
            UIHelper.printProperty(context, writer, UIHelper.TEXT_CONFIDENCE, instance.getConfidence());

            if (editorMode) {
                UIHelper.printProperty(context, writer, UIHelper.TEXT_ACTIVE, instance.getActive());
            }

            //TODO  should hide some to players...
            UIHelper.printKeyValueMap(context, writer, resource.getProperties());
            UIHelper.printKeyValueMap(context, writer, resource.getDefaultInstance().getProperties());

            UIHelper.endDiv(writer);
        }
    }

    /**
     * Specific output for ObjectDescriptor Display all properties
     *
     * @param context
     * @param writer
     * @param obj
     *
     * @throws IOException
     * @todo PLAYER
     */
    public void encode(FacesContext context, ResponseWriter writer, ObjectDescriptor obj) throws IOException {
        if (editorMode) {
            //UIHelper.startDiv(writer, UIHelper.CSS_CLASS_VARIABLE_CONTAINER);
            encodeBase(context, writer, obj, editorMode);
            UIHelper.printPropertyTextArea(context, writer, UIHelper.TEXT_DESCRIPTION, obj.getDescription(), false, editorMode);
            UIHelper.printKeyValueMap(context, writer, obj.getProperties(), "Object Properties");
            UIHelper.printKeyValueMap(context, writer, obj.getDefaultInstance().getProperties(), "Default Properties");
            UIHelper.endDiv(writer);
        }
    }

    /**
     * Specific output for ListDescriptor. Print all children
     *
     * @param context
     * @param writer
     * @param list
     *
     * @throws IOException
     */
    public void encode(FacesContext context, ResponseWriter writer, ListDescriptor list) throws IOException {
        //UIHelper.startDiv(writer, UIHelper.CSS_CLASS_VARIABLE_CONTAINER);
        encodeBase(context, writer, list, editorMode);

        if (list.getItems().isEmpty()) {
            UIHelper.printText(context, writer, "[Empty Folder]", UIHelper.CSS_CLASS_PROPERTY_VALUE_NA);
        } else {
            UIHelper.startDiv(writer, UIHelper.CSS_CLASS_FOLDER);
            for (VariableDescriptor vd : list.getItems()) {

                UIVariableDescriptor uiVd = new UIVariableDescriptor(vd, player, editorMode, defaultValues);
                uiVd.encodeAll(context);
            }
            UIHelper.endDiv(writer);
        }
        UIHelper.endDiv(writer);
    }

    /**
     * Specific behaviour for WhQuestionDescriptor
     *
     * @param context
     * @param writer
     * @param question
     *
     * @throws IOException
     */
    public void encode(FacesContext context, ResponseWriter writer, WhQuestionDescriptor question) throws IOException {
        WhQuestionInstance instance = question.getInstance(defaultValues, player);

        // dont't print inactive questions for players, but always print them for editors
        if ((editorMode) || (instance.getActive())) {
            //UIHelper.startDiv(writer, UIHelper.CSS_CLASS_VARIABLE_CONTAINER);
            encodeBase(context, writer, question, editorMode);

            UIHelper.printPropertyTextArea(context, writer, UIHelper.TEXT_DESCRIPTION, getI18nFacade().interpolate(question.getDescription().translateOrEmpty(player), player), false, editorMode);

            if (editorMode) {
                UIHelper.printProperty(context, writer, UIHelper.TEXT_ACTIVE, instance.getActive());
            }

            for (VariableDescriptor item : question.getItems()) {
                dispatch(context, writer, item);
            }
        }
        UIHelper.endDiv(writer);
    }

    /**
     * Specific behaviour for QuestionDescriptor
     *
     * @param context
     * @param writer
     * @param question
     *
     * @throws IOException
     */
    public void encode(FacesContext context, ResponseWriter writer, QuestionDescriptor question) throws IOException {
        QuestionInstance instance = question.getInstance(defaultValues, player);

        // dont't print inactive questions for players, but always print them for editors
        if ((editorMode) || (instance.getActive())) {
            //UIHelper.startDiv(writer, UIHelper.CSS_CLASS_VARIABLE_CONTAINER);
            encodeBase(context, writer, question, editorMode);

            UIHelper.startDiv(writer, UIHelper.CSS_CLASS_COLUMNS);
            UIHelper.startDiv(writer, UIHelper.CSS_CLASS_PICTURES + " " + UIHelper.CSS_CLASS_COLUMN);
            for (String picture : question.getPictures()) {

                UIHelper.startDiv(writer, UIHelper.CSS_CLASS_PICTURE);

                String imgSrc = "/rest/GameModel/" + question.getGameModel().getId() + "/File/read/" + picture;
                UIHelper.printProperty(context, writer, "Picture", picture);
                HtmlGraphicImage image = new HtmlGraphicImage();
                image.setValue(imgSrc);
                image.encodeAll(context);
                UIHelper.endDiv(writer);
            }
            UIHelper.endDiv(writer); // end COLUMN

            UIHelper.startDiv(writer, UIHelper.CSS_CLASS_COLUMN);

            if (question.getDescription() != null) {
                UIHelper.printPropertyTextArea(context, writer, UIHelper.TEXT_DESCRIPTION, getI18nFacade().interpolate(question.getDescription().translateOrEmpty(player), player), false, editorMode);
            }

            if (editorMode) {
                UIHelper.printProperty(context, writer, "Min: ", question.getMinReplies());
                UIHelper.printProperty(context, writer, "Max: ", question.getMaxReplies());
                UIHelper.printProperty(context, writer, UIHelper.TEXT_ACTIVE, instance.getActive());
            }

            UIHelper.endDiv(writer); // end COLUMN
            UIHelper.endDiv(writer); // end COLUMNS

            if (question.getMaxReplies() == null || instance.getSortedReplies(player).size() < question.getMaxReplies()) {
                for (ChoiceDescriptor choice : question.getItems()) {
                    encode(context, writer, choice);
                }
            }

            /*
             * Replies
             */
            List<Reply> replies = instance.getSortedReplies(player);

            if (!replies.isEmpty()) {
                //UIHelper.printText(context, writer, "Results:", UIHelper.CSS_CLASS_VARIABLE_SUBTITLE);
                for (Reply r : replies) {
                    //UIHelper.printText(context, writer, r.getResult().getChoiceDescriptor().getLabel(), UIHelper.CSS_CLASS_VARIABLE_SUBSUBTITLE);
                    UIResult uiResult = new UIResult(r.getResult(), player, editorMode, defaultValues);
                    uiResult.encodeAll(context);
                }
            }
            UIHelper.endDiv(writer);
        }
    }

    /**
     * Specific for ChoiceDescriptor
     *
     * @param context
     * @param writer
     * @param choice
     *
     * @throws IOException
     */
    public void encode(FacesContext context, ResponseWriter writer, ChoiceDescriptor choice) throws IOException {
        ChoiceInstance instance = choice.getInstance(defaultValues, player);
        // dont't print inactive choices for players, but always print them for editors
        if ((editorMode) || instance.getActive()) {

            //UIHelper.startDiv(writer, UIHelper.CSS_CLASS_VARIABLE_CONTAINER);
            encodeBase(context, writer, choice, editorMode);

            if (choice.getDescription() != null) {
                UIHelper.printPropertyTextArea(context, writer, UIHelper.TEXT_DESCRIPTION,
                        getI18nFacade().interpolate(choice.getDescription().translateOrEmpty(player), player), false, editorMode);
            }

            if (editorMode) {
                UIHelper.printProperty(context, writer, UIHelper.TEXT_ACTIVE, instance.getActive());

                UIHelper.printProperty(context, writer, "Max: ", choice.getMaxReplies());

                if (choice instanceof SingleResultChoiceDescriptor == false) {
                    // Not a "single result" choice ? print the default result name
                    String resultName;
                    if (choice.getResults() == null || choice.getResults().isEmpty()) {
                        resultName = UIHelper.TEXT_NOT_AVAILABLE;
                    } else if (instance.getCurrentResult() == null) {
                        resultName = choice.getResults().get(0).getName();
                    } else {
                        resultName = instance.getCurrentResult().getName();
                    }
                    UIHelper.printProperty(context, writer, UIHelper.TEXT_DEFAULT_RESULT, resultName);
                }

                if (choice.getResults() == null || choice.getResults().isEmpty()) {
                    UIHelper.printText(context, writer, "THERE IS NO RESULTS", UIHelper.CSS_CLASS_ERROR);
                } else {
                    for (Result result : choice.getResults()) {
                        if (choice instanceof SingleResultChoiceDescriptor == false) {
                            UIHelper.startDiv(writer, UIHelper.CSS_CLASS_VARIABLE_CONTAINER);
                        }

                        UIResult uiResult = new UIResult(result, player, editorMode, defaultValues);
                        uiResult.encodeAll(context);

                        if (choice instanceof SingleResultChoiceDescriptor == false) {
                            UIHelper.endDiv(writer);
                        }
                    }
                }
            }
            UIHelper.endDiv(writer);
        }
    }

    /**
     * Output for Triggers
     *
     * @param context
     * @param writer
     * @param trigger
     *
     * @throws IOException
     */
    public void encode(FacesContext context, ResponseWriter writer, TriggerDescriptor trigger) throws IOException {
        if (editorMode) { // Never show trigger to players
            //UIHelper.startDiv(writer, UIHelper.CSS_CLASS_VARIABLE_CONTAINER);
            encodeBase(context, writer, trigger, editorMode);

            UIHelper.printProperty(context, writer, UIHelper.TEXT_ACTIVE, trigger.getDefaultInstance().getEnabled());
            UIHelper.printProperty(context, writer, UIHelper.TEXT_ONLY_ONCE, trigger.isOneShot());

            UIHelper.printPropertyImpactScript(context, writer, UIHelper.TEXT_CONDITION, trigger.getTriggerEvent());
            UIHelper.printPropertyImpactScript(context, writer, UIHelper.TEXT_IMPACT_SOURCECODE, trigger.getPostTriggerEvent());
            UIHelper.endDiv(writer);
        }
    }

    /**
     * Output for StateMachines and Dialogues
     *
     * @param context
     * @param writer
     * @param fsm
     *
     * @throws IOException
     */
    public void encode(FacesContext context, ResponseWriter writer, AbstractStateMachineDescriptor fsm) throws IOException {
        if (editorMode) { // never show to players
            //UIHelper.startDiv(writer, UIHelper.CSS_CLASS_VARIABLE_CONTAINER);
            encodeBase(context, writer, fsm, editorMode);
            StateMachineInstance instance = (StateMachineInstance) fsm.getDefaultInstance();
            UIHelper.printProperty(context, writer, UIHelper.TEXT_ACTIVE, instance.getEnabled());
            UIHelper.printProperty(context, writer, UIHelper.TEXT_DEFAULT_STATE, instance.getCurrentStateId().toString());

            UIHelper.startDiv(writer, UIHelper.CSS_CLASS_FOLDER);
            List<Long> keys = new ArrayList<>();
            Map<Long, State> states = fsm.getStates();
            keys.addAll(states.keySet());

            Collections.sort(keys);

            for (Long id : keys) {
                UIState uiState = new UIState(states.get(id), id, player, editorMode, defaultValues);
                uiState.encodeAll(context);
            }
            UIHelper.endDiv(writer);
            UIHelper.endDiv(writer);
        }
    }

    /**
     *
     * Print inboxes
     *
     * @param context
     * @param writer
     * @param inbox
     *
     * @throws IOException
     */
    public void encode(FacesContext context, ResponseWriter writer, InboxDescriptor inbox) throws IOException {
        //UIHelper.startDiv(writer, UIHelper.CSS_CLASS_VARIABLE_CONTAINER);
        encodeBase(context, writer, inbox, editorMode);
        InboxInstance instance = inbox.getInstance(defaultValues, player);

        for (Message msg : instance.getSortedMessages()) {
            UIHelper.printMessage(context, writer, "",
                    getI18nFacade().interpolate(msg.getFrom().translateOrEmpty(player), player),
                    getI18nFacade().interpolate(msg.getSubject().translateOrEmpty(player), player),
                    getI18nFacade().interpolate(msg.getDate().translateOrEmpty(player), player),
                    getI18nFacade().interpolate(msg.getBody().translateOrEmpty(player), player),
                    msg.getToken(), msg.getAttachments());
        }

        UIHelper.endDiv(writer);
    }

    /**
     * Print Number
     *
     * @param context
     * @param writer
     * @param nd
     *
     * @throws IOException
     */
    public void encode(FacesContext context, ResponseWriter writer, NumberDescriptor nd) throws IOException {
        //UIHelper.startDiv(writer, UIHelper.CSS_CLASS_VARIABLE_CONTAINER);
        encodeBase(context, writer, nd, editorMode);
        NumberInstance ni = nd.getInstance(defaultValues, player);

        if (editorMode) {
            UIHelper.printProperty(context, writer, UIHelper.TEXT_MIN_VALUE, nd.getMinValue());
            UIHelper.printProperty(context, writer, UIHelper.TEXT_MAX_VALUE, nd.getMaxValue());
        }
        UIHelper.printProperty(context, writer, UIHelper.TEXT_VALUE, ni.getValue());

        UIHelper.endDiv(writer);
    }

    /**
     * Print Boolean
     *
     * @param context
     * @param writer
     * @param bd
     *
     * @throws IOException
     */
    public void encode(FacesContext context, ResponseWriter writer, BooleanDescriptor bd) throws IOException {
        //UIHelper.startDiv(writer, UIHelper.CSS_CLASS_VARIABLE_CONTAINER);
        encodeBase(context, writer, bd, editorMode);
        BooleanInstance bi = bd.getInstance(defaultValues, player);
        UIHelper.printProperty(context, writer, UIHelper.TEXT_VALUE, bi.getValue());
        UIHelper.endDiv(writer);
    }
}
