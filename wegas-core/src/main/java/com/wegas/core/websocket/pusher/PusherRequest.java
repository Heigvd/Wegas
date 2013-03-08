package com.wegas.core.websocket.pusher;

import java.io.IOException;
import org.apache.http.client.ClientProtocolException;


/**
 * An instance of this class can be used to prepopulate properties (event or channel name) with default values
 *
 * @author Stephan Scheuermann
 * Copyright 2010. Licensed under the MIT license: http://www.opensource.org/licenses/mit-license.php
 */
public class PusherRequest {

	/**
	 * Name of the event
	 */
	private String eventName;

	/**
	 * Channel identifier
	 */
	private String channelName;

	/**
	 * Create an instance and assign a channelName that is used for each request
	 * @param channelName
	 */
	public PusherRequest(String channelName) {
		super();
		this.channelName = channelName;
	}

	/**
	 * Create an instance and assign both channelName and eventName that are used for each request
	 * @param eventName
	 * @param channelName
	 */
	public PusherRequest(String channelName, String eventName) {
		super();
		this.channelName = channelName;
		this.eventName = eventName;
	}

	/**
	 * Triggers a new push with default channelName, eventName properties
	 * @param jsonData
	 * @return
	 * @throws IOException
	 * @throws ClientProtocolException
	 */
	public String triggerPush(String jsonData) throws ClientProtocolException, IOException{
		return Pusher.triggerPush(channelName, eventName, jsonData);
	}

	/**
	 * Triggers a new push with default channelName property
	 * @param jsonData
	 * @param eventName
	 * @return
	 * @throws IOException
	 * @throws ClientProtocolException
	 */
	public String triggerPush(String jsonData, String eventName) throws ClientProtocolException, IOException{
		return Pusher.triggerPush(channelName, eventName, jsonData);
	}

	/**
	 * Triggers a new push with default channelName property
	 * @param jsonData
	 * @param eventName
	 * @param socketId
	 * @return
	 * @throws IOException
	 * @throws ClientProtocolException
	 */
	public String triggerPush(String jsonData, String eventName, String socketId) throws ClientProtocolException, IOException{
		return Pusher.triggerPush(channelName, eventName, jsonData, socketId);
	}

	public void setEventName(String eventName) {
		this.eventName = eventName;
	}

	public String getEventName() {
		return eventName;
	}

	public void setChannelName(String channelName) {
		this.channelName = channelName;
	}

	public String getChannelName() {
		return channelName;
	}

}