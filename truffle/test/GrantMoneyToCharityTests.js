const GoodHeart = artifacts.require("./GoodHeart.sol");
const expectThrow = require("./util.js").expectThrow;

contract('GoodHeart', async function(accounts) {
	const _owner = accounts[0];
	const _notOwner = accounts[1];
	
	let goodHeartInstance;

	describe("giving money to charity - tests with invalid data", async () => {
		before(async function() {
			goodHeartInstance = await GoodHeart.new({
				from: _owner
			});

			let charityName = "TestName";
			let representerName = "TestRepresenter";
			let fundsRequest = web3.toWei(1);

			await goodHeartInstance.submitCharity(charityName, representerName, fundsRequest);
		});

		it("should revert on 0 money given", async function() {
			await expectThrow(goodHeartInstance.giveMoneyForCharity(0, {value: 0}));
		});

		it("should revert if charity is funded", async function() {
			let moneyToGrantWei = parseInt(web3.toWei(1), 10);

			await goodHeartInstance.giveMoneyForCharity(0, {value: moneyToGrantWei});
			await expectThrow(goodHeartInstance.giveMoneyForCharity(0, {value: moneyToGrantWei})); 
		});
	});

	describe("giving money to charity - tests with valid data", async () => {
		beforeEach(async function() {
			goodHeartInstance = await GoodHeart.new({
				from: _owner
			});

			let charityName = "TestName";
			let representerName = "TestRepresenter";
			let fundsRequest = web3.toWei(1);

			await goodHeartInstance.submitCharity(charityName, representerName, fundsRequest);
		});

		it("should set isFunded to true when funds are collected", async () => {
			let moneyToGrantWei = parseInt(web3.toWei(1), 10);
			await goodHeartInstance.giveMoneyForCharity(0, {value: moneyToGrantWei});

			let charity = await goodHeartInstance.getCharity.call(0);
			let isFunded = charity[4];
			assert.strictEqual(isFunded, true, "Charity is not funded, expected to be funded");
		});	

		it("should return change when grant is more than remaining", async () => {
			let balanceBeforeGrant = Math.floor(web3.fromWei(web3.eth.getBalance(web3.eth.coinbase).toNumber()));
			let expectedChange = parseInt(web3.toWei(1), 10);

			let moneyToGrantWei = parseInt(web3.toWei(2), 10);
			await goodHeartInstance.giveMoneyForCharity(0, {value: moneyToGrantWei});

			let balanceAfterGrant = web3.eth.getBalance(web3.eth.coinbase).toNumber();
			let expectedBalanceAfterGrant = Math.floor(web3.fromWei(balanceAfterGrant + expectedChange));

			assert.strictEqual(expectedBalanceAfterGrant, balanceBeforeGrant, "Expected change of 1 ether, got different change");
		});

		it("should increase current collected funds with all remaining from requested and return 10% when grant is >= remaining", async () => {
			let moneyToGrantWei = parseInt(web3.toWei(1), 10);
			await goodHeartInstance.giveMoneyForCharity(0, {value: moneyToGrantWei});

			let charity = await goodHeartInstance.getCharity.call(0);
			let totalFundsReq = web3.fromWei(charity[3]).toNumber();
			let currentFunds = web3.fromWei(charity[6]).toNumber();

			assert.strictEqual(totalFundsReq - 0.1, currentFunds, "Expected current funds to be equal to total request, got different");
		});

		it("should increase current collected funds with grant amount when grant is less than remaining", async () => {
			let moneyToGrantWei = parseInt(web3.toWei(0.1), 10);
			await goodHeartInstance.giveMoneyForCharity(0, {value: moneyToGrantWei});

			let charity = await goodHeartInstance.getCharity.call(0);
			let totalFundsReq = web3.fromWei(charity[3]).toNumber();
			let currentFunds = web3.fromWei(charity[6]).toNumber();

			assert.strictEqual(0.1, currentFunds, "Expected current funds to be equal to total request, got different");
		});

		it("should give first 10% of the fund to the representer when the charity gets funded", async () => {
			await goodHeartInstance.submitCharity("SecondCharity", "SecondRepresenter", web3.toWei(1), {from: web3.eth.accounts[1]});
			let moneyToGrantWei = parseInt(web3.toWei(1), 10);
			let balanceBeforeGrant = web3.fromWei(web3.eth.getBalance(web3.eth.accounts[1])).toNumber();

			await goodHeartInstance.giveMoneyForCharity(1, {value: moneyToGrantWei, from: web3.eth.accounts[0]});

			let balanceAfterGrant = web3.fromWei(web3.eth.getBalance(web3.eth.accounts[1])).toNumber();

			assert.strictEqual(balanceBeforeGrant + 0.1, balanceAfterGrant, "Expected return to representer of 0.1, got different");
		});

		it("should decrease currently collected funds with 10% after giving first 10% on getting funded", async () => {
			let moneyToGrantWei = parseInt(web3.toWei(1), 10);
			await goodHeartInstance.submitCharity("SecondCharity", "SecondRepresenter", web3.toWei(1), {from: web3.eth.accounts[1]});
			await goodHeartInstance.giveMoneyForCharity(1, {value: moneyToGrantWei, from: web3.eth.accounts[0]});

			let charity = await goodHeartInstance.getCharity.call(1);
			let currentFunds = web3.fromWei(charity[6]).toNumber();

			assert.strictEqual(0.9, currentFunds, "Expected currently collected funds decreased by 10%, got different");
		});
	});
});