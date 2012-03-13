package com.wegas.core.security.servlet;

import javax.servlet.ServletRequest;

import org.apache.shiro.authc.AuthenticationException;
import org.apache.shiro.web.filter.authc.FormAuthenticationFilter;

/**
 * 
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
public class VerboseFormAuthenticationFilter extends FormAuthenticationFilter {
	
    /**
     * 
     * @param request
     * @param ae
     */
    @Override
	protected void setFailureAttribute(ServletRequest request, AuthenticationException ae) {
		String message = ae.getMessage();
		request.setAttribute(getFailureKeyAttribute(), message);
	}
	
}
