const express = require('express');
const session = require('cookie-session');
const bodyParser = require('body-parser');
const app = express();
const fs = require('fs');
const formidable = require('formidable');
const MongoClient = require('mongodb').MongoClient;
const assert = require('assert');
const ObjectID = require('mongodb').ObjectID;
const mongourl = 'mongodb+srv://student:student@cluster0-gh8iv.mongodb.net/test?retryWrites=true&w=majority';
const dbName = 'test';

app.set('view engine','ejs');

const SECRETKEY1 = 'I want to pass COMPS381F';
const SECRETKEY2 = 'Keep this to yourself';

const users = new Array(
	{name: 'demo01', password: ''},
	{name: 'demo02', password: ''}
);

var usernameOwner = "";

app.set('view engine','ejs');

//Function requirement #1
app.use(session({
  name: 'session',
  keys: [SECRETKEY1,SECRETKEY2]
}));

// support parsing of application/json type post data
app.use(bodyParser.json());
// support parsing of application/x-www-form-urlencoded post data
app.use(bodyParser.urlencoded({ extended: true }));

app.get('/', (req,res) => {
	usernameOwner = req.session.username;
	console.log(req.session);
	if (!req.session.authenticated) {
		res.redirect('/login');
	} else {
		res.redirect('/home');
	}
});

app.get('/login', (req,res) => {
	res.status(200).sendFile(__dirname + '/public/login.html');
});

app.post('/login', (req,res) => {
	users.forEach((user) => {
		if (user.name == req.body.name && user.password == req.body.password) {
			req.session.authenticated = true;
			req.session.username = user.name;			
		}
	});
	res.redirect('/');
});

app.get('/logout', (req,res) => {
	req.session = null;
	res.redirect('/');
});

app.get('/home', (req,res) => {
	res.render('home.ejs');
});


//function requirement #2
app.get('/createRestaurant', (req,res) => {
	res.render('createRestaurant.ejs');
});

app.post('/insertRestaurant', (req,res) => {
  let form = new formidable.IncomingForm();
  form.parse(req, (err, fields, files) => {
    console.log(JSON.stringify(files));
    let filename = files.filetoupload.path;
    if (fields.name) {
      var name = (fields.name.length > 0) ? fields.name : "";
      console.log(`name = ${name}`);
    }
    if (fields.borough) {
      var borough  = (fields.borough.length > 0) ? fields.borough : "";
      console.log(`borough = ${borough}`);
    }
    if (fields.cuisine) {
      var cuisine   = (fields.cuisine.length > 0) ? fields.cuisine : "";
      console.log(`cuisine = ${cuisine}`);
    }
    if (files.filetoupload.type) {
      var mimetype = files.filetoupload.type;
      console.log(`mimetype = ${mimetype}`);
    }
    if (!mimetype.match(/^image/)) {
      var mimetype = "null";
      console.log(`mimetype = "null"`);
    }
    if (fields.street) {
      var street = (fields.street.length > 0) ? fields.street : "";
      console.log(`street = ${street}`);
    }
    if (fields.building) {
      var building = (fields.building.length > 0) ? fields.building : "";
      console.log(`building = ${building}`);
    }
    if (fields.zipcode) {
      var zipcode = (fields.zipcode.length > 0) ? fields.zipcode : "";
      console.log(`zipcode = ${zipcode}`);
    }
    if (fields.coordlon) {
      var coordlon= (fields.coordlon.length > 0) ? fields.coordlon : "";
      console.log(`coordlon = ${coordlon}`);
    }
    if (fields.coordlat) {
      var coordlat= (fields.coordlat.length > 0) ? fields.coordlat : "";
      console.log(`coordlat = ${coordlat}`);
    }
    	
    fs.readFile(filename, (err,data) => {
      let client = new MongoClient(mongourl);
      client.connect((err) => {
        try {
          assert.equal(err,null);
        } catch (err) {
	  res.writeHead(500, {"Content-Type": "text/html"});
          res.write("MongoClient connect() failed!");
          res.end('<br><a href="/">Back</a>');
        }
        const db = client.db(dbName);
        let new_r = {};
	let address = {};
        new_r['name'] = name;
        new_r['borough'] = borough;
	new_r['cuisine'] = cuisine;
        new_r['photo'] = new Buffer.from(data).toString('base64');
	new_r['photo mimetype'] = mimetype;
	address['street'] = street;
	address['building'] = building;
	address['zipcode'] = zipcode;
	address['coord'] = [coordlon, coordlat];
	new_r['address'] = address;
	new_r['owner'] = usernameOwner;
        insertRestaurant(db,new_r,(result) => {
          client.close();
	  res.writeHead(200, {"Content-Type": "text/html"});
	  res.write('Restaurant was inserted into MongoDB!');
	  res.end('<br><a href="/">Back</a>');
        });
      });
    });
  });
});

