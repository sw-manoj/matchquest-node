var express = require('express');
var router = express.Router();
var maxLength = 0;
var incrementer = 0;


router.get('/', function(req, res, next) {
	var db = req.db;
	var teamCollection = db.get('team');
	var i = parseInt('4');
	var newDate = new Date("2016-04-03");
	teamCollection.col.aggregate({$match : {teamId : {$ne : 1068},"invites.canGetRequest" : true,
 "invites.nop" : {$gte :(i-1),$lte : (i+1)},"invites.location" : {$in : ['adyar','mylapore']},"invites.date" : newDate}} ,
{$project : {_id : 0 , invites  : 1, teamName : 1, teamId : 1,teamCode : 1}} , {$unwind : "$invites"} , 
{$match : { "invites.nop" : {$gte :(i-1),$lte : (i+1)},"invites.location" : {$in : ['adyar','mylapore']},"invites.date" : newDate}} 
		,function(err,docs){
			res.send(docs);			
		});

  
});

router.post('/searchInvite' ,function(req,res){
	var db = req.db;
	var searchQuery = req.body;

	var teamId = searchQuery.teamId;
	var location = searchQuery.location;
	var date = new Date(searchQuery.date);
	var nop = parseInt(searchQuery.nop);
	
	var inviteCollection = db.get('invites');

	inviteCollection.find({teamId : {$ne : teamId},canGetRequest : true,
			nop : {$gte :(nop-1),$lte : (nop+1)},location : {$in : location},date : date},function (err,inviteDocs){
				if(err === null)
				{
					res.send({msg : 'Success' , inviteDetArr : inviteDocs});			
				}else{
					res.send({msg : err})
				}
			});

	// teamCollection.col.aggregate({$match : {teamId : {$ne : teamId},"invites.canGetRequest" : true,
 // 			"invites.nop" : {$gte :(nop-1),$lte : (nop+1)},"invites.location" : {$in : location},"invites.date" : date}} ,
	// 		{$project : {_id : 0 , invites  : 1, teamName : 1, teamId : 1,teamCode : 1}} , {$unwind : "$invites"} , 
	// 		{$match : { "invites.nop" : {$gte :(nop-1),$lte : (nop+1)},"invites.location" : {$in : location},"invites.date" : date}} 
	// 	,function(err,inviteDocs){
	// 		if(err === null)
	// 		{
	// 			res.send({msg : 'Success' , inviteDetArr : inviteDocs});			
	// 		}else{
	// 			res.send({msg : err})
	// 		}
			
	// 	});
});

router.post('/postInvite' ,function(req,res){
	var db = req.db;
    var inviteDet = req.body;

    var teamId = inviteDet.teamId;

    var inviteCollection = db.get('invites');


    	if(inviteDet.isInviteSaved)
    	{
    		inviteCollection.update({teamId : teamId ,inviteId : inviteDet.inviteId},
    				{$set : {canGetRequest : inviteDet.canGetRequest}},function(err,docs){
    					if(err !== null)
    					{
    						res.send({msg : err });	
    					}else{
    						res.send({msg : 'Success' });	
    					}
    				});
    	}else{

    		var inviteDoc = { 	teamId : inviteDet.teamId,
    							teamName : inviteDet.teamName,
    							teamCode : inviteDet.teamCode,
    							inviteId : inviteDet.inviteId,
    							location : inviteDet.location,
    							nop : inviteDet.nop,
    							date : new Date(inviteDet.date),
    							time : inviteDet.time,
    							postedBy : inviteDet.postedBy,
    							request : inviteDet.request,
    							nonInterestedPlayerIds : inviteDet.nonInterestedPlayerIds,
    							canGetRequest : inviteDet.canGetRequest
    						};
    		inviteCollection.insert(inviteDoc , function (err ,docs){
    					if(err !== null)
    					{
    						res.send({msg : err });	
    					}else{
    						res.send({msg : 'Success' });	
    					}

    				
    		});
    	}
    


});

function updateOpponentDet(db,res,opponentInviteDet)
{
	 var inviteCollection = db.get('invites');

	 inviteCollection.update({teamId : opponentInviteDet.teamId ,inviteId : opponentInviteDet.inviteId},
    				{$push : {request : opponentInviteDet.request}},function(err,docs){
    					if(err !== null)
    					{
    						res.send({msg : err });	
    					}else{
    						res.send({msg : 'Success' });
    					}
    				});

}

router.post('/saveInvite' ,function(req,res){
	var db = req.db;
    var saveInviteDoc = req.body;

    var requestInviteDet = saveInviteDoc.requestDet;
    var opponentInviteDet = saveInviteDoc.opponentDet;

    var teamId = requestInviteDet.teamId;

    var inviteCollection = db.get('invites');

    if(requestInviteDet.isInviteSaved)
    {
    	inviteCollection.update({teamId : teamId ,inviteId : requestInviteDet.inviteId},
    				{$push : { request : requestInviteDet.request}},function(err,docs){
    					if(err !== null)
    					{
    						res.send({msg : err });	
    					}else{
    						updateOpponentDet(db,res,opponentInviteDet);
    					}
    				});
    }else{
    	var inviteDoc = { 		teamId : requestInviteDet.teamId,
    							teamName : requestInviteDet.teamName,
    							teamCode : requestInviteDet.teamCode,
    							inviteId : requestInviteDet.inviteId,
    							location : requestInviteDet.location,
    							nop : requestInviteDet.nop,
    							date : new Date(requestInviteDet.date),
    							time : requestInviteDet.time,
    							postedBy : requestInviteDet.postedBy,
    							request : requestInviteDet.request,
    							nonInterestedPlayerIds : requestInviteDet.nonInterestedPlayerIds,
    							canGetRequest : requestInviteDet.canGetRequest
    						};
    		inviteCollection.insert(inviteDoc , function (err ,docs){
    					if(err !== null)
    					{
    						res.send({msg : err });	
    					}else{
    						updateOpponentDet(db,res,opponentInviteDet);
    					}

    				
    		});
    }

 });

module.exports = router;
