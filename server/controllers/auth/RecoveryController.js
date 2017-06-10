'use strict';

var connectionErrors = require('../../utilities/ConnectionErrors'),
	customErrors = require('../../utilities/CustomErrors'),
	recoveryUtils = require('./utils/RecoveryUtils'),
	async = require('async');
	
module.exports = function (app, route, dbConnection) {

	/**
	 * test api to check if URL for API's are working
	 */
	app.get('/recovery/init', function (req, resp) {
		resp.send('<h1 style="color:green">Node hosted sucessfully</h1><p>you can now jump to API.</p>')
	});

	/**
	 * @UserEmail
	 * @UserName
	 * @DateOfBirth
	 */
	app.post('/recovery/recoverPassword', function (req, resp) {
		dbConnection.getConnection(function (err, connection) {
			console.log('::::::::::::::::::in mysql pool connection::::::::::::::::::');
			if (!err) {
				var reqData = req.body;
				dbConnection.query('SELECT * from auth WHERE UserEmail=? or UserName=?',
					[reqData.UserEmail, reqData.UserName],
					function (err, authDetails, fields) {
						if (!err) {
							if (authDetails.length > 0) {
								console.log(':::::::::::::Got recovery auth:::::::::::::');
								// send mail with defined transport object
								recoveryUtils.confirmUserForEmail(dbConnection, authDetails[0].UserEmail, authDetails[0].CustomerId, resp, connection);
							} else {
								customErrors.noDataFound(resp, connection)
							}
						} else {
							//connection released                
							connectionErrors.queryError(err, connection);
						}
					}
				);

			} else {
				connectionErrors.connectionError(err, connection);
			}
		});
	});

	/**
	 * Remove temp password
	 * @UserEmail
	 * @UserName
	 */
	app.post('/recovery/removeTempPassword', function (req, resp) {
		dbConnection.getConnection(function (err, connection) {
			console.log('::::::::::::::::::in mysql pool connection::::::::::::::::::');
			if (!err) {
				var reqData = req.body;
				dbConnection.query('SELECT * from auth WHERE UserEmail=? or UserName=?',
					[reqData.UserEmail, reqData.UserName],
					function (err, authDetails, fields) {
						if (!err) {
							if (authDetails.length > 0) {
								var customerId = authDetails[0].CustomerId;
								var secondaryPassword = 'Vikas'
								console.log(':::::::::::::Got recovery auth:::::::::::::');
								dbConnection.query('UPDATE auth SET TempPassword = ? WHERE CustomerId = ?',
									[null, customerId],
									function (err, rows, fields) {
										if (!err) {
											console.log(':::::::::::::Temp Password Removed:::::::::::::');
											console.log(rows);
											resp.send('Temp deleted')

										} else {
											//connection released                
											connectionErrors.queryError(err, connection);
										}
									}
								);
							} else {
								customErrors.noDataFound(resp, connection)
							}
						} else {
							//connection released                
							connectionErrors.queryError(err, connection);
						}
					}
				);

			} else {
				connectionErrors.connectionError(err, connection);
			}
		});
	});

    /**
     * Send message
     */
	app.get('/recovery/sendSMS', function (req, resp) {
		console.log('in app get')
		recoveryUtils.sendSms(resp);
	});


    /**
     * Backup API if API doesn't exist at all
     */
	app.get('/recovery/:id', function (req, res) {
		res.send('respond with a home data with id - ' + req.params.id);
	});

	/*
     **Return middleware.
     */
	return function (req, res, next) {
		next();
	};
}