//function requirement #3
app.get('/updateRestaurant', (req,res) => {
  let client = new MongoClient(mongourl);
  client.connect((err) => {
    try {
      assert.equal(err,null);
    } catch (err) {
      res.writeHead(500, {"Content-Type": "text/html"});
      res.write("MongoClient connect() failed!");
      res.end('<br><a href="/">Back</a>');
    }      
    console.log('Connected to MongoDB');
    const db = client.db(dbName);
    let criteria = {};
    criteria['_id'] = ObjectID(req.query._id);
    findRestaurants(db,criteria,(restaurants) => {
      client.close();
      console.log('Disconnected MongoDB'); 
      res.render('updateRestaurant.ejs',{restaurants:restaurants});    
    });
  });
});

app.post('/updateResult', (req,res) => {
  let form = new formidable.IncomingForm();
  form.parse(req, (err, fields, files) => {
    console.log(JSON.stringify(files));
    let filename = files.filetoupload.path;
    if (fields.id) {
      var id = (fields.id.length > 0) ? fields.id : "";
      console.log(`id = ${id}`);
    }
    if (fields.owner) {
      var owner = (fields.owner.length > 0) ? fields.owner : "";
      console.log(`owner = ${owner}`);
    }
    if (fields.name) {
      var name = (fields.name.length > 0) ? fields.name : "";
      console.log(`name = ${name}`);
    }
    if (fields.borough) {
      var borough  = (fields.borough.length > 0) ? fields.borough : "";
      console.log(`borough = ${cuisine}`);
    }
    if (fields.cuisine) {
      var cuisine   = (fields.cuisine.length > 0) ? fields.cuisine : "";
      console.log(`cuisine = ${cuisine}`);
    }
    if (files.filetoupload.type) {
      var mimetype = files.filetoupload.type;
      console.log(`mimetype = ${mimetype}`);
    }
    if (!mimetype.match(/^image/)) {
      var mimetype = "null";
      console.log(`mimetype = "null"`);
    }
    if (fields.street) {
      var street = (fields.street.length > 0) ? fields.street : "";
      console.log(`street = ${street}`);
    }
    if (fields.building) {
      var building = (fields.building.length > 0) ? fields.building : "";
      console.log(`building = ${building}`);
    }
    if (fields.zipcode) {
      var zipcode = (fields.zipcode.length > 0) ? fields.zipcode : "";
      console.log(`zipcode = ${zipcode}`);
    }
    if (fields.coordlon) {
      var coordlon= (fields.coordlon.length > 0) ? fields.coordlon : "";
      console.log(`coordlon = ${coordlon}`);
    }
    if (fields.coordlat) {
      var coordlat= (fields.coordlat.length > 0) ? fields.coordlat : "";
      console.log(`coordlat = ${coordlat}`);
    }
    	
    fs.readFile(filename, (err,data) => {
      let client = new MongoClient(mongourl);
      client.connect((err) => {
        try {
          assert.equal(err,null);
        } catch (err) {
          res.writeHead(500, {"Content-Type": "text/html"});
          res.write("MongoClient connect() failed!");
          res.end('<br><a href="/">Back</a>');
        }
        const db = client.db(dbName);
        let new_r = {};
	let address = {};
        new_r['name'] = name;
        new_r['borough'] = borough;
	new_r['cuisine'] = cuisine;
        new_r['photo'] = new Buffer.from(data).toString('base64');
	new_r['photo mimetype'] = mimetype;
	address['street'] = street;
	address['building'] = building;
	address['zipcode'] = zipcode;
	address['coord'] = [coordlon, coordlat];
	new_r['address'] = address;
	new_r['owner'] = usernameOwner;
	let criteria = {};
    	criteria['_id'] = ObjectID(id);
	if(owner==usernameOwner) {
      	updateRestaurant(db,criteria,new_r,(result) => {
          client.close();
          res.writeHead(200, {"Content-Type": "text/html"});
	  res.write('Restaurant was updated into MongoDB!');
          res.end('<br><a href="/">Back</a>');
	});
	} else {
          res.writeHead(500, {"Content-Type": "text/html"});
	  res.write('Only owner can update restaurant information!');
	  res.end('<br><a href="/">Back</a>');
	}
      });
    });
  });
});


