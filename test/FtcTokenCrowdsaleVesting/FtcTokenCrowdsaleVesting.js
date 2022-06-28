import { assert } from 'chai';
import ether from './utils/ether';
const truffleAssert = require('truffle-assertions')
const { BN } = require('@openzeppelin/test-helpers');
import EVMRevert from './utils/EVMRevert';

const {
    assertEvent, increaseTime, now, advanceBlock,
} = require('./utils/helpers');

require('chai')
    .use(require('chai-as-promised'))
    .should();


const ERC20Token = artifacts.require('FtcToken.sol');
const FtcTokenCrowdsale = artifacts.require('FtcTokenCrowdsale');

contract('FtcTokenCrowdsaleVesting', (accounts) => {
    const owner = accounts[0];
    const wallet = accounts[1];
    const nextype = accounts[2];
    const VC1 = accounts[3];
    const VC2 = accounts[4];
    const newOwner = accounts[5];
    const beneficiary1 = accounts[6];
    const beneficiary2 = accounts[7];
    const beneficiary5 = accounts[10];
    const beneficiary6 = accounts[11];
    const zeroAddress = '0x0000000000000000000000000000000000000000';

    const oneHour = 3600;
    const oneDay = 86400;
    const oneWeek = oneDay * 7;
    const oneMonth = oneDay * 30;

    let crowdsale;
    let token;
    let start;

    let investorMinCap = ether("0.2");
    let inestorHardCap = ether("5");

    let preIcoStage = 0;
    let icoStage = 1;
    let postIcoStage = 2;

    before(async () => {
        await advanceBlock();
    });

    beforeEach(async () => {
        start = await now();
        token = await ERC20Token.new("Forgotten Coin", "FTC", 18, 1000000000, {from: owner});

        crowdsale = await FtcTokenCrowdsale.new(
          wallet,
          token.address,
          nextype
        );

        const totalOwnerSupply = await token.balanceOf(owner)

        await token.transfer(crowdsale.address, totalOwnerSupply,  { from: owner });

        await token.transferOwnership(crowdsale.address);

        //set BNB/USD price manually for testing because ganache can't interact with ChainLink Aggregator Interface
        await crowdsale.setOwnerPrice(450, {from: owner});

    });

    describe('#VestedFunds-GET-TOTAL', async () => {
        
        it('returns the same amount vested funds for NEXTYPE1 as for getting the funds at the final duration - 50%', async () => {
            await crowdsale.setNextypePercent(50);
            await crowdsale.initNextypeVesting();
            
            await increaseTime(oneDay * 150);

            const nextype1 = await crowdsale.getNEXTYPEVestedFunds1();
            assert.ok(nextype1 == 2500000000000000000000000);
        });

        it('returns the same amount vested funds for NEXTYPE2 as for getting the funds at the final duration - 50%', async () => {
            await crowdsale.setNextypePercent(50);
            await crowdsale.initNextypeVesting();
            
            await increaseTime(oneDay * 350); 

            const nextype2 = await crowdsale.getNEXTYPEVestedFunds2();
            assert.ok(nextype2 == 22500000000000000000000000);
        });

        it('returns the same amount vested funds for NEXTYPE1 as for getting the funds at the final duration - 100%', async () => {
            await crowdsale.initNextypeVesting();
            
            await increaseTime(oneDay * 150);

            const nextype1 = await crowdsale.getNEXTYPEVestedFunds1();
            assert.ok(nextype1 == 5000000000000000000000000);
        });

        it('returns the same amount vested funds for NEXTYPE2 as for getting the funds at the final duration - 100%', async () => {
            await crowdsale.initNextypeVesting();
            
            await increaseTime(oneDay * 350); 

            const nextype2 = await crowdsale.getNEXTYPEVestedFunds2();
            assert.ok(nextype2 == 45000000000000000000000000);
        });
        
        // it('returns the same amount vested funds for a given VC as for getting the funds at the final duration', async () => {
            
        //     await crowdsale.addVC(VC1, '20000000000000000000000000');
        //     await crowdsale.addVC(VC2, '30000000000000000000000000');

        //     await crowdsale.initVCVesting();
            
        //     await increaseTime(oneDay * 420);

        //     const funds1 = await crowdsale.getVCVestedFunds(VC1);
        //     assert.ok(funds1 == 20000000000000000000000000);

        //     const funds2 = await crowdsale.getVCVestedFunds(VC2);
        //     assert.ok(funds2 == 30000000000000000000000000);
        // });

        it('returns the same amount vested funds for a given beneficiary as for getting the funds at the final duration', async () => {
            const value = ether('1');
            const value2 = ether('2');
            await crowdsale.buyTokens(beneficiary1, { from: beneficiary1, value: value }).should.be.fulfilled;
            await crowdsale.buyTokens(beneficiary2, { from: beneficiary2, value: value2 }).should.be.fulfilled;

            await crowdsale.incrementCrowdsaleStage(icoStage, { from: owner });
            await crowdsale.incrementCrowdsaleStage(postIcoStage, { from: owner });

            await crowdsale.distributeTokens({from: owner}).should.be.fulfilled;

            await increaseTime(oneDay * 300);

            const funds1 = await crowdsale.getTokenSaleVestedFunds(beneficiary1);
            assert.ok(funds1 == 40500000000000000000000);

            const funds2 = await crowdsale.getTokenSaleVestedFunds(beneficiary2);
            assert.ok(funds2 == 81000000000000000000000);
        });

        it('returns the same amount vested funds for foundation1 as for getting the funds at the final duration', async () => {
            const value = ether('1');
            await crowdsale.buyTokens(beneficiary1, { from: beneficiary1, value: value }).should.be.fulfilled;

            await crowdsale.incrementCrowdsaleStage(icoStage, { from: owner });
            await crowdsale.incrementCrowdsaleStage(postIcoStage, { from: owner });

            await crowdsale.distributeTokens({from: owner}).should.be.fulfilled;

            await increaseTime(oneDay * 150);

            const funds = await crowdsale.getFoundationVestedFunds1();
            assert.ok(funds == 10000000000000000000000000);
        });

        it('returns the same amount vested funds for foundation2 as for getting the funds at the final duration', async () => {
          const value = ether('1');
          await crowdsale.buyTokens(beneficiary1, { from: beneficiary1, value: value }).should.be.fulfilled;

          await crowdsale.incrementCrowdsaleStage(icoStage, { from: owner });
          await crowdsale.incrementCrowdsaleStage(postIcoStage, { from: owner });

          await crowdsale.distributeTokens({from: owner}).should.be.fulfilled;

          await increaseTime(oneDay * 350); //FOUNDATION 1 DURATION + 1

          const funds = await crowdsale.getFoundationVestedFunds2();
          assert.ok(funds == 90000000000000000000000000);
        });

        it('returns the same amount vested funds for game as for getting the funds at the final duration', async () => {
            const value = ether('1');
            await crowdsale.buyTokens(beneficiary1, { from: beneficiary1, value: value }).should.be.fulfilled;

            await crowdsale.incrementCrowdsaleStage(icoStage, { from: owner });
            await crowdsale.incrementCrowdsaleStage(postIcoStage, { from: owner });

            await crowdsale.distributeTokens({from: owner}).should.be.fulfilled;

            await increaseTime(oneDay * 1228);

            const funds = await crowdsale.getGameVestedFunds();
            assert.ok(funds == 650000000000000000000000000);
        });
    });

    describe('#VestedFunds-RELEASE', async () => {

        it('returns the same amount vested funds for NEXTYPE1 after FUNDS RELEASE - 50% half period', async () => {
            await crowdsale.setNextypePercent(50);
            await crowdsale.initNextypeVesting();
            
            await increaseTime(oneDay * 150);

            await crowdsale.releaseNEXTYPEVestedFunds1();
            
            let nextype_balance = await token.balanceOf(nextype);
            assert.ok(nextype_balance >= 1250000000000000000000000);
        });

        it('returns the same amount vested funds for NEXTYPE1 after FUNDS RELEASE - 50% all period', async () => {
            await crowdsale.setNextypePercent(50);
            await crowdsale.initNextypeVesting();
            
            await increaseTime(oneDay * 300);

            await crowdsale.releaseNEXTYPEVestedFunds1();

            let nextype_balance = await token.balanceOf(nextype);
            assert.ok(nextype_balance == 2500000000000000000000000);
        });

        it('returns the same amount vested funds for NEXTYPE1 after FUNDS RELEASE - 100% half period', async () => {
            await crowdsale.initNextypeVesting();
            
            await increaseTime(oneDay * 150);

            await crowdsale.releaseNEXTYPEVestedFunds1();

            let nextype_balance = await token.balanceOf(nextype);
            // '25000000000000000000000000'.should.be.bignumber.lessThan(nextype_balance);
            assert.ok(nextype_balance >= 2500000000000000000000000);
        });

        it('returns the same amount vested funds for NEXTYPE1 after FUNDS RELEASE - 100% all period', async () => {

            await crowdsale.initNextypeVesting();
            
            await increaseTime(oneDay * 300);

            await crowdsale.releaseNEXTYPEVestedFunds1();

            let nextype_balance = await token.balanceOf(nextype);
            assert.ok(nextype_balance == 5000000000000000000000000);
        });

        it('returns the same amount vested funds for NEXTYPE2 after FUNDS RELEASE - 50% half period', async () => {
            await crowdsale.setNextypePercent(50);
            await crowdsale.initNextypeVesting();
            
            //300 + 270 + 1
            await increaseTime(oneDay * 571);

            await crowdsale.releaseNEXTYPEVestedFunds2();
            
            let nextype_balance = await token.balanceOf(nextype);
            assert.ok(nextype_balance >= 11250000000000000000000000);
        });

        it('returns the same amount vested funds for NEXTYPE2 after FUNDS RELEASE - 50% all period', async () => {
            await crowdsale.setNextypePercent(50);
            await crowdsale.initNextypeVesting();
            
            await increaseTime(oneDay * 841);

            await crowdsale.releaseNEXTYPEVestedFunds2();

            let nextype_balance = await token.balanceOf(nextype);
            assert.ok(nextype_balance == 22500000000000000000000000);
        });

        it('returns the same amount vested funds for NEXTYPE2 after FUNDS RELEASE - 100% half period', async () => {
            await crowdsale.initNextypeVesting();

             //300 + 270 + 1
            await increaseTime(oneDay * 571);

            await crowdsale.releaseNEXTYPEVestedFunds2();

            let nextype_balance = await token.balanceOf(nextype);
            // '25000000000000000000000000'.should.be.bignumber.lessThan(nextype_balance);
            assert.ok(nextype_balance >= 22500000000000000000000000);
        });

        it('returns the same amount vested funds for NEXTYPE2 after FUNDS RELEASE - 100% all period', async () => {

            await crowdsale.initNextypeVesting();
            
            await increaseTime(oneDay * 841);

            await crowdsale.releaseNEXTYPEVestedFunds2();

            let nextype_balance = await token.balanceOf(nextype);
            assert.ok(nextype_balance == 45000000000000000000000000);
        });
        
        // it('returns the same amount vested funds for a given VC after FUNDS RELEASE - half period', async () => {

        //     await crowdsale.addVC(VC1, '20000000000000000000000000');
        //     await crowdsale.addVC(VC2, '30000000000000000000000000');

        //     await crowdsale.initVCVesting();
            
        //     await increaseTime(oneDay * 420);
        //     await crowdsale.releaseVCVestedFunds(VC1);
        //     await crowdsale.releaseVCVestedFunds(VC2);


        //     let VC1_balance = await token.balanceOf(VC1);
        //     assert.ok(VC1_balance >= 10000000000000000000000000);

        //     let VC2_balance = await token.balanceOf(VC2);
        //     assert.ok(VC2_balance >= 15000000000000000000000000);
        // });

        
        // it('returns the same amount vested funds for a given VC after FUNDS RELEASE - all period', async () => {

        //     await crowdsale.addVC(VC1, '20000000000000000000000000');
        //     await crowdsale.addVC(VC2, '30000000000000000000000000');

        //     await crowdsale.initVCVesting();
            
        //     await increaseTime(oneDay * 840);
        //     await crowdsale.releaseVCVestedFunds(VC1);
        //     await crowdsale.releaseVCVestedFunds(VC2);

        //     let VC1_balance = await token.balanceOf(VC1);
        //     assert.ok(VC1_balance == 20000000000000000000000000);

        //     let VC2_balance = await token.balanceOf(VC2);
        //     assert.ok(VC2_balance == 30000000000000000000000000);
        // });

        it('returns correct vested funds for a given beneficiary after FUNDS RELEASE - half period', async () => {
            const value = ether('1');
            const value2 = ether('2');
            await crowdsale.buyTokens(beneficiary1, { from: beneficiary1, value: value }).should.be.fulfilled;
            await crowdsale.buyTokens(beneficiary2, { from: beneficiary2, value: value2 }).should.be.fulfilled;

            await crowdsale.incrementCrowdsaleStage(icoStage, { from: owner });
            await crowdsale.incrementCrowdsaleStage(postIcoStage, { from: owner });

            await crowdsale.distributeTokens({from: owner}).should.be.fulfilled;

            await increaseTime(oneDay * 225);

            //beneficiary1
            let vestedFunds1 = await crowdsale.getTokenSaleVestedFunds(beneficiary1);

            //10% of FTC total vesting already transfered at TGE
            vestedFunds1.should.be.bignumber.equal('40500000000000000000000');
            let funds1 = web3.utils.fromWei(vestedFunds1, 'ether');

            await crowdsale.releaseTokenSaleVestedFunds(beneficiary1);
            let beneficiaryBalanceFunds1 = await token.balanceOf(beneficiary1);
            // 40500 / 2 + 10% of vestedFunds1 (4500 * 1e18)
            // + a few moments in time
             
            '24750000000000000000000'.should.be.bignumber.lessThan(beneficiaryBalanceFunds1);

            //beneficiary2
            let vestedFunds2 = await crowdsale.getTokenSaleVestedFunds(beneficiary2);
            vestedFunds2.should.be.bignumber.equal('81000000000000000000000');
            let funds2 = web3.utils.fromWei(vestedFunds2, 'ether');

            await crowdsale.releaseTokenSaleVestedFunds(beneficiary2);
            // 81000 / 2 + 10% of vestedFunds1 (9000 * 1e18)
            // + a few moments in time
            let beneficiaryBalanceFunds2 = await token.balanceOf(beneficiary2);
            '49500000000000000000000'.should.be.bignumber.lessThan(beneficiaryBalanceFunds2);
        });

        it('returns correct vested funds for a given beneficiary after FUNDS RELEASE - all period', async () => {
            const value = ether('1');
            const value2 = ether('2');
            await crowdsale.buyTokens(beneficiary1, { from: beneficiary1, value: value }).should.be.fulfilled;
            await crowdsale.buyTokens(beneficiary2, { from: beneficiary2, value: value2 }).should.be.fulfilled;

            await crowdsale.incrementCrowdsaleStage(icoStage, { from: owner });
            await crowdsale.incrementCrowdsaleStage(postIcoStage, { from: owner });

            await crowdsale.distributeTokens({from: owner}).should.be.fulfilled;

            await increaseTime(oneDay * 450);

            //beneficiary1
            let vestedFunds1 = await crowdsale.getTokenSaleVestedFunds(beneficiary1);

            //10% of FTC total vesting already transfered at TGE
            vestedFunds1.should.be.bignumber.equal('40500000000000000000000');
            let funds1 = web3.utils.fromWei(vestedFunds1, 'ether');

            await crowdsale.releaseTokenSaleVestedFunds(beneficiary1);
            let beneficiaryBalanceFunds1 = await token.balanceOf(beneficiary1);
            assert.ok(beneficiaryBalanceFunds1 == 45000000000000000000000);

            //beneficiary2
            let vestedFunds2 = await crowdsale.getTokenSaleVestedFunds(beneficiary2);
            vestedFunds2.should.be.bignumber.equal('81000000000000000000000');
            let funds2 = web3.utils.fromWei(vestedFunds2, 'ether');

            await crowdsale.releaseTokenSaleVestedFunds(beneficiary2);
            let beneficiaryBalanceFunds2 = await token.balanceOf(beneficiary2);
            assert.ok(beneficiaryBalanceFunds2 == 90000000000000000000000);
        });

        it('returns correct vested funds for foundation1 after FUNDS RELEASE - half period', async () => {
            const value = ether('1');
            await crowdsale.buyTokens(beneficiary1, { from: beneficiary1, value: value }).should.be.fulfilled;

            await crowdsale.incrementCrowdsaleStage(icoStage, { from: owner });
            await crowdsale.incrementCrowdsaleStage(postIcoStage, { from: owner });

            await crowdsale.distributeTokens({from: owner}).should.be.fulfilled;

            await increaseTime(oneDay * 150);

            let vestedFunds = await crowdsale.getFoundationVestedFunds1();
            vestedFunds.should.be.bignumber.equal('10000000000000000000000000');

            await crowdsale.releaseFoundationVestedFunds1();
            let foundationBalanceFunds = await token.balanceOf(wallet);
            
            //+5000000000000000000000000 + liquidityAndMarketingShare (50000000000000000000000000);
             '55000000000000000000000000'.should.be.bignumber.lessThan(foundationBalanceFunds);
        });
        
        it('returns correct vested funds for foundation1 after FUNDS RELEASE - all period', async () => {
            const value = ether('1');
            await crowdsale.buyTokens(beneficiary1, { from: beneficiary1, value: value }).should.be.fulfilled;

            await crowdsale.incrementCrowdsaleStage(icoStage, { from: owner });
            await crowdsale.incrementCrowdsaleStage(postIcoStage, { from: owner });

            await crowdsale.distributeTokens({from: owner}).should.be.fulfilled;

            await increaseTime(oneDay * 300);

            let vestedFunds = await crowdsale.getFoundationVestedFunds1();
            vestedFunds.should.be.bignumber.equal('10000000000000000000000000');

            await crowdsale.releaseFoundationVestedFunds1();
            let foundationBalanceFunds = await token.balanceOf(wallet);
            assert.ok(foundationBalanceFunds == 60000000000000000000000000);
        });

        it('returns correct vested funds for foundation2 after FUNDS RELEASE - half period', async () => {
          const value = ether('1');
          await crowdsale.buyTokens(beneficiary1, { from: beneficiary1, value: value }).should.be.fulfilled;

          await crowdsale.incrementCrowdsaleStage(icoStage, { from: owner });
          await crowdsale.incrementCrowdsaleStage(postIcoStage, { from: owner });

          await crowdsale.distributeTokens({from: owner}).should.be.fulfilled;

          //300 foundation 1 duration + half foundation 2 (540 / 2 = 270)  + 1 day
          await increaseTime(oneDay * 571);
          
          let vestedFunds = await crowdsale.getFoundationVestedFunds2();
          vestedFunds.should.be.bignumber.equal('90000000000000000000000000');
          
          await crowdsale.releaseFoundationVestedFunds2();
          let foundationBalanceFunds = await token.balanceOf(wallet);
          
          //+45000000000000000000000000 + liquidityAndMarketingShare (50000000000000000000000000);
           '95000000000000000000000000'.should.be.bignumber.lessThan(foundationBalanceFunds);
        });

        it('returns correct vested funds for foundation2 after FUNDS RELEASE - all period', async () => {
            const value = ether('1');
            await crowdsale.buyTokens(beneficiary1, { from: beneficiary1, value: value }).should.be.fulfilled;
  
            await crowdsale.incrementCrowdsaleStage(icoStage, { from: owner });
            await crowdsale.incrementCrowdsaleStage(postIcoStage, { from: owner });
  
            await crowdsale.distributeTokens({from: owner}).should.be.fulfilled;
  
            //300 foundation 1 duration + foundation 2 + 1 day = 300 + 540 + 1 day
            await increaseTime(oneDay * 841);
            
            let vestedFunds = await crowdsale.getFoundationVestedFunds2();
            vestedFunds.should.be.bignumber.equal('90000000000000000000000000');
            
            await crowdsale.releaseFoundationVestedFunds2();
            let foundationBalanceFunds = await token.balanceOf(wallet);
            assert.ok(foundationBalanceFunds == 140000000000000000000000000);
        });

        it('returns correct vested funds for game after FUNDS RELEASE', async () => {
            const value = ether('1');
            await crowdsale.buyTokens(beneficiary1, { from: beneficiary1, value: value }).should.be.fulfilled;

            await crowdsale.incrementCrowdsaleStage(icoStage, { from: owner });
            await crowdsale.incrementCrowdsaleStage(postIcoStage, { from: owner });

            await crowdsale.distributeTokens({from: owner}).should.be.fulfilled;

            await increaseTime(oneDay * 2555);

            let vestedFunds = await crowdsale.getGameVestedFunds();
            vestedFunds.should.be.bignumber.equal('650000000000000000000000000');
            let funds = web3.utils.fromWei(vestedFunds, 'ether');

            await crowdsale.releaseGameVestedFunds();
            let gameBalanceFunds = await token.balanceOf(wallet);
            gameBalanceFunds.should.be.bignumber.equal('700000000000000000000000000');
         
        });
    });
});
