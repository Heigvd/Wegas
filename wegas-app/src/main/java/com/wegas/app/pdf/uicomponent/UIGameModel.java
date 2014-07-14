/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.app.pdf.uicomponent;

import com.wegas.app.pdf.helper.UIHelper;
import com.wegas.core.persistence.game.GameModel;
import com.wegas.core.persistence.variable.ListDescriptor;
import com.wegas.core.persistence.variable.VariableDescriptor;
import java.io.IOException;
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
@FacesComponent("com.wegas.app.pdf.uicomponent.GameModel")
public class UIGameModel extends UIComponentBase {

    @Override
    public String getFamily() {
	return "com.wegas.app.pdf.uicomponent.GameModel";
    }

    @Override
    public void encodeBegin(FacesContext context) throws IOException {
	super.encodeBegin(context);
	GameModel gm = (GameModel) getAttributes().get("value");

	ResponseWriter writer = context.getResponseWriter();

	UIHelper.startDiv(writer, UIHelper.CSS_CLASS_CONTENT);
	UIHelper.startSpan(writer, UIHelper.CSS_CLASS_MAIN_TITLE);
	writer.write("Scenario " + gm.getName());
	UIHelper.endSpan(writer);

	UIHelper.startDiv(writer, UIHelper.CSS_CLASS_MENU);
	for (VariableDescriptor vd : gm.getChildVariableDescriptors()) {
	    if (vd instanceof ListDescriptor) {
		writer.write("<a href=\"#folder_" + vd.getId() + "\" >" + vd.getLabel() + "</a>");
	    }
	}

	UIHelper.endDiv(writer);

	UIHelper.printPropertyTextArea(context, writer, "Description", gm.getDescription(), false);

	UIHelper.startSpan(writer, UIHelper.CSS_CLASS_MAIN_IMAGE);

	HtmlGraphicImage image = new HtmlGraphicImage();

	String imgSrc;
	if (gm.getProperties().getImageUri().length() > 0) {
	    imgSrc = gm.getProperties().getImageUri();
	} else {
	    // @todo wegas-app/src/main/webapp/wegas-lobby/js/wegas-lobby-datatable.js 
	    imgSrc = "wegas-lobby/images/wegas-game-thumb.png";
	}

	image.setValue(imgSrc);
	image.encodeAll(context);
	UIHelper.endSpan(writer);

	for (VariableDescriptor vd : gm.getChildVariableDescriptors()) {
	    UIVariableDescriptor uiVd = new UIVariableDescriptor();
	    uiVd.getAttributes().put("value", vd);
	    uiVd.encodeAll(context);
	}

	UIHelper.endDiv(writer);
    }
}
