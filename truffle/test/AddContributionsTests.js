const GoodHeart = artifacts.require("./GoodHeart.sol");
const expectThrow = require("./util.js").expectThrow;

contract('GoodHeart', async function(accounts) {
	const _owner = accounts[0];
	const _notOwner = accounts[1];
	
	let goodHeartInstance;

	describe("adding contributions to charity - tests with invalid data", async () => {
		beforeEach(async function() {
			goodHeartInstance = await GoodHeart.new({
				from: _owner
			});

			let charityName = "TestName";
			let representerName = "TestRepresenter";
			let fundsRequest = web3.toWei(1);

			await goodHeartInstance.submitCharity(charityName, representerName, fundsRequest, {from: _notOwner});
			await goodHeartInstance.giveMoneyForCharity(0, {value: parseInt(web3.toWei(1), 10), from: _owner});
		});

		it("should revert if non-representer is trying to add contribution", async () => {
			await expectThrow(goodHeartInstance.addContributionToCharity(0, {from: _owner}));
		});

		it("should revert if charity is not funded yet", async () => {
			let secondCharityId = 1;
			await goodHeartInstance.submitCharity("SecondCharity", "SecondRepresenter", web3.toWei(1), {from: _notOwner});
			await expectThrow(goodHeartInstance.addContributionToCharity(secondCharityId, {from: _notOwner}));
		});

		it("should revert if charity is funded and already completed", async () => {
			for (var i = 0; i < 4; i++) {
				await goodHeartInstance.addContributionToCharity(0, {from: _notOwner});
				await goodHeartInstance.approveContributionToCharity(0, i, {from: _owner});				
			}

			await expectThrow(goodHeartInstance.addContributionToCharity(0, {from: _notOwner}));
		})
	});

	describe("adding contributions to charity - tests with valid data", async () => {
		beforeEach(async function() {
			goodHeartInstance = await GoodHeart.new({
				from: _owner
			});

			let charityName = "TestName";
			let representerName = "TestRepresenter";
			let fundsRequest = web3.toWei(1);

			await goodHeartInstance.submitCharity(charityName, representerName, fundsRequest, {from: _notOwner});
			await goodHeartInstance.giveMoneyForCharity(0, {value: parseInt(web3.toWei(1), 10), from: _owner});
		});

		it("should increase the number of non-approved contributions by 1", async () => {
			let notApprovedContributionsBeforeResult = await goodHeartInstance.getCharityNotApprovedContributions(0);
			let notApprovedContributionsBefore = notApprovedContributionsBeforeResult.toNumber();

			await goodHeartInstance.addContributionToCharity(0, {from: _notOwner});
			
			let notApprovedContributionsAfterResult = await goodHeartInstance.getCharityNotApprovedContributions(0);
			let notApprovedContributionsAfter = notApprovedContributionsAfterResult.toNumber();

			assert.strictEqual(notApprovedContributionsBefore + 1, notApprovedContributionsAfter, "Expected increased non-approved with 1, got different");
		});

		it("should correctly add contribution to (charityId => contributions[]) map", async () => {
			let contributionsCountBeforeResult = await goodHeartInstance.getCharityContributionsCount(0);
			let contributionsCountBefore = contributionsCountBeforeResult.toNumber();

			await goodHeartInstance.addContributionToCharity(0, {from: _notOwner});

			let contributionsCountAfterResult = await goodHeartInstance.getCharityContributionsCount(0);
			let contributionsCountAfter = contributionsCountAfterResult.toNumber();

			assert.strictEqual(contributionsCountBefore + 1, contributionsCountAfter, "Expected increased contributions count, got different");
		})
	});
});