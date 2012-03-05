package com.wegas.security.servlet;

import javax.servlet.ServletRequest;

import org.apache.shiro.authc.AuthenticationException;
import org.apache.shiro.web.filter.authc.FormAuthenticationFilter;

/**
 * 
 * @author fx
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
