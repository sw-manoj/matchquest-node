var express = require('express');
var router = express.Router();

/* GET users listing. */
router.get('/', function(req, res, next) {
  res.send('respond with a resource');
});

router.get('/userlist', function(req, res) {
    var db = req.db;
	console.log('matchquestDB_1');
    var collection = db.get('simplein');
  collection.find({},{},function(e,docs){
    res.json(docs);
  });
});

module.exports = router;
