pragma solidity ^0.4.19;

/**
 * The GoodHeart contract represents a charity organization.
 	Some users request funds for charity activities
 	Other users give money for charity to particular activity
 	Contract stores the money and grants to the requesters on portions,
 	depending on their contribution
 */

contract GoodHeart {

	struct Charity {
		address representative;
		string name;
		uint totalFundsRequest;
		bool isFunded;
	}

	address public owner;
	Charity[] public charities;
	mapping (uint => uint) public currentFundsForCharity;

	modifier onlyOwner() {
		require(msg.sender == owner);
		_;
	}

	modifier needsMoreMoney(uint _id) {
		require(charities[_id].isFunded == false);
		_;
	}

	modifier checkCharityFundsOverflow(uint _id) { 
		require(currentFundsForCharity[_id] + msg.value > currentFundsForCharity[_id]);
		_; 
	}
	
	modifier hasMoneyforCharity(uint _id) {
		require(this.balance >= currentFundsForCharity[_id] && currentFundsForCharity[_id] > 0);
		_;
	}
	
	modifier isGivingMoney() {
	    require (msg.value > 0);
	    _;
	}

	function GoodHeart () public{
		owner = msg.sender;
	}

	function submitCharity(string _name, uint _totalFundsRequest) public returns(uint) {
		uint id = charities.push(Charity(msg.sender, _name, _totalFundsRequest * 1 ether, false));
		currentFundsForCharity[id] = 0;

		return id;
	}

	function giveMoneyForCharity(uint _charityId) public payable 
	         isGivingMoney 
	         needsMoreMoney(_charityId) 
	         checkCharityFundsOverflow(_charityId) {
	             
		Charity storage charity = charities[_charityId];
		uint remainingFunds = charity.totalFundsRequest - currentFundsForCharity[_charityId];

		if (msg.value >= remainingFunds) {
			charity.isFunded = true;
		}

		if (msg.value > remainingFunds) {
			currentFundsForCharity[_charityId] += remainingFunds;
			msg.sender.transfer(msg.value - remainingFunds);
		} else {
			currentFundsForCharity[_charityId] += msg.value;
		}

		if (charity.isFunded) {
			_grantMoneyToRepresenter(charities[_charityId].representative, _charityId);
		}
	}	

	function getAllCharities() public view returns(Charity[]) {
		return charities;
	}
	
	function () public {
	    revert();
	}

	function _grantMoneyToRepresenter(address _representative, uint _charityId) private hasMoneyforCharity(_charityId) {
	    uint fundsToTransfer = currentFundsForCharity[_charityId];
		currentFundsForCharity[_charityId] = 0;
		_representative.transfer(fundsToTransfer);
	}
}
