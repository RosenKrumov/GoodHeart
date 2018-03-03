$(document).ready(function() {
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
		if ($.trim($('#description').val()) == '' || 
			$.trim($('#funds').val()) == '' ||
			$.trim($('#name').val()) == '' ||
			$.trim($('#representativeName').val()) == '') {
			return showError("Inputs cannot be left blank");
		}

		if (typeof web3 === 'undefined') {
			return showError("Please install MetaMask to access the Ethereum Web3 API from your web browser.");
		}

		var charityFunds = $('#funds').val();
		var representativeName = $('#representativeName').val();
		var charityName = $('#name').val();
		var description = $('#description').val();
		var contract = web3.eth.contract(contractABI).at(contractAddress);

		// contract.allEvents({fromBlock: 0}).get((e, res) => console.log(res))

		// contract.CharityCreated({}, {fromBlock: 0}).watch((error, result) => {
		//   if (error)
		//     console.log('Error in CharityCreated event handler: ' + error);
		//   else
		//     console.log('CharityCreated: ' + JSON.stringify(result.args));
		// });

		contract.submitCharity(charityName, representativeName, charityFunds, function(err, res) {
			if (err) {
				return showError("Smart contract call failed: " + err);
			}

			showInfo("Charity submitted successfully!");

			contract.getCharityIdByName(charityName, function(err, res) {
				if (err) {
					return showError("Error: " + err);
				}

				var charityId = res[0].c[0];

				$.ajax({
					url: 'http://localhost:8001/addCharity',
					type: 'GET',
					contentType: "application/json",
					data: {
					    description: description,
					    charityId: charityId
					}
				});
			});
		});
	}
});



