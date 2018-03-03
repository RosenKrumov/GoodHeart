$(document).ready(async function() {
    var charities = [];

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

    $.ajax({
        url: 'http://localhost:8001/getAllCharities',
        async:true,
        dataType: "json", 
    }).then(async function(res) {
        charities = res;
        
        var contract = web3.eth.contract(contractABI).at(contractAddress);

        contract.getCharitiesCount(async function(err, res) {
            if (err) {
                return showError("Smart contract call failed: " + err);
            }

            var charitiesCount = res.c[0];

            for (var i = 0; i < charitiesCount; i++) {
                await contract.getCharity(i, function(err, charityResult) {
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
                    var description = charities[id].description;
                    var image = charities[id].image;

                    var htmlRender = `<div>
                                            <p>Description: ${description}</p>
                                            <p>Representative: ${representativeName}</p>
                                            <p>Charity name: ${charityName}</p>
                                            <p>Funded: ${isFundedStr}</p>
                                            <p>Total ether requested: ${totalFundsRequest}</p>
                                            <hr>
                                      </div>`

                    $("#charitiesContainer").append(htmlRender);
                });
            }
        });
    });
});
