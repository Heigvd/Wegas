/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2015 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */

package com.wegas.watson;

import com.ibm.watson.developer_cloud.conversation.v1.ConversationService;
import com.ibm.watson.developer_cloud.conversation.v1.model.CreateExample;
import com.ibm.watson.developer_cloud.conversation.v1.model.CreateIntent;
import com.ibm.watson.developer_cloud.conversation.v1.model.CreateWorkspace;
import com.ibm.watson.developer_cloud.conversation.v1.model.ExampleResponse;
import com.ibm.watson.developer_cloud.conversation.v1.model.IntentCollectionResponse;
import com.ibm.watson.developer_cloud.conversation.v1.model.IntentResponse;
import com.ibm.watson.developer_cloud.conversation.v1.model.WorkspaceResponse;
import com.wegas.core.Helper;
import com.wegas.core.persistence.game.GameModel;
import java.util.List;

/**
 * This class contains the methods used to access Watson Conversation services. It uses
 * the REST interface of watson to create, update or delete Workspaces, intents, examples
 * and more.
 * 
 * @author Pierre-Adrien Ghiringhelli
 */

public class WatsonUtils {
    
    public static final String WATSON_VERSION = Helper.getWegasProperty("watson.version", "");
    
    private static final String WATSON_USERNAME = Helper.getWegasProperty("watson.username", "");
    
    private static final String WATSON_PASSWORD = Helper.getWegasProperty("watson.password", "");
    
    private static final ConversationService WATSON_SERVICE;
    
    static{
        WATSON_SERVICE = new ConversationService(WATSON_VERSION);
        WATSON_SERVICE.setUsernameAndPassword(WATSON_USERNAME, WATSON_PASSWORD);
    }
    
    /**
     *
     * @return the Id of the created workpsace
     */
    public static String createWorkspace(String name){
        CreateWorkspace w = new CreateWorkspace.Builder().language("fr").build();
        WorkspaceResponse r = WATSON_SERVICE.createWorkspace(w).execute();
        return r.getWorkspaceId();
    }
    
    public static void deleteWorkspace(String workspaceId){
        WATSON_SERVICE.deleteWorkspace(workspaceId).execute();
    }
    
    
    public static IntentCollectionResponse getIntents(GameModel gm){
        String workspaceId = gm.getProperties().getWatsonWorkspaceId();
        IntentCollectionResponse intents = WatsonUtils.WATSON_SERVICE.listIntents(workspaceId, true, null, true, null, null).execute();
        return intents;
    }
    /**
     *
     * @return the intent (the unique name of the intent also called intent) of the created intent
     */
    public static String createIntent(GameModel gm, String name, String description, List<CreateExample> examples){
        if(Helper.isNullOrEmpty(gm.getProperties().getWatsonWorkspaceId())){
            gm.getProperties().setWatsonWorkspaceId(createWorkspace(gm.getName()));
        }
        IntentResponse r = WATSON_SERVICE.createIntent(gm.getProperties().getWatsonWorkspaceId(), name, description, examples).execute();
        return r.getIntent();
    }
    
    public static String updateIntent(GameModel gm, String name, String newName, String description, List<CreateExample> examples){
        IntentResponse r = WATSON_SERVICE.updateIntent(gm.getProperties().getWatsonWorkspaceId(), name, newName, description, examples).execute();
        return r.getIntent();
    }
    
    public static void deleteIntent(GameModel gm, String name){
        WATSON_SERVICE.deleteIntent(gm.getProperties().getWatsonWorkspaceId(), name).execute();
    }
    
    public static String createExample(GameModel gm, String intent, String text){
        ExampleResponse r = WATSON_SERVICE.createExample(gm.getProperties().getWatsonWorkspaceId(), intent, text).execute();
        return r.getText();
    }
    
    public static String updateExample(GameModel gm, String intent, String text, String newText){
        ExampleResponse r = WATSON_SERVICE.updateExample(gm.getProperties().getWatsonWorkspaceId(), intent, text, newText).execute();
        return r.getText();
    }
    
    public static void deleteExample(GameModel gm, String intent, String text){
        WATSON_SERVICE.deleteExample(gm.getProperties().getWatsonWorkspaceId(), intent, text).execute();
    }
}
