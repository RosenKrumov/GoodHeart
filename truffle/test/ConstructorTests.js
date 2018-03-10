const GoodHeart = artifacts.require("./GoodHeart.sol");
const expectThrow = require("./util.js").expectThrow;


contract('GoodHeart', async function(accounts) {
	const _owner = accounts[0];
	const _notOwner = accounts[1];
	
	let goodHeartInstance;

	describe("creating GoodHeart", async () => {
		beforeEach(async function() {
			goodHeartInstance = await GoodHeart.new({
				from: _owner
			});
		});
		
		it("should set owner correctly", async function() {
			let owner = await goodHeartInstance.owner.call();

			assert.strictEqual(owner, _owner, "The expected owner is not set");
		});
	});	
});