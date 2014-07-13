/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.app.pdf.uicomponent;

import com.wegas.app.pdf.helper.UIHelper;
import com.wegas.core.persistence.variable.ListDescriptor;
import com.wegas.core.persistence.variable.VariableDescriptor;
import com.wegas.core.persistence.variable.primitive.ObjectDescriptor;
import com.wegas.core.persistence.variable.primitive.TextDescriptor;
import com.wegas.core.persistence.variable.statemachine.DialogueDescriptor;
import com.wegas.core.persistence.variable.statemachine.StateMachineDescriptor;
import com.wegas.core.persistence.variable.statemachine.TriggerDescriptor;
import com.wegas.mcq.persistence.ChoiceDescriptor;
import com.wegas.mcq.persistence.QuestionDescriptor;
import com.wegas.mcq.persistence.Result;
import com.wegas.mcq.persistence.SingleResultChoiceDescriptor;
import com.wegas.resourceManagement.persistence.ResourceDescriptor;
import com.wegas.resourceManagement.persistence.TaskDescriptor;
import com.wegas.resourceManagement.persistence.WRequirement;
import java.io.IOException;
import java.lang.reflect.InvocationTargetException;
import java.lang.reflect.Method;
import javax.faces.component.FacesComponent;
import javax.faces.component.UIComponentBase;
import javax.faces.component.html.HtmlGraphicImage;
import javax.faces.context.FacesContext;
import javax.faces.context.ResponseWriter;

/**
 *
 * Faces component that print a variable descriptor within a JSF XHTML file. See
 * WEB-INF/web.xml & WEB-INF/wegas-taglib.xml for tag definition
 *
 * @author maxence
 */

/*FACES 2.2 : @FacesComponent(createTag = true, tagName = "VariableDesc", namespace = "http://xmlns.jcp.org/jsf/wegas-pdf")*/
@FacesComponent("com.wegas.app.pdf.uicomponent.VariableDescriptor")
public class UIVariableDescriptor extends UIComponentBase {

    @Override
    public String getFamily() {
	return "com.wegas.app.pdf.uicomponent.VariableDescriptor";
    }

    /**
     * Entry point to print a variable descriptor
     *
     * @param context
     * @throws IOException
     */
    @Override
    public void encodeBegin(FacesContext context) throws IOException {
	VariableDescriptor vd = (VariableDescriptor) getAttributes().get("value");

	if (vd != null) {
	    ResponseWriter responseWriter = context.getResponseWriter();
	    UIHelper.startDiv(responseWriter, UIHelper.CSS_CLASS_VARIABLE_CONTAINER);

	    dispatch(context, responseWriter, vd);
	    UIHelper.endDiv(responseWriter);
	} else {
	    throw new IOException("Missing required value attribute");
	}
    }

    /**
     * According to VariableDescriptor type, branches the correct encode method
     *
     * @param context
     * @param writer
     * @param vDesc the variable descriptor to encode
     * @throws IOException
     */
    private void dispatch(FacesContext context, ResponseWriter writer, VariableDescriptor vDesc) throws IOException {
	switch (vDesc.getClass().getSimpleName().replaceAll("Descriptor", "")) {
	    case "List":
		encode(context, writer, (ListDescriptor) vDesc);
		break;
	    case "Question":
		encode(context, writer, (QuestionDescriptor) vDesc);
		break;
	    case "Object":
		encode(context, writer, (ObjectDescriptor) vDesc);
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
	    default:
		encode(context, writer, vDesc);
		break;
	}

    }

    /**
     * Same as @encodeBase with title=simple variable descriptor name
     *
     * @param context
     * @param writer
     * @param vDesc
     * @throws IOException
     */
    private void encodeBase(FacesContext context, ResponseWriter writer, VariableDescriptor vDesc) throws IOException {
	encodeBase(context, writer, vDesc, vDesc.getClass().getSimpleName().replaceAll("Descriptor", ""));
    }

