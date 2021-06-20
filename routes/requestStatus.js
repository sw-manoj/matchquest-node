var express = require('express');
var router = express.Router();

router.get('/', function(req, res, next) {
	res.send('no response from request status');
	});

router.get('/getRequestStatus/:id', function(req, res){
	var db = req.db;
	var playerCollection = db.get('player');
	var inviteCollection = db.get('invites');

	var inviteRes = {};
	var teamId = parseInt(req.params.id);

	var playerIds = [];
	var inviteIds = [];

	inviteCollection.find({teamId : teamId} , function (err,inviteDocs){
		if(err === null)
		{
			for(var i = 0 ; i < inviteDocs.length ; i ++)
			{
				var nonInterestedPlayerIds = inviteDocs[i].nonInterestedPlayerIds;
				for(var playerInc = 0 ; playerInc < nonInterestedPlayerIds.length ; playerInc ++)
				{
					if(playerIds.indexOf(nonInterestedPlayerIds[playerInc]) == -1)
					{
						playerIds.push(nonInterestedPlayerIds[playerInc]);
					}
				}
				var requestDocArr = inviteDocs[i].request;

				for(var requestInc = 0 ; requestInc < requestDocArr.length ; requestInc ++)
				{
					if(inviteIds.indexOf(requestDocArr[requestInc].inviteId) == -1)
					{
						inviteIds.push(requestDocArr[requestInc].inviteId);
					}
					var interestedPlayers = requestDocArr[requestInc].playerIds;
					for(var playerInc = 0 ; playerInc < interestedPlayers.length ; playerInc ++)
					{
						if(playerIds.indexOf(interestedPlayers[playerInc]) == -1)
						{
							playerIds.push(interestedPlayers[playerInc]);
						}
					}
				}
			}
			inviteCollection.find({inviteId : {$in : inviteIds}},function(err, requestInviteDocs){
				if(err === null)
				{
					playerCollection.find({playerId : { $in : playerIds }} , function(err,playerDocs){
						if(err === null)
						{
							inviteRes.inviteDet = inviteDocs;
							inviteRes.requestInviteDet = requestInviteDocs;
							inviteRes.playerDet = playerDocs;
							res.send({msg : 'Success',inviteDetDoc : inviteRes });
						}else{
							res.send({msg : err});
						}
					});
				}else{
					res.send({msg : err});
				}
			});
		}else{
			res.send({msg : err});
		}
	});
	

});

router.post('/savePlayerOpinion', function(req, res){
	var db = req.db;
	var playerOptionDet = req.body;
	var inviteCollection = db.get('invites');
	var playerIdUpdate = {};

	

	if(playerOptionDet.isParent){

		if(playerOptionDet.toRemove){

			playerIdUpdate = {$pull : {nonInterestedPlayerIds : playerOptionDet.playerId}};
		}else{

			playerIdUpdate = {$push : {nonInterestedPlayerIds : playerOptionDet.playerId}};
		}

		inviteCollection.update({teamId : playerOptionDet.teamId, inviteId : playerOptionDet.inviteId},
								playerIdUpdate , function (err,docs){
			if(err === null)
			{
				res.send({msg : 'Success'});
			}else{
				res.send({msg : err});
			}
		});
	}else{
		if(playerOptionDet.toRemove){

			playerIdUpdate = {$pull : {"request.$.playerIds" : playerOptionDet.playerId}};
		}else{

			playerIdUpdate = {$push : {"request.$.playerIds" : playerOptionDet.playerId}};
		}

		inviteCollection.update({teamId : playerOptionDet.teamId, inviteId : playerOptionDet.parentInviteId , "request.inviteId" : playerOptionDet.inviteId},
								playerIdUpdate , function (err,docs){
			if(err === null)
			{
				res.send({msg : 'Success'});
			}else{
				res.send({msg : err});
			}
		});
	}
});

router.post('/cancelInvite', function(req, res){
	var db = req.db;
	var inviteDet = req.body;
	var inviteCollection = db.get('invites');

	inviteCollection.update({teamId : inviteDet.parentTeamId , inviteId: inviteDet.parentInviteId},
							{$pull : {request : { inviteId : inviteDet.inviteId}}},function (err, docs){

			if(err === null)
			{
				inviteCollection.update({teamId : inviteDet.teamId , inviteId: inviteDet.inviteId},
							{$pull : {request : { inviteId : inviteDet.parentInviteId}}},function (err, docs){

					if(err === null)
					{
						res.send({msg : 'Success'});
					}else{
						res.send({msg : err});
					}
				});
			}else{
				res.send({msg : err});
			}
		});
});

router.post('/closeInvite', function(req, res){
	var db = req.db;
	var inviteDet = req.body;
	var inviteCollection = db.get('invites');

	inviteCollection.update({"request.inviteId" : inviteDet.inviteId},
							{$pull : {request : { inviteId : inviteDet.inviteId}}},function (err, docs){

		if(err === null)
		{
			inviteCollection.remove({inviteId : inviteDet.inviteId},function(err,docs){
				if(err === null)
				{
					res.send({msg : 'Success'});
				}else{
					res.send({msg : err});
				}
			});
		}else{
			res.send({msg : err});
		}
	});
});