//function requirement #4
app.get('/ratingRestaurant', (req,res) => {
   let client = new MongoClient(mongourl);
   client.connect((err) => {
    try {
      assert.equal(err,null);
    } catch (err) {
      res.writeHead(500, {"Content-Type": "text/html"});
      res.write("MongoClient connect() failed!");
      res.end('<br><a href="/">Back</a>');
    }      
    console.log('Connected to MongoDB');
    const db = client.db(dbName);
    let criteria = {};
    criteria['_id'] = ObjectID(req.query._id);
    findRestaurants(db,criteria,(restaurants) => {
      client.close();
      console.log('Disconnected MongoDB'); 
      res.render('ratingRestaurant.ejs',{restaurants:restaurants});
    });
 });
});

app.post('/ratingResult', (req,res) => {
  let form = new formidable.IncomingForm();
  form.parse(req, (err, fields, files) => {
    console.log(JSON.stringify(files));
    if (fields.rate) {
      var rate = (fields.rate.length > 0) ? fields.rate : "";
      console.log(`rate = ${rate}`);
    }
    if (fields.rid) {
      var rid = (fields.rid.length > 0) ? fields.rid : "";
      console.log(`rid = ${rid}`);
    }

      let client = new MongoClient(mongourl);
      client.connect((err) => {
        try {
          assert.equal(err,null);
        } catch (err) {
          res.writeHead(500, {"Content-Type": "text/html"});
          res.write("MongoClient connect() failed!");
          res.end('<br><a href="/">Back</a>');
        }
        const db = client.db(dbName);
	let criteria = {};
    	criteria['_id'] = ObjectID(rid);
	updateRate(db,criteria,rate,(result) => {
          client.close();
	  console.log('Disconnected MongoDB');
	  res.writeHead(200, {"Content-Type": "text/html"});
          res.write('Restaurant was rated!');
          res.end('<br><a href="/">Back</a>');
	});
     });
  });
});

//function requirement #5
app.get('/viewRestaurant', (req,res) => {
  let client = new MongoClient(mongourl);
  client.connect((err) => {
    try {
      assert.equal(err,null);
    } catch (err) {
      res.writeHead(500, {"Content-Type": "text/html"});
      res.write("MongoClient connect() failed!");
      res.end('<br><a href="/">Back</a>');
    }
    console.log('Connected to MongoDB');
    const db = client.db(dbName);
    findRestaurants(db,{},(restaurants) => {
      client.close();
      console.log('Disconnected MongoDB');
      res.render("viewRestaurant.ejs",{restaurants:restaurants});
    });
  });
});

app.get('/display', (req,res) => {
  let client = new MongoClient(mongourl);
  client.connect((err) => {
    try {
      assert.equal(err,null);
    } catch (err) {
      res.writeHead(500, {"Content-Type": "text/html"});
      res.write("MongoClient connect() failed!");
      res.end('<br><a href="/">Back</a>');s
    }      
    console.log('Connected to MongoDB');
    const db = client.db(dbName);
    let criteria = {};
    criteria['_id'] = ObjectID(req.query._id);
    findRestaurants(db,criteria,(restaurants) => {
      client.close();
      console.log('Disconnected MongoDB');
      let photo = new Buffer(restaurants[0].photo,'base64');
      //console.log(usernameOwner); 
      res.render('viewDetail.ejs',{restaurants:restaurants, usernameOwner:usernameOwner});    
    });
  });
});

app.get("/map", (req,res) => {
	res.render("gmap.ejs", {
		lat:req.query.lat,
		lon:req.query.lon,
		zoom:req.query.zoom ? req.query.zoom : 15
	});
	res.end();
});

