var express = require('express');
var router = express.Router();

var maxLength = 0;
var incrementer = 0;

var month_name = function(dt){  
mlist = [ "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec" ];  
  return mlist[dt.getMonth()];  
}  

router.get('/', function(req, res, next) {
	for(var j = 0 ; j < 4 ; j ++)
	{
							
	var date = new Date();
	var newDate = new Date(date.getTime() + (86400000 * j));
			console.log(month_name(newDate) + " " + newDate.getDate());
}
  res.send('team with a no resource');
  // getNextVal(db,'topicId',function(response){
		// 	console.log(response);
		// });
});

router.post('/getTopicDetail', function(req, res) {
	var db = req.db;
	var team = req.body;
	var topic = db.get('topic');
	topic.find({topicId : {$in : team.topicIds }},{fields : {topicId : 1, topic :1,createdBy : 1 , category : 1, options : {$elemMatch : {uniqueId : team.uniqueId}}}},
			function(err, teamDetailDocs){
				if(err === null)
				{
					res.json({msg : 'Success' , teamDetail : teamDetailDocs});
				}else{
					res.send({msg : err});
				}
		
	});	
  
});

router.post('/saveTopicDetail', function(req, res) {
	var db = req.db;
	var topicDet = req.body;
	// var topicDet = {topicId : 144 , uniqueId : 1051 ,
	// 			options : [ {optionId : 321 , playerId : '955' , toAdd : false},{optionId : 323 , playerId : '95515' , toAdd : true}]};
	var topic = db.get('topic');
	var updateQuery ;
	incrementer = 0 ;
	maxLength = topicDet.options.length;

	topic.find({topicId :  topicDet.topicId },{fields : {topicId : 1, topic :1,createdBy : 1 , category : 1, options : {$elemMatch : {uniqueId : topicDet.uniqueId}}}},
			function(err, topicDocs){
				if(err === null)
				{
					if(topicDocs.length == 1 && topicDocs[0].options.length == 1)
					{
						var optionDetDocs = topicDocs[0].options[0].options;
						for(var i = 0 ; i < optionDetDocs.length ; i ++)
						{
							for(var j = 0 ;j < topicDet.options.length ; j ++)
							{
								if(optionDetDocs[i].optionId == topicDet.options[j].optionId)
								{
									if(topicDet.options[j].toAdd)
									{
										if(optionDetDocs[i].playerIds.indexOf(topicDet.options[j].playerId) == -1)
										{
										optionDetDocs[i].playerIds.push(topicDet.options[j].playerId);
										}
									}else{
										optionDetDocs[i].playerIds.splice
											(optionDetDocs[i].playerIds.indexOf(topicDet.options[j].playerId),1);
									}
									break;
								}
							}
						}
						var option = topicDocs[0].options[0].optionId;
						var maxCount = 0;
						for(var i = 0 ; i < optionDetDocs.length ; i ++)
						{
							if(maxCount < optionDetDocs[i].playerIds.length)
							{
								option = optionDetDocs[i].optionId;
								maxCount = optionDetDocs[i].playerIds.length;
							}
						}

						topic.update({topicId : topicDet.topicId , 'options.uniqueId' : topicDet.uniqueId} ,
							 {$set : {'options.$.options' : optionDetDocs, 'options.$.option' : option} },function(err, updateDocs){
							 	if(err === null)
							 	{
							 		topicDocs[0].options[0].option = option;
							 		res.json({msg : 'Success', topicDetail : topicDocs});
							 	}else{
							 		res.send({msg : 'update failure'});
							 	}
							 })
					}else{
						res.send({msg : 'failure'});
					}
				}else{
					res.send({msg : err});
				}
		
	});	
  
});

