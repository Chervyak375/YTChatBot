const Emitter = require("events");

class Bot {
    NewMessageEvent = new Emitter();
    constructor(youtubeService) {
        this.youtubeService = youtubeService;
    }

    SendMessage(messageText){}
    ReplyMessage(messageId, messageText){}
    DeleteMessage(messageId){}
    AddHandlerOnEvent(event, handler)
    {
        this.NewMessageEvent.on()
    }
    HandlreMat(newMessage){
        if(newMessage == 'хуй')
        {
            this.DeleteMessage(newMessage.messageId);
        }
    }
    ListeningPoll(){
        let startWorl = '/start poll';
        let stopWorl = '/stop poll';
        let worlAnser = '/poll {number}';

        let newMessage = GetNextNewMessage();
        let isPollActive = newMessage == startWorl;
        let isPollCanceling = newMessage == stopWorl;

        if(true)
        {

        }
    }
}

module.exports = Bot;

/*


/stat poll
/poll 2
/poll 1
/poll 4
/poll 6
Jdhggebd\
Классный видос
Стример ЛОХ
/stop poll
Результаты голосования:
1 - 20%
2 - 50%
3 - 1%




 */