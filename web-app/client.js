$(document).ready(function() {
	var contractAddress = "0x317eb7218d599e1f78642a900d9f830f7181291d";
	var contractABI = [
		{
			"constant": true,
			"inputs": [],
			"name": "owner",
			"outputs": [
				{
					"name": "",
					"type": "address"
				}
			],
			"payable": false,
			"stateMutability": "view",
			"type": "function"
		},
		{
			"constant": true,
			"inputs": [
				{
					"name": "",
					"type": "uint256"
				}
			],
			"name": "currentFundsForCharity",
			"outputs": [
				{
					"name": "",
					"type": "uint256"
				}
			],
			"payable": false,
			"stateMutability": "view",
			"type": "function"
		},
		{
			"constant": true,
			"inputs": [
				{
					"name": "",
					"type": "uint256"
				}
			],
			"name": "charities",
			"outputs": [
				{
					"name": "representative",
					"type": "address"
				},
				{
					"name": "totalFundsRequest",
					"type": "uint256"
				},
				{
					"name": "isFunded",
					"type": "bool"
				}
			],
			"payable": false,
			"stateMutability": "view",
			"type": "function"
		},
		{
			"constant": false,
			"inputs": [
				{
					"name": "_charityId",
					"type": "uint256"
				}
			],
			"name": "giveMoneyForCharity",
			"outputs": [],
			"payable": true,
			"stateMutability": "payable",
			"type": "function"
		},
		{
			"constant": false,
			"inputs": [
				{
					"name": "_totalFundsRequest",
					"type": "uint256"
				}
			],
			"name": "submitCharity",
			"outputs": [
				{
					"name": "",
					"type": "uint256"
				}
			],
			"payable": false,
			"stateMutability": "nonpayable",
			"type": "function"
		},
		{
			"inputs": [],
			"payable": false,
			"stateMutability": "nonpayable",
			"type": "constructor"
		},
		{
			"payable": false,
			"stateMutability": "nonpayable",
			"type": "fallback"
		}
	];

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

	function addCharity() {
		if ($.trim($('#description').val()) == '' || 
			$.trim($('#funds').val()) == '') {
			return showError("Inputs cannot be left blank");
		}

		if (typeof web3 === 'undefined') {
			return showError("Please install MetaMask to access the Ethereum Web3 API from your web browser.");
		}

		var charityFunds = $('#funds').val();
		var contract = web3.eth.contract(contractABI).at(contractAddress);
		contract.submitCharity(charityFunds, function(err, res) {
			if (err) {
				return showError("Smart contract call failed: " + err);
			}

			console.log(res);

			showInfo("Charity submitted successfully!");
		});
	}
});



