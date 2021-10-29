const express = require('express');
const bodyParser = require('body-parser');

let app = express();
app.set('view engine', 'ejs');
app.set('views', './views');
app.use(express.static(__dirname+'/public'));
app.use(bodyParser.urlencoded({ extended: false }));

app.get('/', function (req, res) {
    //console.log(req.user);
    res.render('index', {
        value: "test"
    });
});

app.use(function (req, res, next) {
    res.status(404).redirect('/');
});

app.listen(3000, function () {
    console.log('Node.js app listening');
});