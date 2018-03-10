var entityMap = {
    '<': '&lt;',
    '>': '&gt;',
};

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

    //Moustache.js
    //TODO move in common file
    function escapeHtml (string) {
        return String(string).replace(/[<>]/g, function (s) {
            return entityMap[s];
        });
    }

    function checkUrlIsValidImage(url) {
        return(url.match(/\.(jpeg|jpg|gif|png)$/) != null);
    }

    $(document).on("change", "#contributionImage", function () {
        var reader = new FileReader();

        reader.onload = function (e) {
            // get loaded data and render thumbnail.
            $("#image").attr("src", e.target.result);
            $("#image").attr("width", 500);
            $("#image").attr("height", 300);
        };

        // read the image file as a data URL.
        reader.readAsDataURL(this.files[0]);
    });

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
            await contract.getCharity(charityId, async function(err, charityResult) {
                if (err) {
                    return showError("Smart contract call failed: " + err);
                }

                var address = charityResult[0];
                var representativeName = charityResult[1];
                var charityName = charityResult[2];
                var totalFundsRequest = web3.fromWei(charityResult[3]);
                var isFunded = charityResult[4];
                var isFundedStr = isFunded ? "Yes" : "Not funded"; 
                var id = charityResult[5];
                var currentFunds = web3.fromWei(charityResult[6]);
                var description = charity.description;
                var image = charity.image;

                var htmlRender = `<div style="font-size: 1.3em;">
                                        <h3>${charityName}</h3>
                                        <p class="text-justify">Description: ${description}</p>
                                        <p class="text-justify">Representative: ${representativeName}</p>
                                        <p class="text-justify">Funded: ${isFundedStr}</p>
                                        <p class="text-justify">Total ether requested: ${totalFundsRequest}</p>`;

                if (isFunded) {
                    if (web3.eth.coinbase == address && currentFunds > 0) {
                        htmlRender += ` <hr>
                                        <div class="form-group">
                                            <label for="contributionDescription">Contribution description: </label>
                                            <textarea class="form-control" rows="5", id="contributionDescription", 
                                            name="contributionDescription", style="resize: none"></textarea>
                                            <label for="imageUrl">Please enter image URL as evidence: </label>
                                            <input class="form-control" type="url" id="imageUrl" name="imageUrl"></input><br>
                                            <br><br><input class="btn btn-default" type="button" id="addContributionButton" 
                                                                value="Add contribution"></input>
                                        </div>
                                        <hr>
                                  </div>`;
                    } else if (currentFunds == 0) {
                        htmlRender += ` <h3>Charity is completed!</h3>
                                        <hr>
                                  </div>`;
                    } else if (web3.eth.coinbase != address) {
                        htmlRender += ` <hr>
                                  </div>`;
                    }
                } else {
                    htmlRender += `     <p class="text-justify">Current ether collected: ${currentFunds}</p>
                                        <hr>
                                        <label for="funds">Money amount (in Ether): </label>
                                        <input class="form-control" type="text" id="funds" name="funds"></input><br>
                                        <input class="btn btn-default" type="button" id="grantMoneyButton" value="Grant money"></input>
                                        <hr>
                                  </div>`;
                }

                $("#charityContainer").append(htmlRender);

                if (isFunded) {

                    displayContributions(contract, charityId, isFunded, currentFunds);
                }
            });
        });
    }

    function displayContributions(contract, charityId, isFunded, currentFunds) {
        var id = parseInt(charityId, 10);
        contract.getCharityContributionsCount(id, async function(err, result) {
            if (err) {
                return showError("Smart contract call failed: " + err);
            }

            var contributionsCount = result;

            console.log("Contributions: " + contributionsCount);

            if(contributionsCount > 0) {
                console.log("TEST");

                $.ajax({
                    url: 'http://localhost:8001/getCharityContributions',
                    type: 'GET',
                    contentType: "application/json",
                    data: {
                        charityId: id
                    },
                    error: function(data) {
                        console.log(data);
                        $("#loadingBox").hide();    
                    },
                    success: async function(contributions) {

                        var contributionHtmlRender = `<div style="font-size: 1.3em;">
                                            <h3>Contributions:</h3>
                                            <hr>`;

                        var notApprovedContrIds = [];

                        for (var i = 0; i < contributionsCount; i++) {
                            await contract.getCharityContributionData(charityId, i, function(err, result) {
                                if (err) {
                                    return showError("Smart contract call failed: " + err);
                                }

                                var contributionId = result[0];
                                var approved = result[1];
                                var contributionDescription = contributions[contributionId].description;
                                var contributionImage = contributions[contributionId].image;

                                if (contributionDescription != '') {
                                    contributionHtmlRender += ` <p class="text-justify">
                                                                    Description: ${contributionDescription}
                                                                </p>
                                                                <p class="text-justify">
                                                                    Id: ${contributionId}
                                                                </p>
                                                                <br>
                                                                <img src="${contributionImage}" width="500" height="300" /><br><br>`;
                                    if (!approved && web3.eth.coinbase == contractOwnerAddress) {
                                        notApprovedContrIds.push(contributionId);
                                    }

                                    contributionHtmlRender += `<hr>`;
                                }

                                if (contributionId == contributionsCount - 1) {
                                    if (web3.eth.coinbase == contractOwnerAddress && isFunded && currentFunds != 0) {
                                        if (notApprovedContrIds.length == 0) {
                                            contributionHtmlRender += `<p class="text-center">You currently do not have contributions for approving</p>`
                                        } else {
                                            contributionHtmlRender += ` <select id="selectContribution">`;

                                            notApprovedContrIds.map(id => {
                                                contributionHtmlRender += `<option>${id}</option>`
                                            })

                                            contributionHtmlRender += ` </select>`;
                                            contributionHtmlRender += ` <input class='btn btn-default' type='button' id='approveContributionButton'
                                                                                            value='Approve'></input>`;
                                        }
                                    }

                                    contributionHtmlRender += `</div>`;
                                    $("#charityContainer").append(contributionHtmlRender);
                                }
                            });
                        }
                    }
                });
            }

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

        var moneyToGrantWei = parseInt(web3.toWei(moneyToGrant), 10);

        var contract = web3.eth.contract(contractABI).at(contractAddress);
        
        console.log(charityId);
        console.log(moneyToGrantWei);

        contract.giveMoneyForCharity(charityId, {value: moneyToGrantWei}, function(err, res) {
            if(err) {
                return showError("Smart contract call failed: " + err);
            } else {
                return showInfo("Money granted to charity successfully!");
            }
        });
    });

    $(document).on('click', '#addContributionButton', function(e) {
        if (typeof web3 === 'undefined') {
            return showError("Please install MetaMask to access the Ethereum Web3 API from your web browser.");
        }

        var imageUrl = escapeHtml($.trim($('#imageUrl').val()));
        if (imageUrl == '' || !checkUrlIsValidImage(imageUrl)) {
            return showError("Please add valid image evidence for the contribution");
        }

        console.log(imageUrl);

        var description = escapeHtml($.trim($('#contributionDescription').val()));
        if (description == '') {
            return showError("Please add a description for the contribution");
        }

        var contract = web3.eth.contract(contractABI).at(contractAddress);
        contract.getCharityContributionsCount(charityId, function(err, res) {
            if(err) {
                return showError("Smart contract call failed: " + err);
            }
        
            console.log(res);
            var contributionId = res.c[0];

            $.ajax({
                url: 'http://localhost:8001/addCharityContribution',
                type: 'GET',
                data: {
                    description: description,
                    charityId: charityId,
                    imageUrl: imageUrl,
                    contributionId: contributionId
                },
                success: async function(data) {
                    console.log(data);
                    contract.addContributionToCharity(charityId, async function(err, res) {
                        $("#loadingBox").hide();

                        if (err) {
                            return showError("Smart contract call failed: " + err);
                        }

                        showInfo("Contribution added successfully");
                    });
                },
                error: async function(data) {
                    console.log(data);
                    showError(data.error);
                    $("#loadingBox").hide();    
                }
            });
        });
    });

    $(document).on('click', '#approveContributionButton', function(e) {
        if (typeof web3 === 'undefined') {
            return showError("Please install MetaMask to access the Ethereum Web3 API from your web browser.");
        }

        if (web3.eth.coinbase != contractOwnerAddress) {
            return showError("You are not the owner of the contract.");
        }

        var contributionId = escapeHtml($.trim($("#selectContribution").val()));

        if (contributionId != parseInt(contributionId, 10)) {
            return showError("Invalid ID provided.");
        }

        contributionId = parseInt(contributionId, 10);

        var contract = web3.eth.contract(contractABI).at(contractAddress);
        contract.approveContributionToCharity(charityId, contributionId, function(err, res) {
            if(err) {
                return showError("Smart contract call failed: " + err);
            } 
        
            console.log(res);
            showInfo("Contribution approved successfully!");
        });
    });
});
