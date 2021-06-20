var express = require('express');
var router = express.Router();

var maxLength = 0;
var incrementer = 0;

var month_name = function(dt){  
mlist = [ "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec" ];  
  return mlist[dt.getMonth()];  
}  

router.get('/', function(req, res, next) { 
	
  res.send('team with a no resource');
});

function insertPlayers(db,res,team,toUpdate)
{
	// var db = req.db;
	var playerIds = [];
	var playerDet = [];
	var playerDetArr = team.playerIds;
	var registeredPlayerIds = [];

	var teamIdsDet;
	var playerCollection = db.get('player');

	//team.playerIds give player detail i.e, with name and Id
	maxLength = playerDetArr.length;
	incrementer = 0;

	for(var i = 0 ; i < maxLength ; i++)
	{
		var parseDate = new Date();
		var newDate = new Date(parseDate.getTime() + (1000 * i));
		teamIdsDet = {teamId : team.teamId , addedAt : newDate};
		//teamIds updation is really not necessary , we are not going to use it any where else we have to change this later.
		//let us wait and see if this can be really removed

		playerCollection.findAndModify({query : {playerId : playerDetArr[i].playerId}, update : { $push : {teamIds : teamIdsDet}} ,new : true },function(err,docs)
		{
			if(docs === null)
			{
				
			}else{
				playerDetArr[incrementer].isRegistered = docs.isRegistered;
				registeredPlayerIds.push(docs.playerId);

				playerDet.push(docs);
				playerIds.push(docs.playerId);
			}
				
					
				if((maxLength-1) == incrementer)
				{
					for(var j = 0 ; j < maxLength ; j ++)
					{
						var toInsert = true;
						for(var k = 0 ; k < registeredPlayerIds.length ; k ++)
						{
							if(playerDetArr[j].playerId == registeredPlayerIds[k])
							{
								toInsert = false;
								break;
							}	
						}
						if(toInsert)
						{
							var parseDate = new Date();
							var newDate = new Date(parseDate.getTime() + (1000 * incrementer));
							teamIdsDet = {teamId : team.teamId , addedAt : newDate};

							//no modification done so docs is null
							playerDetArr[j].isRegistered = false;
							playerDetArr[j].teamIds = [teamIdsDet];
							playerCollection.insert(playerDetArr[j]);

							playerDet.push(playerDetArr[j]);
							playerIds.push(playerDetArr[j].playerId);
						}
					}
					team.playerIds = playerIds;
					if(toUpdate)
					{
						updatePlayersOfTeam(db,res,team,playerDet);
					}else{
						createTeam(db,res,team);
					}
				}
				incrementer++;
			
		});
		
	}

}

router.get('/insert' ,function(req,res){

	var db = req.db;
	var playerIds = [];
	var playerDet = [];
	var team = {teamId : 1063 , playerIds : [ { playerName: 'manoj', playerId: '9551591160' },
  { playerName: '9884240197', playerId: '9884240197' },
  { playerName: 'AnnaDurai', playerId: '918067432900' },
  { playerName: 'Arvind', playerId: '17204692279' },
  { playerName: 'Choka', playerId: '9710266267' },
  { playerName: 'Cristo', playerId: '9688365055' } ]
};
teamCol = db.get('team');

teamCol.find({teamId : 1000} ,function(err,docs){
insertPlayers(db,res,team,false);
});
	

});

function createTeam(db,res,team)
{
	// var db = req.db;

    var teamCollection = db.get('team');
	teamCollection.insert(team , function(err , docs){
				if(err === null)
				{
					res.send({ msg: 'Success' });
					topicDet(db,team);
					topicComments(db,team);
				}else{
					res.send({ msg: err });
				}
			});
}



function updatePlayersOfTeam(db,res,team,playerDet)
{
	// var db = req.db;

    var teamCollection = db.get('team');
	teamCollection.update({teamId : team.teamId},{ $push :{playerIds :{$each: team.playerIds}}}, function(err , docs){
				if(err === null)
				{
					res.send({ msg: 'Success' ,playerDetail : playerDet});
				}else{
					res.send({ msg: err });
				}
			});
}

