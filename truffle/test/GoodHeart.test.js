const GoodHeart = artifacts.require("./GoodHeart.sol");

contract('GoodHeart', function(accounts) {
	let goodHeartInstance;

	const _owner = accounts[0];
	const _notOwner = accounts[1];

	describe("creating GoodHeart", () => {
		beforeEach(async function() {
			goodHeartInstance = await GoodHeart.new({
				from: _owner;
			});
		});

		it("should set owner correctly", async function() {
			let owner = await.goodHeartInstance.owner.call();
		})
	});
});