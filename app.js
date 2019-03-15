//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
// const date = require(__dirname + "/date.js");
const _ = require("lodash");
const app = express();

app.set("view engine", "ejs");

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

//MongoDB Set Up Part
const databaseConnectionURL =
  "mongodb+srv://admin-ali:Test123@cluster0-uca0m.mongodb.net/todolistDB";
mongoose.connect(databaseConnectionURL, {
  useNewUrlParser: true
}); // Establish connection

//Create Schema
const itemsSchema = new mongoose.Schema({
  name: String
});

//Create object model for our schema in the database
const Item = mongoose.model("Item", itemsSchema);
//Setting the default items up
const item1 = new Item({
  name: "Welcome to your todolist!"
});

const item2 = new Item({
  name: "Hit the + button the add a new item."
});

const item3 = new Item({
  name: "<-- Hit this to delete an item."
});

//  Setting the default items array
const defaultItems = [item1, item2, item3];

const listSchema = {
  name: String,
  items: [itemsSchema]
};

const List = mongoose.model("List", listSchema);

app.get("/", function(req, res) {
  console.log(mongoose.connection.readyState);
  Item.find({}, function(err, foundItems) {
    if (foundItems.length === 0) {
      // console.log(foundItems.length);

      Item.insertMany(defaultItems, function(err) {
        if (err) {
          console.log("Error");
        } else {
          console.log("Successfully inserted default items!");
          res.redirect("/");
        }
      });
    } else {
      res.render("list", { listTitle: "Today", newListItems: foundItems });
    }
  });
});

app.get("/:customListName", function(req, res) {
  const customListName = _.capitalize(req.params.customListName);

  List.findOne({ name: customListName }, function(err, foundList) {
    if (!err) {
      if (!foundList) {
        //Create a new list
        const list = new List({
          name: customListName,
          items: defaultItems
        });
        list.save(function(err) {
          if (err) return handleError(err);
          else {
            res.redirect("/" + customListName);
          }
        });
      } else {
        res.render("list", {
          listTitle: foundList.name,
          newListItems: foundList.items
        });
      }
    }
  });
});

app.post("/", function(req, res) {
  const itemName = req.body.newItem;
  const listName = req.body.list;

  const item = new Item({
    name: itemName
  });

  if (listName === "Today") {
    item.save(function(err) {
      if (!err) {
        res.redirect("/");
      }
    });
  } else {
    List.findOne({ name: listName }, function(err, foundList) {
      foundList.items.push(item);
      foundList.save(function(err) {
        if (!err) {
          res.redirect("/" + listName);
        }
      });
    });
  }
});

app.post("/delete", function(req, res) {
  const checkedID = req.body.checkbox;
  const listName = req.body.listName;

  if (listName === "Today") {
    Item.findByIdAndRemove(checkedID, function(err) {
      if (!err) {
        console.log("Successfully deleted from /delete !");
        res.redirect("/");
      }
    });
  } else {
    Item.findOneAndUpdate(
      { name: listName },
      { $pull: { items: { _id: checkedID } } },
      function(err, foundList) {
        if (!err) {
          res.redirect("/" + listName);
        }
      }
    );
  }
});

let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}
app.listen(port || 3000, function() {
  console.log("Server started on port 3000");
});
