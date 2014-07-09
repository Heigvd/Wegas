/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.app.pdf.uicomponent;

import com.wegas.mcq.persistence.Result;
import java.io.IOException;
import javax.faces.component.FacesComponent;
import javax.faces.component.UIComponentBase;
import javax.faces.context.FacesContext;
import javax.faces.context.ResponseWriter;

/**
 *
 * Faces component that print a variable descriptor within a JSF XHTML file. See
 * WEB-INF/web.xml & WEB-INF/wegas-taglib.xml for tag definition
 *
 * @author maxence
 */
@FacesComponent("com.wegas.app.pdf.uicomponent.Result")
public class UIResult extends UIComponentBase {

    @Override
    public String getFamily() {
	return "com.wegas.app.pdf.uicomponent.Result";
    }

    /**
     * Print QuestionDescriptor Result
     *
     * @param context
     * @throws IOException
     */
    @Override
    public void encodeBegin(FacesContext context) throws IOException {
	super.encodeBegin(context);
	ResponseWriter writer = context.getResponseWriter();
	
	Result result = (Result) getAttributes().get("value");
	
	UIHelper.printText(context, writer, "Result:", UIHelper.CSS_CLASS_VARIABLE_SUBTITLE);
	UIHelper.printProperty(context, writer, UIHelper.TEXT_NAME, result.getName());
	UIHelper.printPropertyTextArea(context, writer, UIHelper.TEXT_IMPACT_TEXT, result.getAnswer(), false);
	
	UIHelper.printPropertyScript(context, writer, UIHelper.TEXT_IMPACT_SOURCECODE, result.getImpact());
    }
}
