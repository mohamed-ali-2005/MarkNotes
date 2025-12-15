// test comment 

//update the file
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

//Group Validation
function isValidGroupName(groupName, groups) {
    if (!groupName || groupName.trim().length < 3) {
        return false;
    }

    return !groups.some(g => g.name === groupName);
}
//Search Groups
function searchGroups(keyword, groups) {
    return groups.filter(group =>
        group.name.toLowerCase().includes(keyword.toLowerCase())
    );
}

//Group Counter

function getGroupsCount(groups) {
    return groups.length;
}
