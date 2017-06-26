package com.wegas.watson;

import com.ibm.watson.developer_cloud.conversation.v1.ConversationService;
import com.ibm.watson.developer_cloud.conversation.v1.model.CreateExample;
import com.ibm.watson.developer_cloud.conversation.v1.model.CreateIntent;
import com.ibm.watson.developer_cloud.conversation.v1.model.CreateWorkspace;
import com.ibm.watson.developer_cloud.conversation.v1.model.Intent;
import com.ibm.watson.developer_cloud.conversation.v1.model.MessageRequest;
import com.ibm.watson.developer_cloud.conversation.v1.model.MessageResponse;
import com.ibm.watson.developer_cloud.conversation.v1.model.WorkspaceResponse;
import com.wegas.core.persistence.game.GameModel;
import org.junit.Test;

/**
 *
 * @author Pierre-Adrien Ghiringhelli
 */


public class WatsonTest {
    
    @Test
    public void test(){
        System.out.println("debut du test");
        String id = WatsonUtils.createWorkspace("test");
        System.out.println("workspace : " + id + " créé");
        System.out.println(WatsonUtils.WATSON_SERVICE.createIntent(id, "Bonjour", "Description", null).execute().getCreated());
        //WatsonUtils.deleteWorkspace(id);
        System.out.println("workspace : " + id + " supprimé");
    }
}
