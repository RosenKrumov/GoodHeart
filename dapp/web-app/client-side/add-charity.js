var entityMap = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
  '/': '&#x2F;',
  '`': '&#x60;',
  '=': '&#x3D;'
};

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

	//Moustache.js
	function escapeHtml (string) {
		return String(string).replace(/[&<>"'`=\/]/g, function (s) {
			return entityMap[s];
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
		var representativeName = escapeHtml($.trim($('#representativeName').val()));
		var charityName = escapeHtml($.trim($('#name').val()));
		var description = $.trim($('#description').val());
		var contract = web3.eth.contract(contractABI).at(contractAddress);

		if ($.trim($('#description').val()) == '' || 
			$.trim($('#funds').val()) == '' ||
			$.trim($('#name').val()) == '' ||
			$.trim($('#representativeName').val()) == '') {
			return showError("Inputs cannot be left blank");
		}

		console.log(representativeName)
		console.log(charityName)

		if (typeof web3 === 'undefined') {
			return showError("Please install MetaMask to access the Ethereum Web3 API from your web browser.");
		}

		contract.getCharityIdByName(charityName, function(err, res) {
			if (err) {
				return showError("Error: " + err);
			}

			var charityExists = res[1];

			if (!charityExists) {

				contract.getCharitiesCount(function(err, res) {
					if (err) {
						return showError("Error: " + err);
					}

					var newCharityId = res.c[0];

					$.ajax({
						url: 'http://localhost:8001/addCharity',
						type: 'GET',
						contentType: "application/json",
						data: {
						    description: description,
						    charityId: newCharityId
						},
						success: function(data) {
							contract.submitCharity(charityName, representativeName, 
								web3.toWei(charityFunds), function(err, res) {
								$("#loadingBox").hide();

								if (err) {
									return showError("Smart contract call failed: " + err);
								}

								showInfo("Charity added successfully");
							});
						},
						error: function(data) {
							console.log(data);
							showError(data.error);
							$("#loadingBox").hide();	
						}
					});
				});
			} else {
				showError("Charity with such name exists!");
			}
		});
	}
});



