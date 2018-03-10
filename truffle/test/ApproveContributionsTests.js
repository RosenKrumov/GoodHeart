const GoodHeart = artifacts.require("./GoodHeart.sol");
const expectThrow = require("./util.js").expectThrow;

contract('GoodHeart', async function(accounts) {
	const _owner = accounts[0];
	const _notOwner = accounts[1];
	
	let goodHeartInstance;

	describe("approving contributions for charity - tests with invalid data", async () => {
		beforeEach(async function() {
			goodHeartInstance = await GoodHeart.new({
				from: _owner
			});

			let charityName = "TestName";
			let representerName = "TestRepresenter";
			let fundsRequest = web3.toWei(1);

			await goodHeartInstance.submitCharity(charityName, representerName, fundsRequest, {from: _notOwner});
			await goodHeartInstance.giveMoneyForCharity(0, {value: parseInt(web3.toWei(1), 10), from: _owner});
			await goodHeartInstance.addContributionToCharity(0, {from: _notOwner});
		});

		it("should revert if contract non-owner is trying to approve contribution", async () => {
			await expectThrow(goodHeartInstance.approveContributionToCharity(0, 0, {from: _notOwner}));
		});

		it("should revert if charity is not funded yet", async () => {
			let secondCharityId = 1;
			await goodHeartInstance.submitCharity("SecondCharity", "SecondRepresenter", web3.toWei(1), {from: _notOwner});
			await expectThrow(goodHeartInstance.approveContributionToCharity(secondCharityId, 0, {from: _notOwner}));
		});

		it("should revert if there are no contributions for approving", async () => {
			await goodHeartInstance.approveContributionToCharity(0, 0, {from: _owner});
			await expectThrow(goodHeartInstance.approveContributionToCharity(0, 1, {from: _owner}));
		});

		it("should revert if contribution is already approved", async () => {
			await goodHeartInstance.approveContributionToCharity(0, 0, {from: _owner});
			await expectThrow(goodHeartInstance.approveContributionToCharity(0, 0, {from: _owner}));
		});
	});

	describe("approving contributions for charity - tests with valid data", async () => {
		beforeEach(async function() {
			goodHeartInstance = await GoodHeart.new({
				from: _owner
			});

			let charityName = "TestName";
			let representerName = "TestRepresenter";
			let fundsRequest = web3.toWei(1);

			await goodHeartInstance.submitCharity(charityName, representerName, fundsRequest, {from: _notOwner});
			await goodHeartInstance.giveMoneyForCharity(0, {value: parseInt(web3.toWei(1), 10), from: _owner});
			await goodHeartInstance.addContributionToCharity(0, {from: _notOwner});
		});

		it("should increase the number of approved contributions by 1", async () => {
			let approvedContributionsBeforeResult = await goodHeartInstance.getCharityApprovedContributions(0);
			let approvedContributionsBefore = approvedContributionsBeforeResult.toNumber();

			await goodHeartInstance.approveContributionToCharity(0, 0, {from: _owner});
			
			let approvedContributionsAfterResult = await goodHeartInstance.getCharityApprovedContributions(0);
			let approvedContributionsAfter = approvedContributionsAfterResult.toNumber();

			assert.strictEqual(approvedContributionsBefore + 1, approvedContributionsAfter, "Expected increased approved with 1, got different");
		});

		// it("should decrease the number of non-approved contributions by 1", async () => {
		// 	let notApprovedContributionsBeforeResult = await goodHeartInstance.getCharityNotApprovedContributions(0);
		// 	let notApprovedContributionsBefore = notApprovedContributionsBeforeResult.toNumber();

		// 	await goodHeartInstance.approveContributionToCharity(0, 0, {from: _owner});
			
		// 	let notApprovedContributionsAfterResult = await goodHeartInstance.getCharityNotApprovedContributions(0);
		// 	let notApprovedContributionsAfter = notApprovedContributionsAfterResult.toNumber();

		// 	assert.strictEqual(notApprovedContributionsBefore - 1, notApprovedContributionsAfter, "Expected decreased non-approved with 1, got different");
		// });

		it("should set the particular contribution in the array to approved", async () => {
			let contributionStatusBeforeResult = await goodHeartInstance.getCharityContributionData(0, 0);
			let contributionStatusBefore = contributionStatusBeforeResult[1];

			await goodHeartInstance.approveContributionToCharity(0, 0, {from: _owner});

			let contributionStatusAfterResult = await goodHeartInstance.getCharityContributionData(0, 0);
			let contributionStatusAfter = contributionStatusAfterResult[1];

			assert.isFalse(contributionStatusBefore, "Expected contribution to be non-approved before approving, got different");
			assert.isTrue(contributionStatusAfter, "Expected contribution to be approved after approving, got different")
		});

		it("should grant portion of total request to the representer on first contribution approval", async () => {
			let balanceBeforeApprove = web3.fromWei(web3.eth.getBalance(_notOwner)).toNumber();

			await goodHeartInstance.approveContributionToCharity(0, 0, {from: _owner});

			let balanceAfterApprove = web3.fromWei(web3.eth.getBalance(_notOwner)).toNumber();

			assert.isAbove(balanceAfterApprove, balanceBeforeApprove, "Expected balance to be increased with portion, got different");
		});

		it("should decrease currently collected funds as they are granted to representer on each approval", async () => {
			await goodHeartInstance.approveContributionToCharity(0, 0, {from: _owner});

			let charity = await goodHeartInstance.getCharity.call(0);
			let currentFunds = web3.fromWei(charity[6]).toNumber();
			
			assert.strictEqual(currentFunds, 0.8, "Expected currently collected funds to be decreased by 10%");

			await goodHeartInstance.addContributionToCharity(0, {from: _notOwner});
			await goodHeartInstance.approveContributionToCharity(0, 1, {from: _owner});

			charity = await goodHeartInstance.getCharity.call(0);
			currentFunds = web3.fromWei(charity[6]).toNumber();

			assert.strictEqual(currentFunds, 0.6, "Expected currently collected funds to be decreased by 10%");

			await goodHeartInstance.addContributionToCharity(0, {from: _notOwner});
			await goodHeartInstance.approveContributionToCharity(0, 2, {from: _owner});

			charity = await goodHeartInstance.getCharity.call(0);
			currentFunds = web3.fromWei(charity[6]).toNumber();

			assert.strictEqual(currentFunds, 0.3, "Expected currently collected funds to be decreased by 10%");

			await goodHeartInstance.addContributionToCharity(0, {from: _notOwner});
			await goodHeartInstance.approveContributionToCharity(0, 3, {from: _owner});

			charity = await goodHeartInstance.getCharity.call(0);
			currentFunds = web3.fromWei(charity[6]).toNumber();

			assert.strictEqual(currentFunds, 0, "Expected currently collected funds to be decreased by 10%");
		})
	});
});