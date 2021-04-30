class Poll {
    constructor() {
        this.variants = new Map();
    }
    add(variant) {
        if(this.variants.has(variant))
        {
            this.variants.set(variant, this.variants.get(variant) + 1)
        }
        else
            this.variants.set(variant, 1);
    }
    clear() {
        this.variants.clear();
    }

    report() {
        let report = "Result\n";
        this.variants.forEach((value, key) => {
            report += key + ': ' + value;
            report += "\n";
        });
        return report;
    }
}

module.exports = Poll;