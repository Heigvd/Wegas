/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2015 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */

package com.wegas.watson;

import com.ibm.watson.developer_cloud.conversation.v1.ConversationService;
import com.wegas.core.Helper;

/**
 * This class contains the methods used to access Watson Conversation services. It uses
 * the REST interface of watson to create, update or delete Workspaces, intents, examples
 * and more.
 * 
 * @author Pierre-Adrien Ghiringhelli
 */


public class WatsonProperties {
    
    public static final String WATSON_VERSION = Helper.getWegasProperty("watson.version", "");
    
    private static final String WATSON_USERNAME = Helper.getWegasProperty("watson.username", "");
    
    private static final String WATSON_PASSWORD = Helper.getWegasProperty("watson.password", "");
    
    public static final ConversationService WATSON_SERVICE;
    
    static{
        WATSON_SERVICE = new ConversationService(WATSON_VERSION);
        WATSON_SERVICE.setUsernameAndPassword(WATSON_USERNAME, WATSON_PASSWORD);
    }
}
