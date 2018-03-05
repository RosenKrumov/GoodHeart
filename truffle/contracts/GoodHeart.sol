pragma solidity ^0.4.19;

/**
 * The GoodHeart contract represents a charity organization.
 	Some users request funds for charity activities
 	Other users give money for charity to particular activity
 	Contract stores the money and grants to the requesters on portions,
 	depending on their contribution
 */

contract GoodHeart {
	uint8 constant PAGE_SIZE = 5; 


	struct Charity {
		address representative;
		string representativeName;
		string charityName;
		uint totalFundsRequest;
		bool isFunded;
	}

	address public owner;
	Charity[] public charities;
	mapping (uint => uint) public currentFundsForCharity;
	mapping (uint => uint) private approvedContributionsForCharity;
	mapping (uint => uint) private notApprovedContributionsForCharity;
	

	event CharityCreated(uint _id);
	event ContributionForApprovalAdded(uint _id);
	event ContributionApproved(uint _id);
	event CharityGranted(uint _id, uint _amount);
	event CharityFundsCollected(uint _id);
	

	modifier onlyOwner() {
		require(msg.sender == owner);	
		_;
	}

	modifier onlyRepresenter(uint _charityId) {
		require(msg.sender == charities[_charityId].representative);
		_;
	}

	modifier checkIfIsFunded(uint _id) {
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

	modifier charitySubmitDataCheck(string _name, string _representativeName, uint _totalFundsRequest) {
		require (keccak256(_name) != keccak256("") && 
				keccak256(_representativeName) != keccak256("") &&
				_totalFundsRequest != 0);
		_;
	}

	modifier checkIfCanTakeContributions(uint _charityId) {
		require(charities[_charityId].isFunded == true && currentFundsForCharity[_charityId] > 0);
		_;
	}

	modifier hasContributionsToApprove(uint _charityId) {
		require(notApprovedContributionsForCharity[_charityId] > 0);
		_;
	}

	function GoodHeart () public{
		owner = msg.sender;
	}

	function submitCharity(string _name, string _representativeName, uint _totalFundsRequest) public 
			charitySubmitDataCheck(_name, _representativeName, _totalFundsRequest) {
		uint id = charities.push(Charity(msg.sender, _representativeName, _name, _totalFundsRequest, false));
		currentFundsForCharity[id] = 0;
		approvedContributionsForCharity[id] = 0;
		notApprovedContributionsForCharity[id] = 0;

		CharityCreated(id);
	}

	function giveMoneyForCharity(uint _charityId) public payable 
	         isGivingMoney 
	         checkIfIsFunded(_charityId) 
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

		CharityGranted(_charityId, msg.value);

		if (charity.isFunded) {
			CharityFundsCollected(_charityId);
			approvedContributionsForCharity[_charityId]++;
			_grantMoneyToRepresenter(charities[_charityId].representative, _charityId);
		}
	}	

	function addContributionToCharity(uint _charityId) public 
			 onlyRepresenter(_charityId)
			 checkIfCanTakeContributions(_charityId) {
	 	require(notApprovedContributionsForCharity[_charityId] + 1 > notApprovedContributionsForCharity[_charityId]);
	 	notApprovedContributionsForCharity[_charityId]++;
	 	ContributionForApprovalAdded(_charityId);
	}

	function approveContributionToCharity(uint _charityId) public 
			 onlyOwner
			 checkIfCanTakeContributions(_charityId) 
			 hasContributionsToApprove(_charityId) {
	 	require(approvedContributionsForCharity[_charityId] + 1 > approvedContributionsForCharity[_charityId]);
	 	require(notApprovedContributionsForCharity[_charityId] - 1 < notApprovedContributionsForCharity[_charityId]);

		approvedContributionsForCharity[_charityId]++;
		notApprovedContributionsForCharity[_charityId]--;
		ContributionApproved(_charityId);
		_grantMoneyToRepresenter(charities[_charityId].representative, _charityId);
	}

	function getCharity(uint _index) public view returns(address, string, string, uint, bool, uint, uint) {
		require(charities.length > _index);
		Charity storage charity = charities[_index];
		uint totalFundsRequestInEther = charity.totalFundsRequest / 1 ether;
		uint currentCollectedFunds = currentFundsForCharity[_index] / 1 ether;
		return (charity.representative, charity.representativeName, charity.charityName, totalFundsRequestInEther, charity.isFunded, _index, currentCollectedFunds);
	}

	function getCharityIdByName(string _name) public view returns(uint, bool) {
		uint id = 0;
		bool found = false;
		
		for(uint i = 0; i < charities.length; i++) {
			if(keccak256(charities[i].charityName) == keccak256(_name)) {
				id = i;
				found = true;
			}
		}

		return (id, found);
	}

	function getCharitiesCount() public view returns(uint) {
		return charities.length;
	}

	function getCharityContributionsCount(uint _charityId) public view returns(uint) {
		return notApprovedContributionsForCharity[_charityId] + approvedContributionsForCharity[_charityId];
	}

	function getContractOwner() public view returns(address) {
		return owner;
	}
	
	function () public {
	    revert();
	}

	function _grantMoneyToRepresenter(address _representative, uint _charityId) private hasMoneyforCharity(_charityId) {
	    uint fundsToTransfer = (approvedContributionsForCharity[_charityId] * 10 * charities[_charityId].totalFundsRequest) / 100;
	    if(fundsToTransfer >= currentFundsForCharity[_charityId])
	    {
	    	fundsToTransfer = currentFundsForCharity[_charityId];
	    	currentFundsForCharity[_charityId] = 0;
	    } else {
	    	require(currentFundsForCharity[_charityId] - fundsToTransfer < currentFundsForCharity[_charityId]);
	    	currentFundsForCharity[_charityId] -= fundsToTransfer;
	    }

		_representative.transfer(fundsToTransfer);
	}
}