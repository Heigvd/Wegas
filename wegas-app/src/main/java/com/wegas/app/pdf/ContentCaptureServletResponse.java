/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013, 2014, 2015 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.app.pdf;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.PrintWriter;
import java.nio.charset.StandardCharsets;
import javax.servlet.http.HttpServletResponse;
import javax.servlet.http.HttpServletResponseWrapper;

/**
 * Servlet Response Wrapper used by PdfRenderer to intercept page content
 * 
 * @author Maxence Laurent (maxence.laurent at gmail.com)
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
	    writer = new PrintWriter(getContentBuffer());
	}
	return writer;
    }

    private ByteArrayOutputStream getContentBuffer(){
        if (contentBuffer == null){
            contentBuffer = new ByteArrayOutputStream();
        }
        return contentBuffer;
    }

    public String getContent() throws IOException{
	getWriter().flush();
	String xhtmlContent = new String(getContentBuffer().toByteArray(), StandardCharsets.UTF_8);

	xhtmlContent = xhtmlContent.replaceAll("<thead>|</thead>|"+ "<tbody>|</tbody>", "");
	xhtmlContent = xhtmlContent.replaceAll("<br>", "<br />");

	return xhtmlContent;
    }
}
