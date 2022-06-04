var express = require("express");
var app = express();

var formidable = require("express-formidable");
app.use(formidable());

var mongodb = require("mongodb");
var mongoClient = mongodb.MongoClient;
var ObjectId = mongodb.ObjectId;

var http = require("http").createServer(app);
var bcrypt = require("bcryptjs");
var fileSystem = require("fs");

var jwt = require("jsonwebtoken");
var accessTokenSecret = "myAccessTokenSecret1234567890";

app.use("/public", express.static(__dirname + "/public"));
app.set("view engine", "ejs");

var socketIO = require("socket.io")(http);
var socketID = "";
var mentors = [];

var mainURL = "http://localhost:3000";

socketIO.on("connection", function (socket) {
	console.log("User connected", socket.id);
	socketID = socket.id;
});

let port = process.env.PORT;
if (port==null || port==""){
	port=3000;
}


http.listen(port, function () {
	console.log("Server started at successfully");

	mongoClient.connect("mongodb+srv://admin-chinmay:admin-chinmay@design-credit-portal.5tkewkf.mongodb.net/?retryWrites=true&w=majority", function (error, client) {
		var database = client.db("design_credit_management");
		console.log("Database connected.");

        app.get("/signupMentor", function (request, result) {
			result.render("signupMentor");
		});

		app.post("/signupMentor", function (request, result) {
			var name = request.fields.name;
			var username = request.fields.username;
			var email = request.fields.email;
			var password = request.fields.password;
			var reset_token = "";

			database.collection("mentors").findOne({
				$or: [{
					"email": email
				}, {
					"username": username
				}]
			}, function (error, user) {
				if (user == null) {
					bcrypt.hash(password, 10, function (error, hash) {
						database.collection("mentors").insertOne({
							"name": name,
							"username": username,
							"email": email,
							"password": hash,
							"reset_token": reset_token,
							"profileImage": "",
							"coverPhoto": "",
							"aboutMe": "",
							"friends": [],
							"pages": [],
							"notifications": [],
							"groups": [],
							"projects": []
						}, function (error, data) {
							result.json({
								"status": "success",
								"message": "Signed up successfully. You can login now."
							});
						});
					});
				} else {
					result.json({
						"status": "error",
						"message": "Email or username already exist."
					});
				}
			});
		});

		app.get("/signupStudent", function (request, result) {
			result.render("signupStudent");
		});

		app.post("/signupStudent", function (request, result) {
			var name = request.fields.name;
			var rollno = request.fields.rollno;
			var email = request.fields.email;
			var password = request.fields.password;
			var degree = request.fields.degree;
			var reset_token = "";

			database.collection("students").findOne({
				$or: [{
					"email": email
				}, {
					"rollno": rollno
				}]
			}, function (error, user) {
				if (user == null) {
					bcrypt.hash(password, 10, function (error, hash) {
						database.collection("students").insertOne({
							"name": name,
							"rollno": rollno,
							"email": email,
							"password": hash,
							"degree": degree,
							"reset_token": reset_token,
							"profileImage": "",
							"coverPhoto": "",
							"aboutMe": "",
							"friends": [],
							"pages": [],
							"notifications": [],
							"groups": [],
							"projects": []
						}, function (error, data) {
							result.json({
								"status": "success",
								"message": "Signed up successfully. You can login now."
							});
						});
					});
				} else {
					result.json({
						"status": "error",
						"message": "Email or rollno already exist."
					});
				}
			});
		});

        app.get("/loginMentor", function (request, result) {
			result.render("loginMentor");
		});

        app.post("/loginMentor", function (request, result) {
			var email = request.fields.email;
			var password = request.fields.password;
			database.collection("mentors").findOne({
				"email": email
			}, function (error, user) {
				if (user == null) {
					result.json({
						"status": "error",
						"message": "Email does not exist"
					});
				} else {
					bcrypt.compare(password, user.password, function (error, isVerify) {
						if (isVerify) {
							var accessToken = jwt.sign({ email: email }, accessTokenSecret);
							database.collection("mentors").findOneAndUpdate({
								"email": email
							}, {
								$set: {
									"accessToken": accessToken
								}
							}, function (error, data) {
								result.json({
									"status": "success",
									"message": "Login successfully",
									"accessToken": accessToken,
									"profileImage": user.profileImage
								});
							});
						} else {
							result.json({
								"status": "error",
								"message": "Password is not correct"
							});
						}
					});
				}
			});
		});

		app.get("/loginStudent", function (request, result) {
			result.render("loginStudent");
		});

        app.post("/loginStudent", function (request, result) {
			var email = request.fields.email;
			var password = request.fields.password;
			database.collection("students").findOne({
				"email": email
			}, function (error, user) {
				if (user == null) {
					result.json({
						"status": "error",
						"message": "Email does not exist"
					});
				} else {
					bcrypt.compare(password, user.password, function (error, isVerify) {
						if (isVerify) {
							var accessToken = jwt.sign({ email: email }, accessTokenSecret);
							database.collection("students").findOneAndUpdate({
								"email": email
							}, {
								$set: {
									"accessToken": accessToken
								}
							}, function (error, data) {
								result.json({
									"status": "success",
									"message": "Login successfully",
									"accessToken": accessToken,
									"profileImage": user.profileImage
								});
							});
						} else {
							result.json({
								"status": "error",
								"message": "Password is not correct"
							});
						}
					});
				}
			});
		});

		app.get("/logoutMentor", function (request, result) {
			result.redirect("/loginMentor");
		});

		app.get("/studentLogout", function (request, result) {
			result.redirect("/loginStudent");
		});

        app.get("/updateProfileMentor", function (request, result) {
			result.render("updateProfileMentor");
		});

		app.get("/updateProfileStudent", function (request, result) {
			result.render("updateProfileStudent");
		});

		app.get("/studentUpdateProfile", function (request, result) {
			result.render("studentUpdateProfile");
		});

        app.post("/getUserMentor", function (request, result) {
			var accessToken = request.fields.accessToken;
			database.collection("mentors").findOne({
				"accessToken": accessToken
			}, function (error, user) {
				if (user == null) {
					result.json({
						"status": "error",
						"message": "User has been logged out. Please login again."
					});
				} else {
					result.json({
						"status": "success",
						"message": "Record has been fetched.",
						"data": user
					});
				}
			});
		});

		app.post("/getUserStudent", function (request, result) {
			var accessToken = request.fields.accessToken;
			database.collection("students").findOne({
				"accessToken": accessToken
			}, function (error, user) {
				if (user == null) {
					result.json({
						"status": "error",
						"message": "User has been logged out. Please login again."
					});
				} else {
					result.json({
						"status": "success",
						"message": "Record has been fetched.",
						"data": user
					});
				}
			});
		});

        app.post("/uploadCoverPhoto", function (request, result) {
			var accessToken = request.fields.accessToken;
			var coverPhoto = "";

			database.collection("mentors").findOne({
				"accessToken": accessToken
			}, function (error, user) {
				if (user == null) {
					result.json({
						"status": "error",
						"message": "User has been logged out. Please login again."
					});
				} else {

					if (request.files.coverPhoto.size > 0 && request.files.coverPhoto.type.includes("image")) {

						if (user.coverPhoto != "") {
							fileSystem.unlink(user.coverPhoto, function (error) {
								//
							});
						}

						coverPhoto = "public/images/" + new Date().getTime() + "-" + request.files.coverPhoto.name;

						// Read the file
	                    fileSystem.readFile(request.files.coverPhoto.path, function (err, data) {
	                        if (err) throw err;
	                        console.log('File read!');

	                        // Write the file
	                        fileSystem.writeFile(coverPhoto, data, function (err) {
	                            if (err) throw err;
	                            console.log('File written!');

	                            database.collection("mentors").updateOne({
									"accessToken": accessToken
								}, {
									$set: {
										"coverPhoto": coverPhoto
									}
								}, function (error, data) {
									result.json({
										"status": "status",
										"message": "Cover photo has been updated.",
										data: mainURL + "/" + coverPhoto
									});
								});
	                        });

	                        // Delete the file
	                        fileSystem.unlink(request.files.coverPhoto.path, function (err) {
	                            if (err) throw err;
	                            console.log('File deleted!');
	                        });
	                    });
					} else {
						result.json({
							"status": "error",
							"message": "Please select valid image."
						});
					}
				}
			});
		});

		app.post("/uploadCoverPhotoStudent", function (request, result) {
			var accessToken = request.fields.accessToken;
			var coverPhoto = "";

			database.collection("students").findOne({
				"accessToken": accessToken
			}, function (error, user) {
				if (user == null) {
					result.json({
						"status": "error",
						"message": "User has been logged out. Please login again."
					});
				} else {

					if (request.files.coverPhoto.size > 0 && request.files.coverPhoto.type.includes("image")) {

						if (user.coverPhoto != "") {
							fileSystem.unlink(user.coverPhoto, function (error) {
								//
							});
						}

						coverPhoto = "public/images/" + new Date().getTime() + "-" + request.files.coverPhoto.name;

						// Read the file
	                    fileSystem.readFile(request.files.coverPhoto.path, function (err, data) {
	                        if (err) throw err;
	                        console.log('File read!');

	                        // Write the file
	                        fileSystem.writeFile(coverPhoto, data, function (err) {
	                            if (err) throw err;
	                            console.log('File written!');

	                            database.collection("students").updateOne({
									"accessToken": accessToken
								}, {
									$set: {
										"coverPhoto": coverPhoto
									}
								}, function (error, data) {
									result.json({
										"status": "status",
										"message": "Cover photo has been updated.",
										data: mainURL + "/" + coverPhoto
									});
								});
	                        });

	                        // Delete the file
	                        fileSystem.unlink(request.files.coverPhoto.path, function (err) {
	                            if (err) throw err;
	                            console.log('File deleted!');
	                        });
	                    });
					} else {
						result.json({
							"status": "error",
							"message": "Please select valid image."
						});
					}
				}
			});
		});

        app.post("/uploadProfileImage", function (request, result) {
			var accessToken = request.fields.accessToken;
			var profileImage = "";

			database.collection("mentors").findOne({
				"accessToken": accessToken
			}, function (error, user) {
				if (user == null) {
					result.json({
						"status": "error",
						"message": "User has been logged out. Please login again."
					});
				} else {

					if (request.files.profileImage.size > 0 && request.files.profileImage.type.includes("image")) {

						if (user.profileImage != "") {
							fileSystem.unlink(user.profileImage, function (error) {
								//
							});
						}

						profileImage = "public/images/" + new Date().getTime() + "-" + request.files.profileImage.name;

						// Read the file
	                    fileSystem.readFile(request.files.profileImage.path, function (err, data) {
	                        if (err) throw err;
	                        console.log('File read!');

	                        // Write the file
	                        fileSystem.writeFile(profileImage, data, function (err) {
	                            if (err) throw err;
	                            console.log('File written!');

	                            database.collection("mentors").updateOne({
									"accessToken": accessToken
								}, {
									$set: {
										"profileImage": profileImage
									}
								}, function (error, data) {
									result.json({
										"status": "status",
										"message": "Profile image has been updated.",
										data: mainURL + "/" + profileImage
									});
								});
	                        });

	                        // Delete the file
	                        fileSystem.unlink(request.files.profileImage.path, function (err) {
	                            if (err) throw err;
	                            console.log('File deleted!');
	                        });
	                    });
					} else {
						result.json({
							"status": "error",
							"message": "Please select valid image."
						});
					}
				}
			});
		});

		app.post("/uploadProfileImageStudent", function (request, result) {
			var accessToken = request.fields.accessToken;
			var profileImage = "";

			database.collection("students").findOne({
				"accessToken": accessToken
			}, function (error, user) {
				if (user == null) {
					result.json({
						"status": "error",
						"message": "User has been logged out. Please login again."
					});
				} else {

					if (request.files.profileImage.size > 0 && request.files.profileImage.type.includes("image")) {

						if (user.profileImage != "") {
							fileSystem.unlink(user.profileImage, function (error) {
								//
							});
						}

						profileImage = "public/images/" + new Date().getTime() + "-" + request.files.profileImage.name;

						// Read the file
	                    fileSystem.readFile(request.files.profileImage.path, function (err, data) {
	                        if (err) throw err;
	                        console.log('File read!');

	                        // Write the file
	                        fileSystem.writeFile(profileImage, data, function (err) {
	                            if (err) throw err;
	                            console.log('File written!');

	                            database.collection("students").updateOne({
									"accessToken": accessToken
								}, {
									$set: {
										"profileImage": profileImage
									}
								}, function (error, data) {
									result.json({
										"status": "status",
										"message": "Profile image has been updated.",
										data: mainURL + "/" + profileImage
									});
								});
	                        });

	                        // Delete the file
	                        fileSystem.unlink(request.files.profileImage.path, function (err) {
	                            if (err) throw err;
	                            console.log('File deleted!');
	                        });
	                    });
					} else {
						result.json({
							"status": "error",
							"message": "Please select valid image."
						});
					}
				}
			});
		});

        app.post("/updateProfileMentor", function (request, result) {
			var accessToken = request.fields.accessToken;
			var name = request.fields.name;
			var aboutMe = request.fields.aboutMe;

			database.collection("mentors").findOne({
				"accessToken": accessToken
			}, function (error, user) {
				if (user == null) {
					result.json({
						"status": "error",
						"message": "User has been logged out. Please login again."
					});
				} else {
					database.collection("mentors").updateOne({
						"accessToken": accessToken
					}, {
						$set: {
							"name": name,
							"aboutMe": aboutMe
						}
					}, function (error, data) {
						result.json({
							"status": "status",
							"message": "Profile has been updated."
						});
					});
				}
			});
		});

		app.post("/studentUpdateProfile", function (request, result) {
			var accessToken = request.fields.accessToken;
			var name = request.fields.name;
			var aboutMe = request.fields.aboutMe;

			database.collection("students").findOne({
				"accessToken": accessToken
			}, function (error, user) {
				if (user == null) {
					result.json({
						"status": "error",
						"message": "User has been logged out. Please login again."
					});
				} else {
					database.collection("students").updateOne({
						"accessToken": accessToken
					}, {
						$set: {
							"name": name,
							"aboutMe": aboutMe
						}
					}, function (error, data) {
						result.json({
							"status": "status",
							"message": "Profile has been updated."
						});
					});
				}
			});
		});

		app.get("/my_projects", function (request, result) {
			result.render("my_projects");
		});

		app.post("/getCompletedApplicationsfeed", function (request, result) {
			var accessToken = request.fields.accessToken;
			database.collection("mentors").findOne({
				"accessToken": accessToken
			}, function (error, user) {
				if (user == null) {
					result.json({
						"status": "error",
						"message": "User has been logged out. Please login again."
					});
				} else {

					var ids = [];
					ids.push(user._id);

					database.collection("projects")
					.find({
						"user._id": {
							$in: ids
						}
					})
					.sort({
						"createdAt": -1
					})
					.toArray(function (error, data) {

						result.json({
							"status": "success",
							"message": "Record has been fetched",
							"data": data
						});
					});
				}
			});
		});

		app.post("/getPendingApplicationsfeed", function (request, result) {
			var accessToken = request.fields.accessToken;
			database.collection("mentors").findOne({
				"accessToken": accessToken
			}, function (error, user) {
				if (user == null) {
					result.json({
						"status": "error",
						"message": "User has been logged out. Please login again."
					});
				} else {

					var ids = [];
					ids.push(user._id);

					database.collection("projects")
					.find({
						"user._id": {
							$in: ids
						}
					})
					.sort({
						"createdAt": -1
					})
					.toArray(function (error, data) {

						result.json({
							"status": "success",
							"message": "Record has been fetched",
							"data": data
						});
					});
				}
			});
		});

		app.get("/", function (request, result) {
			result.render("entry");
		});

        app.get("/allProjectsMentor", function (request, result) {
			result.render("allProjectsMentor");
		});
		
		app.get("/allProjectsStudent", function (request, result) {
			result.render("allProjectsStudent");
		});

		app.get("/allottedProjects", function (request, result) {
			result.render("allottedProjects");
		});

		app.post("/getallottedprojectsfeed", function (request, result) {
			var accessToken = request.fields.accessToken;
			database.collection("students").findOne({
				"accessToken": accessToken
			}, function (error, user) {
				if (user == null) {
					result.json({
						"status": "error",
						"message": "User has been logged out. Please login again."
					});
				} else {
					var ids = [];
					ids.push(user._id);

					database.collection("projects")
					.find()
					.sort({
						"createdAt": -1
					})
					.toArray(function (error, data) {

						result.json({
							"status": "success",
							"message": "Record has been fetched",
							"data": data
						});
					});
				}
			});
		});		

		app.get("/myProposals", function (request, result) {
			result.render("myProposals");
		});

		app.post("/getmyproposalsfeed", function (request, result) {
			var accessToken = request.fields.accessToken;
			database.collection("students").findOne({
				"accessToken": accessToken
			}, function (error, user) {
				if (user == null) {
					result.json({
						"status": "error",
						"message": "User has been logged out. Please login again."
					});
				} else {

					var ids = [];
					ids.push(user._id);

					database.collection("projects")
					.find()
					.sort({
						"createdAt": -1
					})
					.toArray(function (error, data) {

						result.json({
							"status": "success",
							"message": "Record has been fetched",
							"data": data
						});
					});
				}
			});
		});

		app.get("/student_proposals", function (request, result) {
			result.render("student_proposals");
		});

		app.post("/getstudentproposalsfeed", function (request, result) {
			var accessToken = request.fields.accessToken;
			database.collection("mentors").findOne({
				"accessToken": accessToken
			}, function (error, user) {
				if (user == null) {
					result.json({
						"status": "error",
						"message": "User has been logged out. Please login again."
					});
				} else {

					var ids = [];
					ids.push(user._id);

					database.collection("projects")
					.find()
					.sort({
						"createdAt": -1
					})
					.toArray(function (error, data) {

						result.json({
							"status": "success",
							"message": "Record has been fetched",
							"data": data
						});
					});
				}
			});
		});

		app.post("/acceptandmentor", function(request, result){
			var accessToken = request.fields.accessToken;
			var mentee_id = request.fields.mentee_id;
			var project_id = request.fields.project_id;
			var mentor_id = request.fields.mentor_id;
			var title = request.fields.title;
			var description = request.fields.description;
			var skills = request.fields.skills;
			var createdAt = request.fields.createdAt;
			var menteeName = request.fields.menteeName;
			var menteeImage = request.fields.menteeImage;

			database.collection("mentors").findOne({
				"accessToken": accessToken
			}, function (error, user) {
				if (user == null) {
					result.json({
						"status": "error",
						"message": "User has been logged out. Please login again."
					});
				} else {
					var me=user;
					database.collection("projects").findOne({
						"_id": ObjectId(project_id)
					},function(error, user){
						if (user == null) {
							result.json({
								"status": "error",
								"message": "Project does not exist."
							});
						}else{
							database.collection("projects").updateOne({
								"_id": ObjectId(project_id)
							}, {
								$push: {
									"mentees": {
										"_id": ObjectId(mentee_id),
										"name": menteeName,
										"profileImage": menteeImage,
										"status": "accepted",
										"sentByMe": false,
										"inbox": []
									}
								}, $set:{
									"user": {
										"_id": ObjectId(me._id),
										"name": me.name,
										"username": me.username,
										"profileImage": me.profileImage,
										"status": "mentor"
									}
								}
							}, function (error, data) {
								database.collection("mentors").updateOne({
									"accessToken": accessToken
								}, {
									$push: {
										"projects": {
											"_id": ObjectId(project_id),
											"title": title,
											"description": description,
											"skills": skills,
											"type": "post",
											"createdAt": createdAt,
											"status": "pending",
											"mentees": {
												"_id": ObjectId(mentee_id),
												"name": menteeName,
												"profileImage": menteeImage,
												"status": "accepted",
												"sentByMe": false,
												"inbox": []
											},
											"likers": [],
											"comments": [],
											"shares": [],
											"grade" : "Z"
										}
									}
								}, function (error, data) {
									result.json({
										"status": "success",
										"message": "You have been marked as the mentor for the object."
									});
								});
							});
						}
					});
				}
			});
			// database.collection("students").findOne({
			// 	"accessToken": accessToken
			// }, function (error, user) {
			// 	if (user == null) {
			// 		result.json({
			// 			"status": "error",
			// 			"message": "User has been logged out. Please login again."
			// 		});

			// 	} else {
			// 		var me=user;
			// 		database.collection("projects").findOne({
			// 			"_id": ObjectId(project_id)
			// 		},function(error, user){
			// 			if (user == null) {
			// 				result.json({
			// 					"status": "error",
			// 					"message": "Project does not exist."
			// 				});		

			// 			}else{
			// 				database.collection("projects").updateOne({
			// 					"_id": ObjectId(project_id)
			// 				}, {
			// 					$push: {
			// 						"mentees": {
			// 							"_id": me._id,
			// 							"name": me.name,
			// 							"profileImage": me.profileImage,
			// 							"status": "pending",
			// 							"sentByMe": false,
			// 							"inbox": []
			// 						}
			// 					}		
			// 				}, function (error, data){
			// 					result.json({
			// 						"status": "success",
			// 						"message": "Mentee request has been sent."
			// 					});
			// 				});
							
			// 			}
			// 		})
			// 	}
			// });
		});	

		app.post("/getprojectsfeed", function (request, result) {
			var accessToken = request.fields.accessToken;
			database.collection("mentors").findOne({
				"accessToken": accessToken
			}, function (error, user) {
				if (user == null) {
					result.json({
						"status": "error",
						"message": "User has been logged out. Please login again."
					});
				} else {
					var ids = [];
					ids.push(user._id);
					// console.log("10");
					database.collection("projects")
					.find()
					.sort({
						// "createdAt": -1
						"title": 1
					})
					.toArray(function (error, data) {

						result.json({
							"status": "success",
							"message": "Record has been fetched",
							"data": data
						});
					});
				}
			});
		});

		app.post("/getprojectsfeedStudent", function (request, result) {
			var accessToken = request.fields.accessToken;
			database.collection("students").findOne({
				"accessToken": accessToken
			}, function (error, user) {
				if (user == null) {
					result.json({
						"status": "error",
						"message": "User has been logged out. Please login again."
					});
				} else {

					var ids = [];
					ids.push(user._id);

					database.collection("projects")
					.find()
					.sort({
						"title": 1
					})
					.toArray(function (error, data) {

						result.json({
							"status": "success",
							"message": "Record has been fetched",
							"data": data
						});
					});
				}
			});
		});

		app.get("/addNewProjectMentor", function (request, result) {
			result.render("addNewProjectMentor");
		});

		app.get("/addNewProjectStudent", function (request, result) {
			result.render("addNewProjectStudent");
		});

        app.post("/addNewProjectMentor", function (request, result) {

			var accessToken = request.fields.accessToken;
			var title = request.fields.title;
			var description = request.fields.description;
			var skills = request.fields.skills;
			var type = request.fields.type;
			var createdAt = new Date().getTime();
			var _id = request.fields._id;

			database.collection("mentors").findOne({
				"accessToken": accessToken
			}, function (error, user) {
				if (user == null) {
					result.json({
						"status": "error",
						"message": "User has been logged out. Please login again."
					});
				} else {
					database.collection("projects").insertOne({
						"title": title,
						"description": description,
						"skills": skills,
						"type": type,
						"createdAt": createdAt,
						"status": "pending",
						"mentees": [],
						"likers": [],
						"comments": [],
						"shares": [],
						"grade" : "Z",
						"user": {
							"_id": user._id,
							"name": user.name,
							"username": user.username,
							"profileImage": user.profileImage,
							"status": "mentor"
						},
						"proposed_by": {
							"_id": user._id,
							"name": user.name,
							"username": user.username,
							"profileImage": user.profileImage,
							"status": "mentor"
						}
					}, function (error, data) {
						database.collection("mentors").updateOne({
							"accessToken": accessToken
						}, {
							$push: {
								"projects": {
									"_id": data.insertedId,
									"title": title,
									"description": description,
									"skills": skills,
									"type": type,
									"createdAt": createdAt,
									"status": "pending",
									"mentees": [],
									"likers": [],
									"comments": [],
									"shares": [],
									"grade" : "Z"
								}
							}
						}, function (error, data) {
							result.json({
								"status": "success",
								"message": "Project has been uploaded."
							});
						});
					});
				}
			});
		});

		app.post("/addNewProjectStudent", function (request, result) {

			var accessToken = request.fields.accessToken;
			var title = request.fields.title;
			var description = request.fields.description;
			var skills = request.fields.skills;
			var type = request.fields.type;
			var createdAt = new Date().getTime();
			var _id = request.fields._id;

			database.collection("students").findOne({
				"accessToken": accessToken
			}, function (error, user) {
				if (user == null) {
					result.json({
						"status": "error",
						"message": "User has been logged out. Please login again."
					});
				} else {
					database.collection("projects").insertOne({
						"title": title,
						"description": description,
						"skills": skills,
						"type": type,
						"createdAt": createdAt,
						"status": "pending",
						"mentees": [],
						"likers": [],
						"comments": [],
						"shares": [],
						"grade" : "Z",
						"user": {
							"_id": user._id,
							"name": user.name,
							"username": user.username,
							"profileImage": user.profileImage,
							"status": "student"
						},
						"proposed_by": {
							"_id": user._id,
							"name": user.name,
							"username": user.username,
							"profileImage": user.profileImage,
							"status": "student"
						}
					}, function (error, data) {
						database.collection("students").updateOne({
							"accessToken": accessToken
						}, {
							$push: {
								"projects": {
									"_id": data.insertedId,
									"title": title,
									"description": description,
									"skills": skills,
									"type": type,
									"createdAt": createdAt,
									"status": "pending",
									"mentees": [],
									"likers": [],
									"comments": [],
									"shares": [],
									"grade" : "Z"
								}
							}
						}, function (error, data) {
							result.json({
								"status": "success",
								"message": "Project has been uploaded."
							});
						});
					});
				}
			});
		});

		app.post("/toggleLikeproject", function (request, result) {

			var accessToken = request.fields.accessToken;
			var _id = request.fields._id;

			database.collection("mentors").findOne({
				"accessToken": accessToken
			}, function (error, user) {
				if (user == null) {
					result.json({
						"status": "error",
						"message": "User has been logged out. Please login again."
					});
				} else {

					database.collection("projects").findOne({
						"_id": ObjectId(_id)
					}, function (error, project) {
						if (project == null) {
							result.json({
								"status": "error",
								"message": "Project does not exist."
							});
						} else {

							var isLiked = false;
							for (var a = 0; a < project.likers.length; a++) {
								var liker = project.likers[a];

								if (liker._id.toString() == user._id.toString()) {
									isLiked = true;
									break;
								}
							}

							if (isLiked) {
								database.collection("projects").updateOne({
									"_id": ObjectId(_id)
								}, {
									$pull: {
										"likers": {
											"_id": user._id,
										}
									}
								}, function (error, data) {

									database.collection("mentors").updateOne({
										$and: [{
											"_id": project.user._id
										}, {
											"projects._id": project._id
										}]
									}, {
										$pull: {
											"projects.$[].likers": {
												"_id": user._id,
											}
										}
									});

									result.json({
										"status": "unliked",
										"message": "Project has been unliked."
									});
								});
							} else {

								database.collection("mentors").updateOne({
									"_id": project.user._id
								}, {
									$push: {
										"notifications": {
											"_id": ObjectId(),
											"type": "photo_liked",
											"content": user.name + " has shown interest in your project.",
											"profileImage": user.profileImage,
											"isRead": false,
											"project": {
												"_id": project._id
											},
											"createdAt": new Date().getTime()
										}
									}
								});

								database.collection("projects").updateOne({
									"_id": ObjectId(_id)
								}, {
									$push: {
										"likers": {
											"_id": user._id,
											"name": user.name,
											"profileImage": user.profileImage
										}
									}
								}, function (error, data) {

									database.collection("mentors").updateOne({
										$and: [{
											"_id": project.user._id
										}, {
											"projects._id": project._id
										}]
									}, {
										$push: {
											"projects.$[].likers": {
												"_id": user._id,
												"name": user.name,
												"profileImage": user.profileImage
											}
										}
									});

									result.json({
										"status": "success",
										"message": "Project has been liked."
									});
								});
							}

						}
					});

				}
			});
		});

		app.post("/postComment", function (request, result) {

			var accessToken = request.fields.accessToken;
			var _id = request.fields._id;
			var comment = request.fields.comment;
			var createdAt = new Date().getTime();

			database.collection("mentors").findOne({
				"accessToken": accessToken
			}, function (error, user) {
				if (user == null) {
					result.json({
						"status": "error",
						"message": "User has been logged out. Please login again."
					});
				} else {

					database.collection("projects").findOne({
						"_id": ObjectId(_id)
					}, function (error, post) {
						if (post == null) {
							result.json({
								"status": "error",
								"message": "Project does not exist."
							});
						} else {

							var commentId = ObjectId();

							database.collection("projects").updateOne({
								"_id": ObjectId(_id)
							}, {
								$push: {
									"comments": {
										"_id": commentId,
										"user": {
											"_id": user._id,
											"name": user.name,
											"profileImage": user.profileImage,
										},
										"comment": comment,
										"createdAt": createdAt,
										"replies": []
									}
								}
							}, function (error, data) {

								if (user._id.toString() != post.user._id.toString()) {
									database.collection("mentors").updateOne({
										"_id": post.user._id
									}, {
										$push: {
											"notifications": {
												"_id": ObjectId(),
												"type": "new_comment",
												"content": user.name + " commented on your post.",
												"profileImage": user.profileImage,
												"post": {
													"_id": post._id
												},
												"isRead": false,
												"createdAt": new Date().getTime()
											}
										}
									});
								}

								database.collection("mentors").updateOne({
									$and: [{
										"_id": post.user._id
									}, {
										"posts._id": post._id
									}]
								}, {
									$push: {
										"posts.$[].comments": {
											"_id": commentId,
											"user": {
												"_id": user._id,
												"name": user.name,
												"profileImage": user.profileImage,
											},
											"comment": comment,
											"createdAt": createdAt,
											"replies": []
										}
									}
								});

								result.json({
									"status": "success",
									"message": "Comment has been posted."
								});
							});

						}
					});
				}
			});
		});

		app.post("/postCommentStudent", function (request, result) {

			var accessToken = request.fields.accessToken;
			var _id = request.fields._id;
			var comment = request.fields.comment;
			var createdAt = new Date().getTime();

			database.collection("students").findOne({
				"accessToken": accessToken
			}, function (error, user) {
				if (user == null) {
					result.json({
						"status": "error",
						"message": "User has been logged out. Please login again."
					});
				} else {

					database.collection("projects").findOne({
						"_id": ObjectId(_id)
					}, function (error, post) {
						if (post == null) {
							result.json({
								"status": "error",
								"message": "Project does not exist."
							});
						} else {

							var commentId = ObjectId();

							database.collection("projects").updateOne({
								"_id": ObjectId(_id)
							}, {
								$push: {
									"comments": {
										"_id": commentId,
										"user": {
											"_id": user._id,
											"name": user.name,
											"profileImage": user.profileImage,
										},
										"comment": comment,
										"createdAt": createdAt,
										"replies": []
									}
								}
							}, function (error, data) {

								if (user._id.toString() != post.user._id.toString()) {
									database.collection("students").updateOne({
										"_id": post.user._id
									}, {
										$push: {
											"notifications": {
												"_id": ObjectId(),
												"type": "new_comment",
												"content": user.name + " commented on your post.",
												"profileImage": user.profileImage,
												"post": {
													"_id": post._id
												},
												"isRead": false,
												"createdAt": new Date().getTime()
											}
										}
									});
								}

								database.collection("students").updateOne({
									$and: [{
										"_id": post.user._id
									}, {
										"posts._id": post._id
									}]
								}, {
									$push: {
										"posts.$[].comments": {
											"_id": commentId,
											"user": {
												"_id": user._id,
												"name": user.name,
												"profileImage": user.profileImage,
											},
											"comment": comment,
											"createdAt": createdAt,
											"replies": []
										}
									}
								});

								result.json({
									"status": "success",
									"message": "Comment has been posted."
								});
							});

						}
					});
				}
			});
		});

		app.post("/postReply", function (request, result) {

			var accessToken = request.fields.accessToken;
			var postId = request.fields.postId;
			var commentId = request.fields.commentId;
			var reply = request.fields.reply;
			var createdAt = new Date().getTime();

			database.collection("mentors").findOne({
				"accessToken": accessToken
			}, function (error, user) {
				if (user == null) {
					result.json({
						"status": "error",
						"message": "User has been logged out. Please login again."
					});
				} else {

					database.collection("projects").findOne({
						"_id": ObjectId(postId)
					}, function (error, post) {
						if (post == null) {
							result.json({
								"status": "error",
								"message": "Project does not exist."
							});
						} else {

							var replyId = ObjectId();

							database.collection("projects").updateOne({
								$and: [{
									"_id": ObjectId(postId)
								}, {
									"comments._id": ObjectId(commentId)
								}]
							}, {
								$push: {
									"comments.$.replies": {
										"_id": replyId,
										"user": {
											"_id": user._id,
											"name": user.name,
											"profileImage": user.profileImage,
										},
										"reply": reply,
										"createdAt": createdAt
									}
								}
							}, function (error, data) {

								database.collection("mentors").updateOne({
									$and: [{
										"_id": post.user._id
									}, {
										"projects._id": post._id
									}, {
										"projects.comments._id": ObjectId(commentId)
									}]
								}, {
									$push: {
										"projects.$[].comments.$[].replies": {
											"_id": replyId,
											"user": {
												"_id": user._id,
												"name": user.name,
												"profileImage": user.profileImage,
											},
											"reply": reply,
											"createdAt": createdAt
										}
									}
								});

								result.json({
									"status": "success",
									"message": "Reply has been posted."
								});
							});

						}
					});
				}
			});
		});

		app.post("/postReplyStudent", function (request, result) {

			var accessToken = request.fields.accessToken;
			var postId = request.fields.postId;
			var commentId = request.fields.commentId;
			var reply = request.fields.reply;
			var createdAt = new Date().getTime();

			database.collection("students").findOne({
				"accessToken": accessToken
			}, function (error, user) {
				if (user == null) {
					result.json({
						"status": "error",
						"message": "User has been logged out. Please login again."
					});
				} else {

					database.collection("projects").findOne({
						"_id": ObjectId(postId)
					}, function (error, post) {
						if (post == null) {
							result.json({
								"status": "error",
								"message": "Project does not exist."
							});
						} else {

							var replyId = ObjectId();

							database.collection("projects").updateOne({
								$and: [{
									"_id": ObjectId(postId)
								}, {
									"comments._id": ObjectId(commentId)
								}]
							}, {
								$push: {
									"comments.$.replies": {
										"_id": replyId,
										"user": {
											"_id": user._id,
											"name": user.name,
											"profileImage": user.profileImage,
										},
										"reply": reply,
										"createdAt": createdAt
									}
								}
							}, function (error, data) {

								database.collection("students").updateOne({
									$and: [{
										"_id": post.user._id
									}, {
										"projects._id": post._id
									}, {
										"projects.comments._id": ObjectId(commentId)
									}]
								}, {
									$push: {
										"projects.$[].comments.$[].replies": {
											"_id": replyId,
											"user": {
												"_id": user._id,
												"name": user.name,
												"profileImage": user.profileImage,
											},
											"reply": reply,
											"createdAt": createdAt
										}
									}
								});

								result.json({
									"status": "success",
									"message": "Reply has been posted."
								});
							});

						}
					});
				}
			});
		});

		app.post("/addMenteeRequest", function(request, result){
			var accessToken = request.fields.accessToken;
			var mentee_id = request.fields.mentee_id;
			var project_id = request.fields.project_id;
			var mentor_id = request.fields.mentor_id;

			database.collection("students").findOne({
				"accessToken": accessToken
			}, function (error, user) {
				if (user == null) {
					result.json({
						"status": "error",
						"message": "User has been logged out. Please login again."
					});

				} else {
					var me=user;
					database.collection("projects").findOne({
						"_id": ObjectId(project_id)
					},function(error, user){
						if (user == null) {
							result.json({
								"status": "error",
								"message": "Project does not exist."
							});		

						}else{
							database.collection("projects").updateOne({
								"_id": ObjectId(project_id)
							}, {
								$push: {
									"mentees": {
										"_id": me._id,
										"name": me.name,
										"profileImage": me.profileImage,
										"status": "pending",
										"sentByMe": false,
										"inbox": []
									}
								}		
							}, function (error, data){
								result.json({
									"status": "success",
									"message": "Mentee request has been sent."
								});
							});
							
						}
					})
				}
			});

		});	

		app.post("/markAsComplete", function(request, result){
			var accessToken = request.fields.accessToken;
			var project_id = request.fields.project_id;
			var mentor_id = request.fields.mentor_id;
			database.collection("mentors").findOne({
				"accessToken": accessToken
			}, function (error, user) {
				if (user == null) {
					result.json({
						"status": "error",
						"message": "User has been logged out. Please login again."
					});
				} else {
					var me=user;
					database.collection("projects").findOne({
						"_id": ObjectId(project_id)
					},function(error, user){
						if (user == null) {
							result.json({
								"status": "error",
								"message": "Project does not exist."
							});
						}else{
							database.collection("projects").updateOne({
								"_id": ObjectId(project_id)
							}, {
								$set: {
									"status": "accepted"
								}
							}, function (error, data){
								result.json({
									"status": "success",
									"message": "Project has been marked as complete."
								});
							});
						}
					})
				}
			});

		});

		app.post("/opentoall", function(request, result){
			var accessToken = request.fields.accessToken;
			var project_id = request.fields.project_id;
			var mentor_id = request.fields.mentor_id;
			database.collection("mentors").findOne({
				"accessToken": accessToken
			}, function (error, user) {
				if (user == null) {
					result.json({
						"status": "error",
						"message": "User has been logged out. Please login again."
					});
				} else {
					var me=user;
					database.collection("projects").findOne({
						"_id": ObjectId(project_id)
					},function(error, user){
						if (user == null) {
							result.json({
								"status": "error",
								"message": "Project does not exist."
							});
						}else{
							database.collection("projects").updateOne({
								"_id": ObjectId(project_id)
							}, {
								$set: {
									"status": "pending"
								}
							}, function (error, data){
								result.json({
									"status": "success",
									"message": "Project has been marked as open to all."
								});
							});
						}
					})
				}
			});

		});

		app.post("/acceptMentee", function(request, result){
			var accessToken = request.fields.accessToken;
			var project_id = request.fields.project_id;
			var mentor_id = request.fields.mentor_id;
			var mentee_id = request.fields.mentee_id;

			database.collection("mentors").findOne({
				"accessToken": accessToken
			}, function (error, user) {
				if (user == null) {
					result.json({
						"status": "error",
						"message": "User has been logged out. Please login again."
					});
				} else {
					var me=user;
					database.collection("projects").findOne({
						"_id": ObjectId(project_id)
					},function(error, user){
					if (user == null) {
						result.json({
						"status": "error",
						"message": "Project does not exist."
					});
				}else{
					database.collection("projects").updateOne({
					"_id": ObjectId(project_id),
					"mentees._id": ObjectId(mentee_id)
				}, {
					$set:{
						"mentees.$.status":"accepted"
					}, function (error, data){
						result.json({
						"status": "success",
						"message": "Mentee request has been accepted."
						});
							}
						});
					}
				});
			}
			});
		});

		app.post("/removeMentee", function(request, result){
			var accessToken = request.fields.accessToken;
			var project_id = request.fields.project_id;
			var mentor_id = request.fields.mentor_id;
			var mentee_id = request.fields.mentee_id;

			database.collection("mentors").findOne({
				"accessToken": accessToken
			}, function (error, user) {
				if (user == null) {
					result.json({
						"status": "error",
						"message": "User has been logged out. Please login again."
					});
				} else {
					var me=user;
					database.collection("projects").findOne({
						"_id": ObjectId(project_id)
					},function(error, user){
					if (user == null) {
						result.json({
						"status": "error",
						"message": "Project does not exist."
					});
				}else{
					database.collection("projects").updateOne({
					"_id": ObjectId(project_id),
					"mentees._id": ObjectId(mentee_id)
				}, {
					$set:{
						"mentees.$.status":"removed"
					}, function (error, data){
						result.json({
						"status": "success",
						"message": "Mentee request has been accepted."
						});
							}
						});
					}
				});
			}
			});
		});

		app.get("/grading", function (request, result) {
			result.render("grading");
		});

		app.post("/getGrades", function (request, result) {
			var accessToken = request.fields.accessToken;
			database.collection("mentors").findOne({
				"accessToken": accessToken
			}, function (error, user) {
				if (user == null) {
					result.json({
						"status": "error",
						"message": "User has been logged out. Please login again."
					});
				} else {

					var ids = [];
					ids.push(user._id);

					database.collection("projects")
					.find({
						"user._id": {
							$in: ids
						}

				})
					.sort({
						"createdAt": -1
					})
					.toArray(function (error, data) {

						result.json({
							"status": "success",
							"message": "Record has been fetched",
							"data": data
						});
					});
				}
			});
		});

		app.post("/updateGradeToS", function(request, result){
			var accessToken = request.fields.accessToken;
			var project_id = request.fields.project_id;
			var mentor_id = request.fields.mentor_id;

			database.collection("mentors").findOne({
				"accessToken": accessToken
			}, function (error, user) {
				if (user == null) {
					result.json({
						"status": "error",
						"message": "User has been logged out. Please login again."
					});
				} else {
					var me=user;
					database.collection("projects").findOne({
						"_id": ObjectId(project_id)
					},function(error, user){
						if (user == null) {
							result.json({
							"status": "error",
							"message": "Project does not exist."
						});
					}else{
						database.collection("projects").updateOne({
						"_id": ObjectId(project_id)
					}, {
							$set:{
								"grade":"S"
							}, function (error, data){
								result.json({
									"status": "success",
									"message": "Grade has been updated."
								});
							}
						});
						}
					});
				}
			});
		});

		app.post("/updateGradeToU", function(request, result){
			var accessToken = request.fields.accessToken;
			var project_id = request.fields.project_id;
			var mentor_id = request.fields.mentor_id;

			database.collection("mentors").findOne({
				"accessToken": accessToken
			}, function (error, user) {
				if (user == null) {
					result.json({
						"status": "error",
						"message": "User has been logged out. Please login again."
					});
				} else {
					var me=user;
					database.collection("projects").findOne({
						"_id": ObjectId(project_id)
					},function(error, user){
						if (user == null) {
							result.json({
							"status": "error",
							"message": "Project does not exist."
						});
					}else{
						database.collection("projects").updateOne({
						"_id": ObjectId(project_id)
					}, {
							$set:{
								"grade":"U"
							}, function (error, data){
								result.json({
									"status": "success",
									"message": "Grade has been updated."
								});
							}
						});
						}
					});
				}
			});
		});

		app.post("/updateGradeToX", function(request, result){
			var accessToken = request.fields.accessToken;
			var project_id = request.fields.project_id;
			var mentor_id = request.fields.mentor_id;

			database.collection("mentors").findOne({
				"accessToken": accessToken
			}, function (error, user) {
				if (user == null) {
					result.json({
						"status": "error",
						"message": "User has been logged out. Please login again."
					});
				} else {
					var me=user;
					database.collection("projects").findOne({
						"_id": ObjectId(project_id)
					},function(error, user){
						if (user == null) {
							result.json({
							"status": "error",
							"message": "Project does not exist."
						});
					}else{
						database.collection("projects").updateOne({
						"_id": ObjectId(project_id)
					}, {
							$set:{
								"grade":"X"
							}, function (error, data){
								result.json({
									"status": "success",
									"message": "Grade has been updated."
								});
							}
						});
						}
					});
				}
			});
		});
	});
});