    /**
     * print data that are common to all variable descriptor (Title, name and
     * label)
     *
     * @param context
     * @param writer
     * @param vDesc
     * @param title
     * @throws IOException
     */
    private void encodeBase(FacesContext context, ResponseWriter writer, VariableDescriptor vDesc, String title) throws IOException {
	UIHelper.printText(context, writer, title + " \"" + vDesc.getLabel() + "\"", UIHelper.CSS_CLASS_VARIABLE_TITLE);
	//UIHelper.printProperty(context, writer, "Internal Type", vDesc.getClass().getSimpleName());
	//UIHelper.printProperty(context, writer, UIHelper.TEXT_NAME, vDesc.getLabel());
	UIHelper.printProperty(context, writer, "ScriptAlias", vDesc.getName());
    }

    /**
     *
     * Basic tag, please override for specific behaviour
     *
     * The basic behaviour detect all getter from the variable descriptor and
     * display their values
     *
     * @param context
     * @param writer
     * @param vDesc
     * @throws IOException
     */
    public void encode(FacesContext context, ResponseWriter writer, VariableDescriptor vDesc) throws IOException {
	encodeBase(context, writer, vDesc);

	for (Method m : vDesc.getClass().getDeclaredMethods()) {
	    if (m.getName().matches("^get.*") && m.getParameterTypes().length == 0) {
		try {
		    Object invoke = m.invoke(vDesc);
		    String name, value;
		    name = m.getName().replaceFirst("get", "");
		    value = "N/A";
		    if (invoke != null) {
			value = invoke.toString();
		    }
		    UIHelper.printProperty(context, writer, name, value);
		} catch (IllegalAccessException | IllegalArgumentException | InvocationTargetException ex) {
		    //Logger.getLogger(VariableDescriptor.class.getName()).log(Level.SEVERE, null, ex);
		    //writer.write("ERROR " + ex.toString() + "<br />");
		    //writer.write(ex.getMessage());
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
     * @throws IOException
     */
    public void encode(FacesContext context, ResponseWriter writer, TextDescriptor obj) throws IOException {
	encodeBase(context, writer, obj);
	UIHelper.printPropertyTextArea(context, writer, "Default Text", obj.getDefaultInstance().getValue(), false);
    }

    /**
     * Specific output for TaskDescriptor
     *
     * @param context
     * @param writer
     * @param task
     * @throws IOException
     */
    public void encode(FacesContext context, ResponseWriter writer, TaskDescriptor task) throws IOException {
	encodeBase(context, writer, task);

	UIHelper.printProperty(context, writer, UIHelper.TEXT_LABEL, task.getLabel());
	UIHelper.printPropertyTextArea(context, writer, UIHelper.TEXT_DESCRIPTION, task.getDescription(), false);

	UIHelper.printProperty(context, writer, UIHelper.TEXT_INDEX, task.getIndex().toString());
	UIHelper.printProperty(context, writer, UIHelper.TEXT_ACTIVE_DEFAULT, task.getDefaultInstance().getActive());
	UIHelper.printProperty(context, writer, UIHelper.TEXT_DURATION, ((Double) (task.getDefaultInstance().getDuration())).toString());

	UIHelper.printKeyValueMap(context, writer, task.getDefaultInstance().getProperties());
	UIHelper.printKeyValueMap(context, writer, task.getProperties());

	UIHelper.printText(context, writer, UIHelper.TEXT_PREDECESSORS, UIHelper.CSS_CLASS_VARIABLE_SUBTITLE);

	UIHelper.startDiv(writer, UIHelper.CSS_CLASS_VARIABLE_CONTAINER);
	writer.startElement("ul", this);
	for (String p : task.getPredecessorNames()) {
	    writer.startElement("li", this);
	    writer.write(p);
	    writer.endElement("li");
	}
	writer.endElement("ul");

	UIHelper.endDiv(writer);

	UIHelper.printText(context, writer, UIHelper.TEXT_REQUIERMENT_REQUIERMENTS, UIHelper.CSS_CLASS_VARIABLE_SUBTITLE);

	UIHelper.startDiv(writer, UIHelper.CSS_CLASS_VARIABLE_CONTAINER);
	writer.startElement("ul", this);
	for (WRequirement req : task.getDefaultInstance().getRequirements()) {
	    String str = req.getQuantity()+ "x " + req.getWork() + " lvl " + req.getLevel() + " (limit=" + req.getLimit() + ")";
	    writer.startElement("li", this);
	    writer.write(str);
	    writer.endElement("li");
	}
	writer.endElement("ul");

	UIHelper.endDiv(writer);
    }

    /**
     * Specific output for ResourceDescriptor Display all properties
     *
     * @param context
     * @param writer
     * @param resource
     * @throws IOException
     */
    public void encode(FacesContext context, ResponseWriter writer, ResourceDescriptor resource) throws IOException {
	encodeBase(context, writer, resource);
	UIHelper.printProperty(context, writer, UIHelper.TEXT_LABEL, resource.getLabel());

	UIHelper.printPropertyTextArea(context, writer, UIHelper.TEXT_DESCRIPTION, resource.getDescription(), false);


	UIHelper.printProperty(context, writer, "Main Skill", resource.getDefaultInstance().getMainSkill() + " (lvl: " + resource.getDefaultInstance().getMainSkillLevel() + ")");
	UIHelper.printProperty(context, writer, UIHelper.TEXT_MORAL, ((Integer)resource.getDefaultInstance().getMoral()).toString());
	UIHelper.printProperty(context, writer, UIHelper.TEXT_CONFIDENCE, ((Integer)resource.getDefaultInstance().getConfidence()).toString());
	
	UIHelper.printProperty(context, writer, "Active", resource.getDefaultInstance().getActive());

	UIHelper.printKeyValueMap(context, writer, resource.getProperties());
	UIHelper.printKeyValueMap(context, writer, resource.getDefaultInstance().getProperties());
    }

    /**
     * Specific output for ObjectDescriptor Display all properties
     *
     * @param context
     * @param writer
     * @param obj
     * @throws IOException
     */
    public void encode(FacesContext context, ResponseWriter writer, ObjectDescriptor obj) throws IOException {
	encodeBase(context, writer, obj);
	UIHelper.printPropertyTextArea(context, writer, UIHelper.TEXT_DESCRIPTION, obj.getDescription(), false);
	UIHelper.printKeyValueMap(context, writer, obj.getProperties(), "Object Properties");
	UIHelper.printKeyValueMap(context, writer, obj.getDefaultInstance().getProperties(), "Default Properties");
    }

    /**
     * Specific output for ListDescriptor. Print all children
     *
     * @param context
     * @param writer
     * @param list
     * @throws IOException
     */
    public void encode(FacesContext context, ResponseWriter writer, ListDescriptor list) throws IOException {
	writer.write("<a name=\"folder_" + list.getId() + "\">");
	UIHelper.printText(context, writer, list.getLabel(), UIHelper.CSS_CLASS_VARIABLE_TITLE);
	writer.write("</a>");
	UIHelper.printProperty(context, writer, "ScriptAlias", list.getName());

	if (list.getItems().isEmpty()) {
	    UIHelper.printText(context, writer, "[Empty Folder]", UIHelper.CSS_CLASS_PROPERTY_VALUE_NA);
	} else {
	    writer.startElement("div", this);
	    writer.writeAttribute("class", UIHelper.CSS_CLASS_FOLDER, null);
	    for (VariableDescriptor vd : list.getItems()) {

		UIVariableDescriptor uiVd = new UIVariableDescriptor();
		uiVd.getAttributes().put("value", vd);

		//writer.startElement("span", uiVd);
		uiVd.encodeAll(context);
		//writer.endElement("span");
	    }
	    writer.endElement("div");
	}
    }

    /**
     * Specific behaviour for QuestionDescriptor
     *
     * @param context
     * @param writer
     * @param question
     * @throws IOException
     */
    public void encode(FacesContext context, ResponseWriter writer, QuestionDescriptor question) throws IOException {
	encodeBase(context, writer, question);

	UIHelper.startDiv(writer, UIHelper.CSS_CLASS_COLUMNS);
	UIHelper.startDiv(writer, UIHelper.CSS_CLASS_PICTURES + " " + UIHelper.CSS_CLASS_COLUMN);
	for (String picture : question.getPictures()) {

	    UIHelper.startDiv(writer, UIHelper.CSS_CLASS_PICTURE);
	    // This URL is valid because the <head><base> tag indicate the correct base URI
	    String imgSrc = "/rest/GameModel/" + question.getGameModel().getId() + "/File/read/" + picture;
	    UIHelper.printProperty(context, writer, "Picture", picture);
	    HtmlGraphicImage image = new HtmlGraphicImage();
	    image.setValue(imgSrc);
	    image.encodeAll(context);
	    UIHelper.endDiv(writer);
	}
	UIHelper.endDiv(writer);

	UIHelper.startDiv(writer, UIHelper.CSS_CLASS_COLUMN);
	UIHelper.printProperty(context, writer, UIHelper.TEXT_LABEL, question.getTitle());
	UIHelper.printProperty(context, writer, "Allow Multiple Replies", question.getAllowMultipleReplies());
	UIHelper.printProperty(context, writer, UIHelper.TEXT_ACTIVE_DEFAULT, question.getDefaultInstance().getActive());

	UIHelper.printPropertyTextArea(context, writer, UIHelper.TEXT_DESCRIPTION, question.getDescription(), false);
	UIHelper.endDiv(writer);
	UIHelper.endDiv(writer);

	// nest choices within div.folder
	for (ChoiceDescriptor choice : question.getItems()) {
	    //UIHelper.startDiv(writer, UIHelper.CSS_CLASS_FOLDER);
	    encode(context, writer, choice);
	    //UIHelper.endDiv(writer);
	}
    }

    public void encode(FacesContext context, ResponseWriter writer, ChoiceDescriptor choice) throws IOException {
	encodeBase(context, writer, choice);
	UIHelper.printProperty(context, writer, UIHelper.TEXT_LABEL, choice.getTitle());
	UIHelper.printPropertyTextArea(context, writer, UIHelper.TEXT_DESCRIPTION, choice.getDescription(), false);
	UIHelper.printProperty(context, writer, UIHelper.TEXT_ACTIVE_DEFAULT, choice.getDefaultInstance().getActive());

	// Not single result ? print current_result
	if (choice instanceof SingleResultChoiceDescriptor == false) {
	    String resultName;
	    if (choice.getDefaultInstance().getCurrentResult() == null) {
		resultName = UIHelper.TEXT_NOT_AVAILABLE;
	    } else {
		resultName = choice.getDefaultInstance().getCurrentResult().getName();
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
		UIResult uiResult = new UIResult();
		uiResult.getAttributes().put("value", result);
		uiResult.encodeAll(context);

		if (choice instanceof SingleResultChoiceDescriptor == false) {
		    UIHelper.endDiv(writer);
		}
	    }
	}
    }

    public void encode(FacesContext context, ResponseWriter writer, TriggerDescriptor trigger) throws IOException {
	encodeBase(context, writer, trigger);

	UIHelper.printProperty(context, writer, UIHelper.TEXT_ACTIVE_DEFAULT, trigger.getDefaultInstance().getEnabled());
	UIHelper.printProperty(context, writer, UIHelper.TEXT_ONLY_ONCE, trigger.isOneShot());

	UIHelper.printPropertyImpactScript(context, writer, UIHelper.TEXT_CONDITION, trigger.getTriggerEvent());
	UIHelper.printPropertyImpactScript(context, writer, UIHelper.TEXT_IMPACT_SOURCECODE, trigger.getPostTriggerEvent());
    }

    public void encode(FacesContext context, ResponseWriter writer, StateMachineDescriptor fsm) throws IOException {
	encodeBase(context, writer, fsm);
	UIHelper.printProperty(context, writer, UIHelper.TEXT_ACTIVE_DEFAULT, fsm.getDefaultInstance().getEnabled());
	UIHelper.printProperty(context, writer, UIHelper.TEXT_DEFAULT_STATE, fsm.getDefaultInstance().getCurrentStateId().toString());

	if (fsm instanceof DialogueDescriptor) {
	    UIHelper.printProperty(context, writer, UIHelper.TEXT_CONTENT, ((DialogueDescriptor) (fsm)).getContent());
	}

	UIHelper.startDiv(writer, UIHelper.CSS_CLASS_FOLDER);
	for (Long id : fsm.getStates().keySet()) {
	    UIState uiState = new UIState();
	    uiState.getAttributes().put("value", fsm.getStates().get(id));
	    uiState.getAttributes().put("stateID", id);
	    uiState.encodeAll(context);
	}
	UIHelper.endDiv(writer);
    }
}
