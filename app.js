//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");
const port = process.env.PORT || 3000;
const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

const user = encodeURIComponent("deepanshuy098");
const pass = encodeURIComponent("@Deepu0895..");
const uri = `mongodb+srv://${user}:${pass}@todolistapp.t9xlxq3.mongodb.net/?retryWrites=true&w=majority`;
// const uri = `mongodb://${user}:${pass}@ac-mgnfcrw-shard-00-00.ec6uuxh.mongodb.net:27017,ac-mgnfcrw-shard-00-01.ec6uuxh.mongodb.net:27017,ac-mgnfcrw-shard-00-02.ec6uuxh.mongodb.net:27017/todolistDB?ssl=true&replicaSet=atlas-qwndcl-shard-0&authSource=admin&retryWrites=true&w=majority`;

// --- DEBUG: connect and log everything ---
mongoose.connect(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 20000
})
  .then(() => {
    console.log("✅ Mongoose initial connection successful");
    // Start server only after DB is connected
    app.listen(port, () => {
      console.log(`Server running on port ${port}`);
    });
  })
  .catch(err => {
    console.error("❌ Mongoose initial connection error:", err);
  });

mongoose.connection.on('connected', () => console.log('🔌 Mongoose event: connected'));
mongoose.connection.on('error', (err) => console.error('🚨 Mongoose event: error', err));
mongoose.connection.on('disconnected', () => console.log('❎ Mongoose event: disconnected'));

// ----------------------------------------------------

const itemsSchema = {
  name: String
};

const Item = mongoose.model("Item", itemsSchema);

const item1 = new Item({ name: "Leetcode" });
const item2 = new Item({ name: "Subjects" });
const item3 = new Item({ name: "webdevelopment" });

const defaultItems = [item1, item2, item3];

const listSchema = {
  name: String,
  items: [itemsSchema]
};

const List = mongoose.model("List", listSchema);

app.get("/", function(req, res) {
  Item.find({}, function(err, foundItems){
    if (err) {
      console.error("Error finding items:", err);
      return res.status(500).send("DB error");
    }
    if (!foundItems || foundItems.length === 0) {
      Item.insertMany(defaultItems, function(err){
        if (err) {
          console.log("InsertMany error:", err);
        } else {
          console.log("Successfully saved default items to DB.");
        }
      });
      return res.redirect("/");
    } else {
      return res.render("list", {listTitle: "Today", newListItems: foundItems});
    }
  });
});

app.get("/:customListName", function(req, res){
  const customListName = _.capitalize(req.params.customListName);
  List.findOne({name: customListName}, function(err, foundList){
    if (!err){
      if (!foundList){
        const list = new List({ name: customListName, items: defaultItems });
        list.save();
        res.redirect("/" + customListName);
      } else {
        res.render("list", {listTitle: foundList.name, newListItems: foundList.items});
      }
    } else {
      console.error("Error in customListName query:", err);
      res.status(500).send("DB error");
    }
  });
});

app.post("/", function(req, res){
  const itemName = req.body.newItem;
  const listName = req.body.list;
  const item = new Item({ name: itemName });

  if (listName === "Today"){
    item.save()
      .then(() => res.redirect("/"))
      .catch(err => {
        console.error("Save item error:", err);
        res.status(500).send("Save error");
      });
  } else {
    List.findOne({name: listName}, function(err, foundList){
      if (err) {
        console.error("Find list error:", err);
        return res.status(500).send("DB error");
      }
      foundList.items.push(item);
      foundList.save()
        .then(() => res.redirect("/" + listName))
        .catch(e => {
          console.error("Save list error:", e);
          res.status(500).send("Save error");
        });
    });
  }
});

app.post("/delete", function(req, res){
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;

  if (listName === "Today") {
    Item.findByIdAndRemove(checkedItemId)
      .then(() => res.redirect("/"))
      .catch(err => {
        console.error("Remove item error:", err);
        res.redirect("/");
      });
  } else {
    List.findOneAndUpdate(
      {name: listName},
      {$pull: {items: {_id: checkedItemId}}},
      function(err){
        if (err) {
          console.error("Remove from custom list error:", err);
          return res.status(500).send("DB error");
        }
        res.redirect("/" + listName);
      }
    );
  }
});

app.get("/about", function(req, res){
  res.render("about");
});

const fist = "https://todolist-ave3.onrender.com";
