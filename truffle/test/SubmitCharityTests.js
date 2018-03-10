const GoodHeart = artifacts.require("./GoodHeart.sol");
const expectThrow = require("./util.js").expectThrow;

contract('GoodHeart', async function(accounts) {
	const _owner = accounts[0];
	const _notOwner = accounts[1];
	
	let goodHeartInstance;

	describe("submitting charity - tests with invalid data", async () => {
		beforeEach(async function() {
			goodHeartInstance = await GoodHeart.new({
				from: _owner
			});
		});

		it("should revert on invalid charity name", async function() {
			let charityName = "";
			let representerName = "TestRepresenter";
			let fundsRequest = 1000;

			await expectThrow(goodHeartInstance.submitCharity(charityName, representerName, fundsRequest));
		});

		it("should revert on invalid representer name", async function() {
			let charityName = "TestName";
			let representerName = "";
			let fundsRequest = 1000;

			await expectThrow(goodHeartInstance.submitCharity(charityName, representerName, fundsRequest));
		});

		it("should revert on zero funds request", async function() {
			let charityName = "TestName";
			let representerName = "TestRepresenter";
			let fundsRequest = 0;

			await expectThrow(goodHeartInstance.submitCharity(charityName, representerName, fundsRequest));
		});
	});

	describe("submitting charity - tests with valid data", async () => {
		before(async function() {
			goodHeartInstance = await GoodHeart.new({
				from: _owner
			});

			let charityName = "TestName";
			let representerName = "TestRepresenter";
			let fundsRequest = web3.toWei(1);

			await goodHeartInstance.submitCharity(charityName, representerName, fundsRequest);
		});

		it("should add charity to the Charities array", async function() {
			let charitiesCountResult = await goodHeartInstance.getCharitiesCount.call();

			let charitiesCount = charitiesCountResult.c[0];
			assert.strictEqual(1, charitiesCount, "Charities count do not match");
		});

		it("should create the charity with the passed arguments", async function() {
			let charity = await goodHeartInstance.getCharity.call(0);
			
			let createdCharityOwner = charity[0];
			let createdCharityRepresenter = charity[1];
			let createdCharityName = charity[2];
			let createdCharityTotalFundsReq = web3.fromWei(charity[3]).toNumber();
			let createdCharityIsFunded = charity[4];

			assert.strictEqual(createdCharityOwner, _owner, "Charity owner does not match");
			assert.strictEqual(createdCharityRepresenter, "TestRepresenter", "Charity representer does not match");
			assert.strictEqual(createdCharityName, "TestName", "Charity name does not match");
			assert.strictEqual(createdCharityTotalFundsReq, 1, "Charity total funds request does not match");
			assert.strictEqual(createdCharityIsFunded, false, "Charity is funded, expected to not be funded");
		});

		it("should set currentFundsForCharity[charityId] to 0", async function() {
			let charity = await goodHeartInstance.getCharity.call(0);
			let createdCharityCurrentFunds = web3.fromWei(charity[6]).toNumber();

			assert.strictEqual(createdCharityCurrentFunds, 0, "Charity current funds collected are not 0");
		});

		it("contributions should be zero", async function() {
			let charityContributionsCountResult = await goodHeartInstance.getCharityContributionsCount.call(0);
			let charityContributionsCount = charityContributionsCountResult.c[0];

			assert.strictEqual(charityContributionsCount, 0, "Charity contributions are not 0");
		});
	});
});