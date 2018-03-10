const GoodHeart = artifacts.require("./GoodHeart.sol");
const expectThrow = require("./util.js").expectThrow;


contract('GoodHeart', async function(accounts) {
	const _owner = accounts[0];
	const _notOwner = accounts[1];
	
	let goodHeartInstance;

	describe("get functions tests", async () => {
		beforeEach(async function() {
			goodHeartInstance = await GoodHeart.new({
				from: _owner
			});

			let charityName = "TestName";
			let representerName = "TestRepresenter";
			let fundsRequest = web3.toWei(1);

			await goodHeartInstance.submitCharity(charityName, representerName, fundsRequest);
		});

		it("getting contract owner should correctly return the creator address", async function () {
			let contractOwnerResult = await goodHeartInstance.getContractOwner();
			let contractOwner = contractOwnerResult;

			assert.strictEqual(_owner, contractOwner, "Expected to get the address of the creator, got different");
		});

		it("getting charity id by name should correctly return charity id", async function () {
			let charityResult = await goodHeartInstance.getCharityIdByName("TestName");
			let id = charityResult[0].toNumber();
			let isFound = charityResult[1];

			assert.strictEqual(id, 0, "Expected to get id 0, got different");
			assert.isTrue(isFound, "Expected to get found as true, got different");

			charityResult = await goodHeartInstance.getCharityIdByName("NonExistingCharity");
			id = charityResult[0].toNumber();
			isFound = charityResult[1];

			assert.strictEqual(id, 0, "Expected to get id 0, got different");
			assert.isFalse(isFound, "Expected to get found as false, got different");
		});

		it("getting charities count should correctly return the array length", async function () {
			let charitiesCountResult = await goodHeartInstance.getCharitiesCount();
			let charitiesCount = charitiesCountResult.c[0];
			assert.strictEqual(1, charitiesCount, "Expected to have charities count as 1, got different");
		});
	});
});