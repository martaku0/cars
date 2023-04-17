const express = require("express")
const app = express()
const PORT = 3000;
app.use(express.static('static'))
const path = require("path");

const hbs = require('express-handlebars');

app.set('views', path.join(__dirname, 'views'));
app.engine('hbs', hbs({
    defaultLayout: 'main.hbs',
    helpers: {
        isExisting(value) {
            if (context[value] == true) {
                return true
            } else {
                return false
            }
        }
    }
}));
app.set('view engine', 'hbs');

const Datastore = require('nedb');
const { query } = require("express");

const myCars = new Datastore({
    filename: 'cars.db',
    autoload: true
});

var context = { dataDB: [] }


app.get("/", function(req, res) {
    res.render('index.hbs');
})

app.get("/addCar", function(req, res) {
    if (Object.keys(req.query).length == 0) {
        res.render('add.hbs');
    } else {

        var data = {
            ubezpieczony: "NIE",
            benzyna: "NIE",
            uszkodzony: "NIE",
            naped4x4: "NIE"
        }

        if (Object.keys(req.query).includes('carInfo')) {
            let ubez = req.query.carInfo.includes("ubezpieczony") ? "TAK" : "NIE"
            let benz = req.query.carInfo.includes("benzyna") ? "TAK" : "NIE"
            let uszko = req.query.carInfo.includes("uszkodzony") ? "TAK" : "NIE"
            let naped = req.query.carInfo.includes("naped") ? "TAK" : "NIE"

            data = {
                ubezpieczony: ubez,
                benzyna: benz,
                uszkodzony: uszko,
                naped4x4: naped
            }
        }

        myCars.insert(data, function(err, newCar) {
            context.newCar = newCar._id
            res.render('add.hbs', context);

            delete context.newCar
        });
    }
})

app.get("/carsList", function(req, res) {

    if (req.query.delete) {
        myCars.remove({ _id: req.query.delete }, {}, function(err) {
            console.log("deleted")
        });
    }

    myCars.find({}, function(err, data) {
        context.dataDB = data
        res.render('list.hbs', context);
    });
})

app.get("/editCars", function(req, res) {
    if (req.query.edit) {
        let temp = req.query.edit.toString()
        context[temp] = true
        myCars.find({}, function(err, data) {
            context.dataDB = data
            res.render('edit.hbs', context);
        });
    } else if (req.query.cancel) {
        let temp = req.query.cancel.toString()
        delete context[temp]
        myCars.find({}, function(err, data) {
            context.dataDB = data
            res.render('edit.hbs', context);
        });
    } else if (req.query.update) {
        let temp = req.query.update.toString()
        delete context[temp]

        let object = req.query
        let ubez = object["update_" + temp + "_ubezpieczony"]
        let benz = object["update_" + temp + "_benzyna"]
        let uszko = object["update_" + temp + "_uszkodzony"]
        let naped = object["update_" + temp + "_naped"]

        const data = {
            ubezpieczony: ubez,
            benzyna: benz,
            uszkodzony: uszko,
            naped4x4: naped
        }

        myCars.update({ _id: temp }, { $set: data }, {}, function(err, numUpdated) {
            myCars.find({}, function(err, data) {
                context.dataDB = data
                res.render('edit.hbs', context);
            });
        });


    } else {
        myCars.find({}, function(err, data) {
            context.dataDB = data
            res.render('edit.hbs', context);
        });
    }

})

app.listen(PORT, function() {
    console.log("start serwera na porcie " + PORT)
})