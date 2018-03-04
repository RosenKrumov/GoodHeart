$(document).ready(async function() {
	$('main > section').hide();

	$('#addCharityButton').click(addCharity);

	function showInfo(message) {
		$('#infoBox>p').html(message);
		$('#infoBox').show();
		$('#infoBox>header').click(function () {
			$('#infoBox').hide();
		});
	}

	function showError(errorMsg) {
		$('#errorBox>p').html("Error: " + errorMsg);
		$('#errorBox').show();
		$('#errorBox>header').click(function () {
			$('#errorBox').hide();
		});
	}

	$(document).on({
		ajaxStart: function () {
			$("#loadingBox").show()
		},
		ajaxStop: function () {
			$("#loadingBox").hide()
		}
	});

	function addCharity() {
		var charityFunds = $.trim($('#funds').val());
		var representativeName = $.trim($('#representativeName').val());
		var charityName = $.trim($('#name').val());
		var description = $.trim($('#description').val());
		var contract = web3.eth.contract(contractABI).at(contractAddress);

		if ($.trim($('#description').val()) == '' || 
			$.trim($('#funds').val()) == '' ||
			$.trim($('#name').val()) == '' ||
			$.trim($('#representativeName').val()) == '') {
			return showError("Inputs cannot be left blank");
		}

		if (typeof web3 === 'undefined') {
			return showError("Please install MetaMask to access the Ethereum Web3 API from your web browser.");
		}

		// contract.submitCharity(charityName, representativeName, web3.toWei(charityFunds), function(err, res) {
		// 	if (err) {
		// 		return showError("Smart contract call failed: " + err);
		// 	}

		// 	showInfo("Charity submitted successfully!");

		// 	contract.getCharityIdByName(charityName, function(err, res) {
		// 		if (err) {
		// 			return showError("Error: " + err);
		// 		}

		// 		console.log(res);

		// 		var charityId = res[0].c[0];

		// 		$.ajax({
		// 			url: 'http://localhost:8001/addCharity',
		// 			type: 'GET',
		// 			contentType: "application/json",
		// 			data: {
		// 			    description: description,
		// 			    charityId: charityId
		// 			}
		// 		});
		// 	});
		// });

		// TODO START
		// contract.allEvents({fromBlock: 0}).get((e, res) => console.log(res))

		// contract.CharityCreated({}, {fromBlock: 0}).watch((error, result) => {
		//   if (error)
		//     console.log('Error in CharityCreated event handler: ' + error);
		//   else
		//     console.log('CharityCreated: ' + JSON.stringify(result.args));
		// });
		// TODO END

		contract.getCharityIdByName(charityName, async function(err, res) {
			if (err) {
				return showError("Error: " + err);
			}

			var charityExists = res[1];

			if (!charityExists) {
				contract.submitCharity(charityName, representativeName, web3.toWei(charityFunds), async function(err1, res1) {
					if (err1) {
						return showError("Smart contract call failed: " + err1);
					}

					await contract.getCharityIdByName(charityName, function(error, result) {
						if (error) {
							return showError("Error: " + error);
						}

						console.log(result);

						var charityId = result[0].c[0];

						$.ajax({
							url: 'http://localhost:8001/addCharity',
							type: 'GET',
							contentType: "application/json",
							data: {
							    description: description,
							    charityId: charityId
							},
							success: async function(data) {
								console.log(data);
								var jsonData = JSON.parse(data);
								showInfo(jsonData.success);
								$("#loadingBox").hide();
							},
							error: async function(data) {
								console.log(data);
								showError(data.error);
								$("#loadingBox").hide();	
							}
						});
					});
				});
			} else {
				showError("Charity with such name exists!");
			}
		});
	}
});



