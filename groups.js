class noteGroup {
    constructor(name) {
        this.groupName = name;
        this.notes = new Map(); // ID, note itself
        this.count = 0;
    }

    appendNote(newnote) {
        this.notes.set(this.count, newnote);
        this.count++;
    }

    removeNote(ID) {
        if (this.notes.has(ID)) {
            this.notes.delete(ID);
            this.count--;
        }
    }
}// not operational [ for testing ;)]