router.post('/createTeam', function(req, res) {
    var db = req.db;
    var team = req.body;

    var teamCollection = db.get('team');
    var counterCollection = db.get('nextval');
    var topicCollection = db.get('topic');
    counterCollection.findAndModify({query : {ids : 'teamId'}, update : {$inc : {seqValue : 1}} ,new : true } ,function(err,counterDocs)
	    		{
	    			if(err !== null)
	    			{
	    				res.send({ msg: err });
	    			}else{

		    			topicCollection.find({category : 'NextGame'},{topicId: 1 , _id : 0} , function(err,topicDocs)
		    			{
		    				if(err !== null)
		    				{
		    					res.send({ msg: err });
		    				}
		    				else{

			    				var topicArr = [];
			    				for(var i = 0 ; i < topicDocs.length ; i ++)
			    				{
			    					topicArr.push(topicDocs[i].topicId);
			    				}

			    				team.teamId = counterDocs.seqValue;
			    				team.teamCode = counterDocs.seqValue;
			    				team.topicIds = topicArr;

			    				insertPlayers(db,res,team,false);

		    				}
		    			});

	    			}
	    		});

});

router.get('/getTeamDetail/:id' , function(req, res){
 	var db = req.db;
 	var teamCollection = db.get('team');

 	var playerCollection = db.get('player');

 	teamCollection.find({playerIds : req.params.id} , function(err,teamDocs){
 		
 		if(err !== null)
 		{
 			res.send({msg : err});
 		}
 		else
 		{
	 		if(teamDocs.length === 0 )
	 		{
	 			res.send({msg : 'Success' , teamDetail : []});
	 		}else{
	 			maxLength = teamDocs.length;
	 			incrementer = 0;

	 			for(var i = 0 ;  i < maxLength ; i++)
	 			{
	 				playerCollection.find({playerId : { $in : teamDocs[i].playerIds }} , function(err,playerDocs){

	 					if(err !== null)
				 		{
				 			res.send({msg : err});
				 		}else{
		 					teamDocs[incrementer].playerIds = playerDocs;

		 					if(maxLength-1 == incrementer)
			 				{
			 					res.send({msg : 'Success' , teamDetail : teamDocs});	
			 				}
			 				incrementer++;
		 				}
	 				});
	 				
	 			}
	 			
	 		}
 		}
 		

 	});
});


router.post('/changeTeamName',function(req,res){
	var db = req.db;
    var team = req.body;
    var teamCollection = db.get('team');

    teamCollection.update({teamId : team.teamId},{$set : {teamName : team.teamName}},function(err,docs){
    	if(err === null)
		{
			res.send({ msg: 'Success' });
		}else{
			res.send({ msg: err });
		}
    });
});

router.post('/addTeamMembers',function(req,res){
	var db = req.db;
    var team = req.body;
    var teamCollection = db.get('team');

   	insertPlayers(db,res,team,true);
});

function removeTeamMember(req,res,detail)
{
	var db = req.db;
	var teamCollection = db.get('team');
	var playerCollection = db.get('player');

	playerCollection.update({playerId : detail.playerId} , {$pull  : {teamIds : { teamId : detail.teamId}}}, function(err,docs){
		if(err === null)
		{
			teamCollection.findAndModify({query : {teamId : detail.teamId} , update : {$pull : {playerIds : detail.playerId} } ,new : true} , function (err,docs){
				if(err === null)
				{
					res.send({msg : 'Success' , teamDetail : docs});	
				}else{
					res.send({msg : err});	
				}
			});
		}else{
			res.send({msg : err});		
		}
	});
	
}

function changeCaptain(req,res,detail,canReturn)
{
	var db = req.db;
	var teamCollection = db.get('team');
	

	teamCollection.update({teamId : detail.teamId} , {$set : {captain : detail.newPlayerId}},function (err,docs){
		if(err === null)
		{

			if(canReturn)
			{
				if(detail.changeViceCaptain !== null && detail.changeViceCaptain)
				{
					detail.playerId = detail.newPlayerId;
					changeViceCaptain(req,res,detail,canReturn);
				}else{
					res.send({msg : 'Success'});
				}
			}else{
				
				changeViceCaptain(req,res,detail,canReturn);
			}

		}else{
			res.send({msg : err});
		}
	});
}

