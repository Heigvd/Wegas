package com.wegas.log.xapi;

import com.google.gson.JsonElement;
import com.google.gson.JsonObject;

/*
 * Copied from gov.adlnet.xapi.model when removing learning locker + xapi logging.
 * This file must be kept here so that any scenario script that would be based on it can run safely.
 */

public class Account {
	private String homePage;
	private String name;
	
	public Account() {}
	
	public Account(String name, String homepage) {
	   this.name = name;
	   this.homePage = homepage;
	}

	public String getHomePage() {
		return homePage;
	}

	public void setHomePage(String homePage) {
		this.homePage = homePage;
	}

	public String getName() {
		return name;
	}

	public void setName(String name) {
		this.name = name;
	}

	public JsonElement serialize() {
		return new JsonObject();
	}
	
	public String toString() {
		return "";
	}
}
