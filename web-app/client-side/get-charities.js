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
        if(res.length > 0) {
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

                        var charityName = charityResult[2];
                        var id = charityResult[5];


                        var htmlRender = `<div>
                                                <a style="font-size: 1.5em;" href=/charities/${id}>${charityName}</a>
                                                <hr>
                                          </div>`

                        $("#charitiesContainer").append(htmlRender);
                    });
                }
            });
        }
    });
});
