var express = require('express');
var router = express.Router();


router.get('/', function(req, res, next) {
	
  res.send('respond with a resource');
});

//projection used in query is not working, fix it 
function getLocations(db)
{
	var locationCollection = db.get('location');
	locationCollection.find({ },{location : 1 , _id : 0}, function(err, locations) {
			return locations;
	});
}

router.post('/addPlayer', function(req, res) {
    var db = req.db;
    var player = req.body;

    var collection = db.get('player');
	collection.update({playerId : player.playerId},{$set : {playerName : player.playerName, isRegistered : true}},function(err,docs){
		if(docs == 0)
		{
			player.teamIds = [];
			collection.insert(player, function(err, result){
        		
			if((err === null))
			{
				var locationCollection = db.get('location');
				locationCollection.find({ },{location : 1 , _id : 0}, function(err, locations) {
						res.send({ msg: 'Success' ,location : locations});
				});
				
			}else{
				res.send({ msg: err });
			}

   			});
		}else
		{
			if((err === null))
			{
				var locationCollection = db.get('location');
				locationCollection.find({ },{location : 1 , _id : 0}, function(err, locations) {
						res.send({ msg: 'Success' ,location : locations});
				});
			}else{
				res.send({ msg: err });
			}
			
		}
    });
});

module.exports = router;