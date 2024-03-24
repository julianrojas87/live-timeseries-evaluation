module.exports = new class{

    //Returns all the objects that satisfy the subject predicate pair
    getObjects(subject, predicate, triples){
        let objects = [];
        for(let i in triples)
            if(triples[i].subject === subject && triples[i].predicate === predicate)
                objects.push(triples[i].object);
        return objects;
    }
}