function changeViceCaptain(req,res,detail,canReturn)
{
	var db = req.db;
	var teamCollection = db.get('team');
	var playerCollection = db.get('player');

	playerCollection.col.aggregate([{$match : {'teamIds.teamId' : detail.teamId,playerId : {$nin : [detail.playerId,detail.newPlayerId]}}},{$sort : {isRegistered : -1,'teamIds.addedAt' : 1}},{$limit : 1}],function (err,docs){
					if(err === null)
					{
						if(docs !== null && docs.length === 1)
						{
							teamCollection.update({teamId : detail.teamId} , {$set : {viceCaptain : docs[0].playerId}},function (err,result){
								if(err === null)
								{
									if(canReturn)
									{
										console.log(docs[0].playerId);
										res.send({msg : 'Success',viceCaptain : docs[0].playerId});
									}else{
										removeTeamMember(req,res,detail);
									}
								}else{
									res.send({msg : err});
								}
							});
							
						}else{
							removeTeamMember(req,res,detail);
						}
					}else{
						res.send({msg : err});
					}
				});
	
}

router.post('/removeFromTeam',function(req,res){
	var db = req.db;
    var detail = req.body;
    var playerCollection = db.get('player');
     
    if(detail.toUpdate == null)
    {
    	removeTeamMember(req,res,detail);
    }else if(detail.toUpdate == 'captain')
    {
    	changeCaptain(req,res,detail,false);
    }else if(detail.toUpdate == 'viceCaptain')
    {
    	changeViceCaptain(req,res,detail,false);
    }

   	
});

router.post('/changeCaptain',function(req,res){
	var db = req.db;
	var detail = req.body;
	changeCaptain(req,res,detail,true);
});

router.post('/changeViceCaptain',function(req,res){
	var db = req.db;
	console.log('1');
	var detail = req.body;
	var teamCollection = db.get('team');

	teamCollection.update({teamId : detail.teamId} , {$set : {viceCaptain : detail.newPlayerId}},function (err,docs){
		if(err === null)
		{
			res.send({msg : 'Success'});

		}else{
			res.send({msg : err});
		}
	});

});

function topicDet(db,team)
{
	var topicCollection = db.get('topic');
	var topicWithOptionCollection = db.get('topicWithOption');
	var topicIds = team.topicIds;
	var options = {uniqueId : team.teamId};
	maxLength = topicIds.length;
	incrementer = 0;

	for(var i = 0 ; i < topicIds.length ; i ++)
	{
		
		topicWithOptionCollection.find({topicId : topicIds[i]}, function(err,topicWithOptionDocs)
		{
			if(err === null)
			{
				if(topicWithOptionDocs.length == 1)
				{
					var optionArr = topicWithOptionDocs[0].options;
					if(topicWithOptionDocs[0].topic.toString().trim() == 'Date')
					{
						for(var j = 0 ; j < optionArr.length ; j ++)
						{
							
								var date = new Date();
								var newDate = new Date(date.getTime() + (86400000 * j));
								optionArr[j].option = month_name(newDate) + " " + newDate.getDate();
						}

					}
					options.options = optionArr;
					options.option = optionArr[0].optionId;
					

					topicCollection.update({topicId : topicWithOptionDocs[0].topicId},{$push : {options : options}},function(err,updateStatus){
						if(err === null)
						{
						}
					});
				}
			}
			if((maxLength-1) == incrementer)
			{
					
			}
			
			incrementer++;
		});
			
	}
}

function topicComments(db,team)
{
	var topicCommentsCollection = db.get('topicComments');
	var topicIds = team.topicIds;
	var options = {uniqueId : team.teamId};
	maxLength = topicIds.length;
	incrementer = 0;

	for(var i = 0 ; i < topicIds.length ; i ++)
	{
		topicCommentsCollection.insert({topicId : topicIds[i] , uniqueId : team.teamId , comments : []});
		
			
	}
}

module.exports = router;