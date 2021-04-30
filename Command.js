class Command {
    constructor(commands) {
        this.commandText = '';
        this.commands = commands;
    }

    load(commandText) {
        this.commandText = commandText;
    }

    validate() {
        if(this.commandText[0] !== '@')
            return false;
        if(this.commandText[1] === '*')
            return true;
        for(var command in this.commands)
        {
            if(command === this.commandText)
                return true;
        }
        return false;
    }

    exec() {
        let func = this.commands[this.commandText];
        if(func === undefined)
            func = this.commands['@*'];
        func(this.getVariant());
    }

    getVariant() {
        return this.commandText.replace('@*', '');
    }
}

module.exports = Command;
