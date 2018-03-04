$(document).ready(async function() {
    var charityId = $('#charityId').text();
    var validStatus = $('#isFound').text();

    $('main > section').hide();

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

    // Attach AJAX "loading" event listener
    $(document).on({
        ajaxStart: function () {
            $("#loadingBox").show()
        },
        ajaxStop: function () {
            $("#loadingBox").hide()
        }
    });

    if (validStatus == 'OK') {

        $.ajax({
            url: 'http://localhost:8001/getCharity',
            type: 'GET',
            contentType: "application/json",
            data: {
                charityId: charityId
            },
            error: function(data) {
                $("#loadingBox").hide();    
            }
        }).then(async function(res) {
            $("#loadingBox").hide();

            var charity = res;
            var contract = web3.eth.contract(contractABI).at(contractAddress);
            await contract.getCharity(charityId, function(err, charityResult) {
                if (err) {
                    return showError("Smart contract call failed: " + err);
                }

                var address = charityResult[0];
                var representativeName = charityResult[1];
                var charityName = charityResult[2];
                var totalFundsRequest = charityResult[3];
                var isFunded = charityResult[4];
                var isFundedStr = isFunded ? "Yes" : "Not funded"; 
                var id = charityResult[5];
                var currentFunds = charityResult[6].toString();
                var description = charity.description;
                var image = charity.image;

                var htmlRender = `<div style="font-size: 1.3em;">
                                        <h3>${charityName}</h3>
                                        <p class="text-justify">Description: ${description}</p>
                                        <p class="text-justify">Representative: ${representativeName}</p>
                                        <p class="text-justify">Funded: ${isFundedStr}</p>`;

                if (isFunded) {
                    htmlRender += `     <p class="text-justify">Total ether requested: ${totalFundsRequest}</p>
                                        <hr>
                                  </div>`;
                } else {
                    htmlRender += `     <p class="text-justify">Total ether requested: ${totalFundsRequest}</p>
                                        <p class="text-justify">Current ether collected: ${currentFunds}</p>
                                        <hr>
                                        <label for="funds">Money amount (in Ether): </label>
                                        <input class="form-control" type="text" id="funds" name="funds"></input><br>
                                        <input class="btn btn-default" type="button" id="grantMoneyButton" value="Grant money"></input>
                                        <hr>
                                  </div>`;
                }


                $("#charityContainer").append(htmlRender);
            });
        });
    }

    $(document).on('click','#grantMoneyButton',function(e) {
        if (typeof web3 === 'undefined') {
            return showError("Please install MetaMask to access the Ethereum Web3 API from your web browser.");
        }

        var moneyToGrant = $.trim($('#funds').val());

        if (moneyToGrant == 0) {
            return showError("You cannot grant 0 money");
        }

        if(parseFloat(moneyToGrant, 10) != moneyToGrant) {
            return showError("Invalid money number");
        }

        var contract = web3.eth.contract(contractABI).at(contractAddress);
        
        contract.giveMoneyForCharity(charityId, {value: web3.toWei(moneyToGrant)}, function(err, res) {
            if(err) {
                return showError("Smart contract call failed: " + err);
            } else {
                return showInfo("Money granted to charity successfully!");
            }
        });
    });
});
