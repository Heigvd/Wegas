/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.app.pdf;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.PrintWriter;
import javax.servlet.http.HttpServletResponse;
import javax.servlet.http.HttpServletResponseWrapper;

/**
 *
 * @author maxence
 */
public class ContentCaptureServletResponse extends HttpServletResponseWrapper {

    private ByteArrayOutputStream contentBuffer;
    private PrintWriter writer;

    public ContentCaptureServletResponse(HttpServletResponse response) {
	super(response);
    }
    
    @Override
    public PrintWriter getWriter() throws IOException {
	if (writer == null){
	    contentBuffer = new ByteArrayOutputStream();
	    writer = new PrintWriter(contentBuffer);
	}
	return writer;
    }

    public String getContent(){
	writer.flush();
	String xhtmlContent = new String(contentBuffer.toByteArray());

	xhtmlContent = xhtmlContent.replaceAll("<thead>|</thead>|"+ "<tbody>|</tbody>", "");
	xhtmlContent = xhtmlContent.replaceAll("<br>", "<br />");

	return xhtmlContent;
    }
}
