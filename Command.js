class ChatCommand {
    constructor() {
        this.commandText = '';
        this.commands = {
            '@poll-start': 'startListeningPoll',
            '@poll-stop': 'stopListeningPoll',
        };
    }

    load(commandText) {
        this.commandText = commandText;
    }

    validate() {
        if(this.commandText[0] !== '@')
            return false;
        for(var command in this.commands)
        {
            if(this.commands[command] === this.commandText)
                return true;
        }
        return false;
    }

    exec() {
        this.commands[this.commandText]();
    }
}

module.exports = ChatCommand;
