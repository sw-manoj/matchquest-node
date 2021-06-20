var express = require('express');
var router = express.Router();

router.get('/', function(req, res, next) {
	res.send('no response from request status');
});

router.get('/getMatchStatus/:id', function(req, res) {

	var db = req.db;
	var teamId = parseInt(req.params.id);

	var matchesCollection = db.get('matches');
	var playerCollection = db.get('player');
	var playerIds = [];
	var matchStatusDet = {};

	matchesCollection.find({"teamDet.teamId" : teamId},function(err,matchDetDocs){
		if(err === null)
		{
			if(matchDetDocs != null )
			{
				matchStatusDet.matchDet = matchDetDocs;

				for(var i = 0 ; i < matchDetDocs.length ; i ++)
				{
					var playerIdArr = [];
					var teamDet = matchDetDocs[i].teamDet;

					for(var j = 0 ; j < teamDet.length ; j ++)
					{
						if(teamDet[j].teamId == teamId)
						{
							playerIdArr = playerIdArr.concat(teamDet[j].interestedPlayerIds);
							playerIdArr = playerIdArr.concat(teamDet[j].selectedPlayerIds);
						}
					}

					for(var k = 0 ; k < playerIdArr.length ; k++)
					{
						if(playerIds.indexOf(playerIdArr[k]) == -1)
						{
							playerIds.push(playerIdArr[k]);
						}
					}
				}
				playerCollection.find({playerId : {$in : playerIds}},function(err,playerDetDocs){
					if(err === null)
					{
						matchStatusDet.playerDet = playerDetDocs;
						res.send({msg : 'Success', matchStatusDet : matchStatusDet});
					}else{
						res.send({msg : err});
					}
				});
			}else{
				res.send({msg : 'Success', matchStatusDet : matchStatusDet});
			}
		}else{
			res.send({msg : err});
		}
	});
});

router.post('/savePlayerOpinion', function(req, res){
	var db = req.db;
	var playerOptionDet = req.body;
	var matchesCollection = db.get('matches');
	var saveQuery = {};

	if(playerOptionDet.toRemove)
	{
		saveQuery = {$pull : {"teamDet.$.interestedPlayerIds" : playerOptionDet.playerId}};
	}else{
		saveQuery = {$addToSet : {"teamDet.$.interestedPlayerIds" : playerOptionDet.playerId}};
	}
	matchesCollection.update({matchId : playerOptionDet.uniqueId , "teamDet.teamId" : playerOptionDet.teamId}
							,saveQuery,function (err, docs){
								if(err === null){
									res.send({msg : 'Success'});
								}else{
									res.send({msg : err});
								}
							})
	
});

router.post('/saveSelectedPlayers', function(req, res){
	var db = req.db;
	var saveSelectedPlayersDet = req.body;
	var matchesCollection = db.get('matches');
	
	matchesCollection.update({matchId : saveSelectedPlayersDet.uniqueId , "teamDet.teamId" : saveSelectedPlayersDet.teamId}
							,{$set : {"teamDet.$.selectedPlayerIds" : saveSelectedPlayersDet.selectedPlayerIds}},function (err, docs){
								if(err === null){
									res.send({msg : 'Success'});
								}else{
									res.send({msg : err});
								}
							})
	
});


router.get('/getMatchStatusByPlayer/:id', function(req, res) {

	var db = req.db;
	var playerId = req.params.id;

	var matchesCollection = db.get('matches');
	var playerCollection = db.get('player');
	var playerIds = [];
	var matchStatusDet = {};

	matchesCollection.find({$or : [{"teamDet.selectedPlayerIds" : playerId},{"teamDet.interestedPlayerIds" : playerId}]},function(err,matchDetDocs){
		if(err === null)
		{
			if(matchDetDocs != null )
			{
				matchStatusDet.matchDet = matchDetDocs;

				for(var i = 0 ; i < matchDetDocs.length ; i ++)
				{
					var playerIdArr = [];
					var teamDet = matchDetDocs[i].teamDet;
					var isHomeTeam = false;

					for(var j = 0 ; j < teamDet.length ; j ++)
					{
						if(teamDet[j].interestedPlayerIds.indexOf(playerId) != -1 || teamDet[j].selectedPlayerIds.indexOf(playerId) != -1)
						{
							if(!isHomeTeam)
							{
								isHomeTeam = true;
								teamDet[j].isHome = true;
								playerIdArr = playerIdArr.concat(teamDet[j].interestedPlayerIds);
								playerIdArr = playerIdArr.concat(teamDet[j].selectedPlayerIds);
							}else{
								teamDet[j].isHome = false;	
							}
							
						}else{
							teamDet[j].isHome = false;
						}
					}

					for(var k = 0 ; k < playerIdArr.length ; k++)
					{
						if(playerIds.indexOf(playerIdArr[k]) == -1)
						{
							playerIds.push(playerIdArr[k]);
						}
					}
				}
				playerCollection.find({playerId : {$in : playerIds}},function(err,playerDetDocs){
					if(err === null)
					{
						matchStatusDet.playerDet = playerDetDocs;
						res.send({msg : 'Success', matchStatusDet : matchStatusDet});
					}else{
						res.send({msg : err});
					}
				});
			}else{
				res.send({msg : 'Success', matchStatusDet : matchStatusDet});
			}
		}else{
			res.send({msg : err});
		}
	});
});

module.exports = router;