router.post('/addTopicDetail', function(req, res) {
	var db = req.db;
	var addTopicDetDoc = req.body;

	var screenName = addTopicDetDoc.ScreenName;
	var topicDet = addTopicDetDoc.TopicDetail;
	var topicCollection = db.get('topic');

	// topicCollection.find({topic : topicDet.topic , category : {$nin : ['NextGame','MatchDetail']}},function(err,topicDocs){
	// 	if(err !== null || (topicDocs != null && topicDocs.length != 0) )
	// 	{
	// 		topicCollection.update({topicId : topicDocs[0].topicId}, {$push  : {options : topicDet.options}},function(err,doc)
	// 		{
	// 			if(err === null)
	// 			{
	// 				updateUniqueId(req,res,topicId);
	// 			}else{
	// 				res.send({msg : err});
	// 			}
	// 		});
	// 	}else{
	// 		getNextVal(db, 'topicId' ,function (topicId)
	// 		{
	// 			if(topicId != -1)
	// 			{
	// 				addTopicDetail(req,res,topicId);
	// 			}else{
	// 				res.send({msg : 'Problem in incrementing'});
	// 			}
	// 		});
	// 	}
	// });

	getNextVal(db, 'topicId' ,function (topicId)
		{
			if(topicId != -1)
			{
				addTopicDetail(req,res,topicId);
			}else{
				res.send({msg : 'Problem in incrementing'});
			}
		});
});

function addTopicDetail(req, res,topicId)
{
	var db = req.db;
	var addTopicDetDoc = req.body;

	var topicDet = addTopicDetDoc.TopicDetail;
	var topicCollection = db.get('topic');
	var teamCollection = db.get('team');
	topicDet.topicId = topicId;

	topicCollection.insert(topicDet , function (err, docs){
		if(err === null)
		{
			updateUniqueId(req,res,topicId);
		}else{
			res.send({msg : err});
		}

	});


}

function updateUniqueId(req,res,topicId)
{
	var db = req.db;
	var addTopicDetDoc = req.body;

	var screenName = addTopicDetDoc.ScreenName;
	var topicDet = addTopicDetDoc.TopicDetail;
	var teamCollection = db.get('team');
	var matchCollection = db.get('matches');

	if(screenName == 'matchStatus')
		{
			matchCollection.update({matchId : topicDet.options[0].uniqueId},{$push : {topicIds : topicId}},function(err,doc)
			{
				if(err === null)
				{
					res.send({msg : 'Success',topicId : topicId});
					topicComments(db,topicDet.topicId,topicDet.options[0].uniqueId);
				}else{
					res.send({msg : err});
				}
			});
		}else if(screenName == 'teamDetail')
		{
			teamCollection.update({teamId : topicDet.options[0].uniqueId},{$push : {topicIds : topicId}},function(err,doc)
			{
				if(err === null)
				{
					res.send({msg : 'Success',topicId : topicId});
					topicComments(db,topicDet.topicId,topicDet.options[0].uniqueId);
				}else{
					res.send({msg : err});
				}
			});
		}
}

router.post('/updateTopicDetail', function(req, res) {
	var db = req.db;
	var topicDet = req.body;

	var topicCollection = db.get('topic');
	console.log(topicDet.topic);

	topicCollection.update({topicId : topicDet.topicId} , {$set : {topic : topicDet.topic}} ,function (err,docs)
	{
		if(err === null)
		{
			if(topicDet.options.length == 1)
			{
				var uniqueId = topicDet.options[0].uniqueId;
				var optionsArrDet = topicDet.options[0].options;

				updateOption(topicDet.topicId,optionsArrDet,uniqueId,topicCollection,function(response){
					res.send(response);
				});
				
			}else{
				res.send({msg : 'wrong input data'});	
			}
		}else{
			res.send({msg : err});
		}
	});

	
});

