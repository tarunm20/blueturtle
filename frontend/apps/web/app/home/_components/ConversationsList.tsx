import { Button } from "@kit/ui/button";
import { Plus, MessageSquare } from "lucide-react";

interface Conversation {
  id: string;
  title: string;
}

interface ConversationsListProps {
  conversations: Conversation[];
  activeConversationId: string | null;
  onSelectConversation: (id: string) => void;
  onNewConversation: () => void;
}

export const ConversationsList: React.FC<ConversationsListProps> = ({
  conversations,
  activeConversationId,
  onSelectConversation,
  onNewConversation
}) => {
  return (
    <div className="flex flex-col h-full">
      <div className="p-4">
        <Button 
          onClick={onNewConversation}
          className="w-full"
          size="sm"
        >
          <Plus className="h-4 w-4 mr-2" />
          New Chat
        </Button>
      </div>
      
      <div className="flex-1 overflow-y-auto">
        {conversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 px-4 text-center text-muted-foreground">
            <MessageSquare className="h-8 w-8 mb-2 opacity-50" />
            <p className="text-sm">No conversations yet</p>
          </div>
        ) : (
          <ul className="space-y-1 px-2">
            {conversations.map(conversation => (
              <li key={conversation.id}>
                <Button
                  variant={activeConversationId === conversation.id ? "secondary" : "ghost"}
                  className="w-full justify-start text-left h-auto py-3 px-4"
                  onClick={() => onSelectConversation(conversation.id)}
                >
                  <span className="truncate">{conversation.title}</span>
                </Button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};