//function requirement #6
app.get('/deleteRestaurant', (req,res) => {
  let client = new MongoClient(mongourl);
  client.connect((err) => {
    try {
      assert.equal(err,null);
    } catch (err) {
      res.writeHead(200, {"Content-Type": "text/html"});
      res.write("MongoClient connect() failed!");
      res.end('<br><a href="/">Back</a>');
    }      
    console.log('Connected to MongoDB');
    const db = client.db(dbName);
    let criteria = {};
    criteria['_id'] = ObjectID(req.query._id);
    let owner = req.query.downer;
    if(owner==usernameOwner) {
      deleteRestaurant(db,criteria,(restaurants) => {
      client.close();
      console.log('Disconnected MongoDB');
      res.writeHead(200, {"Content-Type": "text/html"});
      res.write("Restaurant data was deleted from MongoDB!");
      res.end('<br><a href="/">Back</a>');
    });
    } else {
        res.writeHead(200, {"Content-Type": "text/html"});
	res.write("Only owner can delete!");
	res.end('<br><a href="/">Back</a>');
    }
  });
});

//function requirement #7
app.get('/searchRestaurant', (req,res) => {
	res.render('searchRestaurant.ejs',)
});

app.post('/searchResult', (req,res) => {
  let form = new formidable.IncomingForm();
  form.parse(req, (err, fields, files) => {
    console.log(JSON.stringify(files));
    if (fields.type) {
      var type = (fields.type.length > 0) ? fields.type : "";
      console.log(`type = ${type}`);
    }
    if (fields.searchitem) {
      var searchitem = (fields.searchitem.length > 0) ? fields.searchitem : "";
      console.log(`searchitem = ${searchitem}`);
    }

      let client = new MongoClient(mongourl);
      client.connect((err) => {
        try {
          assert.equal(err,null);
        } catch (err) {
	  res.writeHead(500, {"Content-Type": "text/html"});
          res.write("MongoClient connect() failed!");
	  res.end('<br><a href="/">Back</a>');
        }
        const db = client.db(dbName);
        
	//let criteria = {};
	var a = "";
        a = "" + searchitem; 
	//criteria['type'] = type;
	//criteria['searchitem'] = searchitem;
    	searchRestaurants(db,a,(restaurants) => {
      	   client.close();
           console.log('Disconnected MongoDB');
           res.render("searchResult.ejs",{restaurants:restaurants});
    	});
     });
  });
});

//default condition
app.get('^\/.*/', function(req,res) {
  res.render('/');
});

//find restaurant
function findRestaurants(db,criteria,callback) {
  cursor = db.collection("restaurantHW").find(criteria);
  let restaurants = [];
  cursor.forEach((doc) => {
    restaurants.push(doc);
  }, (err) => {
    // done or error
    console.log('data received');
    assert.equal(err,null);
    callback(restaurants);
  })
}

//insert restaurant
function insertRestaurant(db,r,callback) {		db.collection('restaurantHW').insertOne(r,function(err,result) {
    assert.equal(err,null);
    console.log("insert was successful!");
    //console.log(JSON.stringify(result));
    callback(result);
  });
}

//update restaurant
function updateRestaurant(db,criteria,r,callback) {		db.collection('restaurantHW').replaceOne(criteria,r,function(err,result) {
    assert.equal(err,null);
    console.log("update was successful!");
    //console.log(JSON.stringify(result));
    callback(result);
  });
}

//update rate
function updateRate(db,criteria,r,callback) {		db.collection('restaurantHW').updateMany(criteria,{$push:{"grades":{"user":usernameOwner,"score":r}}} ,function(err,result) {
    assert.equal(err,null);
    console.log("update rate was successful!");
    //console.log(JSON.stringify(result));
    callback(result);
  });
}

//delete restaurant
function deleteRestaurant(db,criteria,callback) {
db.collection('restaurantHW').deleteOne(criteria,function(err,result) {
    assert.equal(err,null);
    console.log("delete was successful!");
    //console.log(JSON.stringify(result));
    callback(result);
  });
}

//search restaurant
function searchRestaurants(db,criteria,callback) {
   cursor = db.collection("restaurantHW").find({$or:[{"name":criteria},{"borough":criteria},{"cuisine":criteria},{"address.street":criteria},{"address.building":criteria},{"address.zipcode":criteria},{"address.coord[0]":criteria},{"address.coord[1]":criteria},{"grades":{"user":criteria}},{"grades":{"score":criteria}},{"owner":criteria}]});
  let restaurants = [];
  cursor.forEach((doc) => {
    restaurants.push(doc);
  }, (err) => {
    // done or error
    console.log('data received');
    assert.equal(err,null);
    callback(restaurants);
  })
}

app.listen(process.env.PORT || 8099);