function updateOption(topicId,optionDet,uniqueId,topicCollection,callback)
{
	topicCollection.find({topicId : topicId},{fields : {topicId : 1, topic :1,createdBy : 1 , category : 1,options : {$elemMatch : {uniqueId : uniqueId}}}},
		function(err, topicDetDocs){
			if(topicDetDocs.length == 1 && topicDetDocs[0].options.length == 1)
			{
				var optionsArrDb = topicDetDocs[0].options[0].options;
				for(var i = 0 ; i < optionDet.length ; i ++)
				{
					var isAlreadyExist = false;
					for(var j = 0 ; j < optionsArrDb.length ; j ++)
					{
						if(optionDet[i].optionId == optionsArrDb[j].optionId)
						{
							isAlreadyExist = true;
							optionsArrDb[j].option = optionDet[i].option;
							break;
						}
					}
					if(!isAlreadyExist)
					{
						optionsArrDb.push(optionDet[i]);
					}
				}

				topicCollection.update({topicId : topicId,'options.uniqueId' : uniqueId},{$set : {'options.$.options' : optionsArrDb}},function(err,docs){
					if(err === null)
					{
						callback({msg : 'Success', topicDetail : topicDetDocs});
					}else{
						callback({msg : err});
					}
				});
			}else{
				callback('failure');
			}
		});
	
}

router.post('/addTopicComment', function(req, res) {
	var db = req.db;
	var addTopicCommentDoc = req.body;
	var topicCommentCollection = db.get('topicComments');

	var commentDoc = {comment : addTopicCommentDoc.comment , playerId : addTopicCommentDoc.playerId , date : new Date()};

	topicCommentCollection.update({topicId : addTopicCommentDoc.topicId , uniqueId : addTopicCommentDoc.uniqueId}, 
		{$push : {comments : commentDoc}}, function (err, docs){
			if(err === null)
			{
				res.send({msg : 'Success'});
			}else{
				res.send({msg : err});
			}
		});
});

router.post('/getTopicComments' , function(req, res){
 	var db = req.db;
 	var queryDet = req.body;

 	var topicCommentsCollection = db.get('topicComments');

 	var playerCollection = db.get('player');

// var hrTime = process.hrtime();
// console.log(hrTime[0] * 1000000 + hrTime[1] / 1000);

 	topicCommentsCollection.find( queryDet , function(err,topicCommentDocs){
 		
 		
 		if(err !== null)
 		{
 			res.send({msg : err});
 		}
 		else
 		{
	 		if(topicCommentDocs.length == 0 )
	 		{
	 			res.send({msg : 'Success' , topicComment : []});
	 		}else{

	 			if(topicCommentDocs[0].comments.length == 0)
	 			{
	 				res.send({msg : 'Success' , topicComment : []});
	 			}else{
	 			maxLength = topicCommentDocs[0].comments.length;
	 			incrementer = 0;

	 			for(var i = 0 ;  i < maxLength ; i++)
	 			{
	 				playerCollection.find({playerId :  topicCommentDocs[0].comments[i].playerId } ,{fields : {_id : 0, teamIds : 0}}, function(err,playerDocs){

	 					if(err !== null)
				 		{
				 			res.send({msg : err});
				 		}else{
		 					topicCommentDocs[0].comments[incrementer].playerId = playerDocs;

		 					if(maxLength-1 == incrementer)
			 				{
			 					res.send({msg : 'Success' , topicComment : topicCommentDocs[0].comments});	
			 				}
			 				incrementer++;
		 				}
	 				});
	 				
	 			}
	 			}
	 		}
 		}
 		

 	});
});

router.get('/getTopicDetail', function(req, res) {
	var db = req.db;
	var topicId = 153 ;
	var uniqueId= 1053;
	var topic = db.get('topic');
	topic.find({topicId : topicId},{fields : { _id : 0,options : {$elemMatch : {uniqueId : uniqueId}}}},
		function(err, optionsDocs){
			res.send(optionsDocs);
		});
  
});

function topicComments(db,topicId,uniqueId)
{
	var topicCommentsCollection = db.get('topicComments');
	topicCommentsCollection.insert({topicId : topicId , uniqueId : uniqueId , comments : []});

}

function getNextVal(db,ids,callback)
{
	 var counterCollection = db.get('nextval');
	 counterCollection.findAndModify({query : {ids : ids}, update : {$inc : {seqValue : 1}} ,new : true } ,function(err,counterDocs)
	    {
	    	if(err !== null)
	    	{
	    		callback(-1);
	    	}else{
	    		callback(counterDocs.seqValue);
	    	}
	    });
}

module.exports = router;