router.post('/acceptInvite', function(req, res) {
    var db = req.db;
    var inviteDet = req.body;

   	getmatchDetailData(db,res,inviteDet);




});

function getmatchDetailData(db,res,inviteDet)
{

    var counterCollection = db.get('nextval');
    var topicCollection = db.get('topic');

    counterCollection.findAndModify({query : {ids : 'matchId'}, update : {$inc : {seqValue : 1}} ,new : true } ,function(err,counterDocs)
	    		{
	    			if(err !== null)
	    			{
	    				res.send({ msg: err });
	    			}else{

		    			topicCollection.find({category : 'MatchDetail'},{topicId: 1 , _id : 0} , function(err,topicDocs)
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

			    				inviteDet.matchId = counterDocs.seqValue;
			    				inviteDet.topicIds = topicArr;

			    				insertMatchDetail(db,inviteDet,res);
		    				}
		    			});

	    			}
	    		});
}

function insertMatchDetail(db,inviteDet,res)
{
	var matchesCollection = db.get('matches');
	var matchDetail = {
		matchId : inviteDet.matchId,
		teamDet : inviteDet.teamDet,
		location : inviteDet.location,
		date : new Date(inviteDet.date),
		nop : inviteDet.nop,
		time : inviteDet.time,
		topicIds : inviteDet.topicIds	
	};

	matchesCollection.insert(matchDetail , function(err, docs){
		if(err === null)
		{
			deleteInvites(db,inviteDet,res);
		}else{
			res.send({msg : err});
		}
	})
}

function deleteInvites(db,inviteDet,res)
{
	var inviteCollection = db.get('invites');
	inviteCollection.remove({inviteId : {$in : [inviteDet.inviteId,inviteDet.parentInviteId]}},function(err,docs){
				if(err === null)
				{
					inviteCollection.update({"request.inviteId" : {$in : [inviteDet.inviteId,inviteDet.parentInviteId]}},
							{$pull : {request : { inviteId : {$in : [inviteDet.inviteId,inviteDet.parentInviteId]}}}},function (err, docs){
								if(err === null)
								{
									res.send({msg : 'Success'});
									loadGroundDet(db,inviteDet);
									topicComments(db,inviteDet);
								}else{

								}

						});
				}else{
					res.send({msg : err});
				}
	});

}

function loadGroundDet(db,inviteDet)
{
	var locationCollection = db.get('location');
	var ground = [];


	locationCollection.find({location : {$in : inviteDet.location}},{fields : {_id : 0 ,grounds : 1}},function(err, groundDocs){
		if(err === null)
		{
			if(groundDocs != null)
			{
				console.log(groundDocs);
				for(var i = 0 ; i < groundDocs.length ; i ++)
				{
					
					var groundDetArr = groundDocs[i].grounds;
					for(var j = 0 ; j < groundDetArr.length ; j ++)
					{
						ground.push(groundDetArr[j]);
						if(ground.length == 4)
						{
							break;
						}
					}
					if(ground.length == 4)
					{
						break;
					}
				}
			}
		}
		topicDet(db,inviteDet,ground);
	});
}

function topicDet(db,inviteDet,ground)
{
	var topicCollection = db.get('topic');
	var topicWithOptionCollection = db.get('topicWithOption');

	var topicIds = inviteDet.topicIds;
	var options = {uniqueId : inviteDet.matchId};

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
					if(topicWithOptionDocs[0].topic.toString().trim() == 'Ground')
					{
						var groundOption = [];
						for(var j = 0 ; j < ground.length ; j ++)
						{
								optionArr[j].option = ground[j];
								groundOption.push(optionArr[j]);
						}

						options.options = groundOption;

					}else if(topicWithOptionDocs[0].topic.toString().trim() == 'Time')
					{
						for(var j = 0 ; j < optionArr.length ; j ++)
						{
								optionArr[j].option = inviteDet.time;
						}
						options.options = optionArr;

					}else if(topicWithOptionDocs[0].topic.toString().trim() == 'No of Overs')
					{
						var nop = parseInt(inviteDet.nop);
						optionArr[0].option = ((nop*2)- ((nop*2)/2)) + "";
						optionArr[1].option = ((nop*2)- ((nop*2)/4)) + "";
						optionArr[2].option = (nop*2)+"";
						optionArr[3].option = ((nop*2) + ((nop*2)/4)) + "";
						options.options = optionArr;

					}
					
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


function topicComments(db,doc)
{
	var topicCommentsCollection = db.get('topicComments');
	var topicIds = doc.topicIds;
	var options = {uniqueId : doc.matchId};
	maxLength = topicIds.length;
	incrementer = 0;

	for(var i = 0 ; i < topicIds.length ; i ++)
	{
		topicCommentsCollection.insert({topicId : topicIds[i] , uniqueId : doc.matchId , comments : []});
		
			
	}
}

module.exports = router;