require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");


const app = express();
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

mongoose.connect(process.env.KEY);

const itemsSchema = {
    name: String
}
const Item = mongoose.model("Item", itemsSchema);

const listSchema = {
    name: String,
    items: [itemsSchema]
}

const List = mongoose.model("List", listSchema);


const item1 = new Item({
    name: "Welcome to your todolist!"
});

const item2 = new Item({
    name: "Hit the + button to add an new item."
});

const item3 = new Item({
    name: "<-- Hit this to delete an item."
});

const defaultItems = [item1, item2, item3];


app.get("/", function(req, res){

    Item.find({}, function(err, foundItems){
        
        if (foundItems.length === 0){
            Item.insertMany(defaultItems, function(err) {
                if (err)
                    console.log(err);
                else
                    console.log("Successfully saved default items to the DB.");
            });
            res.redirect("/");
        }

        res.render("list", {listTitle: "Today", newListItems: foundItems});

    });

});

app.get("/:customListName", function(req, res){
    if (req.params.customListName != "favicon.ico") {
        
        const name = _.capitalize(req.params.name);
        const customListName = _.capitalize(req.params.customListName);

        List.findOne({name: customListName}, function(err, foundList){
            if (!err) {
                if (!foundList){
                    // create a new list
                    const list = new List ({
                        name: customListName,
                        items: defaultItems
                    });
                
                    list.save();
                    res.redirect("/" + customListName);
                } else {
                    // show existing list
                    res.render("list", {listTitle: foundList.name, newListItems: foundList.items});
                }
            } 
        });
    }

    
});

app.post("/", function(req, res){

    const itemName = req.body.newItem;
    const listName = _.capitalize(req.body.list);

    const item= new Item({
        name: itemName
    });

    if (listName === "Today"){
        
        item.save();
        
        res.redirect("/");
    } else {

        List.findOne({name: listName}, function(err, foundList){
            foundList.items.push(item);
            foundList.save();

            res.redirect("/" + listName);
        });

    }

});


app.post("/delete", function(req, res){
    
    const checkedItemId = req.body.checkbox;
    const listName = _.capitalize(req.body.listName);

    if(listName === "Today"){
        Item.findByIdAndRemove(checkedItemId, function(err) {
            if (err){
                console.log(err);
            }
            else{
                console.log("Successfully deleted.");
                res.redirect("/");
            }
        });
    } else {
        List.findOneAndUpdate(
            {name: listName}, {$pull: {items: {_id: checkedItemId}}}, function(err, foundList) {
                if (!err){
                    console.log("Successfully deleted.");
                    res.redirect("/" + listName);
                } else {
                    console.log(err);
                }
            });
        }

});

app.get("/about", function(req,res){
    res.render("about");
});

let port = process.env.PORT;
if (port == null || port == ""){
    port = 3000;
}

app.listen(port, function(req, res){
    console.log("server has started on port 3000");
});

