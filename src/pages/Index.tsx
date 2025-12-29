import { useState } from "react";
import Snowflakes from "@/components/Snowflakes";
import ChatButton from "@/components/ChatButton";
import ChatScreen from "@/components/ChatScreen";
import { Helmet } from "react-helmet";

const Index = () => {
  const [isInChat, setIsInChat] = useState(false);

  return (
    <>
      <Helmet>
        <title>Chat with Santa - Talk to Santa in Malayalam</title>
        <meta 
          name="description" 
          content="Chat with Santa Claus in Malayalam! A magical Christmas experience. സാന്താക്ലോസിനെ സംസാരിക്കൂ!" 
        />
      </Helmet>

      <div className="min-h-screen relative overflow-hidden">
        <Snowflakes />
        
        {!isInChat ? (
          <div className="min-h-screen flex items-center justify-center relative z-10">
            <ChatButton onClick={() => setIsInChat(true)} />
          </div>
        ) : (
          <ChatScreen onEndChat={() => setIsInChat(false)} />
        )}

        {/* Footer */}
        {!isInChat && (
          <div className="fixed bottom-6 left-0 right-0 text-center z-10">
            <p className="text-muted-foreground text-sm">
              ✨ A magical Christmas experience ✨
            </p>
          </div>
        )}
      </div>
    </>
  );
};

export default Index;
