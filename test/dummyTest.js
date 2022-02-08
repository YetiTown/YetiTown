const { expect } = require("chai");
const { ethers } = require("hardhat");
const { BigNumber } = require("ethers");
const {BN,expectEvent,expectRevert} = require('@openzeppelin/test-helpers');
const {address} = require("hardhat/internal/core/config/config-validation");

describe("First Test", async function() {
    let yeti, frxst, town, rarity, vrf, owner, owner1;
    beforeEach("test initiator", async function () {
        [owner, owner1, owner2, owner3] = await ethers.getSigners();
        const gameLogic = await ethers.getContractFactory("testGameLogic");
        const rarityLogic = await ethers.getContractFactory("testRarityStorage");
        const yetiTownLogic = await ethers.getContractFactory("testYetiTown");
        const firxtLogic = await ethers.getContractFactory("testFRXST");
        const timestamp = await ethers.getContractFactory("TimestampVRF");
        vrf = await timestamp.deploy(owner.address)
        console.log("Vrf address:-", await vrf.address);
        frxst = await firxtLogic.deploy()
        town = await yetiTownLogic.deploy('YETI', "YT", 'https://dummyURI.com', 'https://dummyURI/notReveild.com')
        rarity = await rarityLogic.deploy()
        yeti = await gameLogic.deploy(await town.address, await frxst.address, owner1.address, await rarity.address, vrf.address)
        console.log("Game Logic address:-", await yeti.address);
        await town.connect(owner).mint(2)
        for (let i = 0; i < 2; i++) {
            await town.connect(owner).approve(yeti.address, await town.tokenOfOwnerByIndex(owner.address, i));
        }

        console.log(await yeti.getSignerStore());
        await yeti.connect(owner).initiateGameAt([[46, 2,
            "0x2ee6ab5f754c89c87653c4c934d2ffd19a324f9c3aacc1f68787ea0bfbd537a64fb04cc9ff9254c7acf915e28cece4844435827c82cdbab6946fec3f0fab08bd1b"]]);
        // await yeti.connect(owner).initiateGameAt([[47, 1,
        //     "0x6d034e7eecdbfc0c40929ff822a9048b1316e0e54aceca5b2850da011b81653a6b6a19bd5214925dc42a53cd38870fe1d3ee00f7ca23992a481055606421286f1b"]]);
    });

    // it ("Stake Test", async function(){
    //     await yeti.connect(owner).addManyToPalace(owner.address,[46],1)
    //     expect(await yeti.levels([46])).to.equal(1)
    //     // expect(await yeti.levels([47])).to.equal(1)
    // });
    //
    // it ("Unstake Test", async function() {
    //     await frxst.connect(owner).addController(yeti.address);
    //     await yeti.connect(owner).addManyToPalace(owner.address,[46],1)
    //     await expect(yeti.connect(owner).claimMany([46],true))
    //         .to.be.revertedWith('Need two days of Frxst before claiming');
    //     setTimeout(function () {
    //         console.log('The code went to sleep for', 10)
    //     }, 10);
    //     function timeout(ms) {
    //         return new Promise(resolve => setTimeout(resolve, ms));
    //     }
    //     await timeout(10*1000)
    //     expect(await town.ownerOf(46)).to.equal(yeti.address)
    //     const whatHappened = await yeti.connect(owner).claimMany([46],true)
    //     console.log(whatHappened)
    // });
    //
    // it("Setting up Noble", async function() {
    //     await frxst.connect(owner).addController(yeti.address);
    //     await yeti.connect(owner).addManyToPalace(owner.address,[46],2)
    //     setTimeout(function () {
    //         console.log('The code went to sleep for', 10, 'seconds')
    //     }, 10);
    //     function timeout(ms) {
    //         return new Promise(resolve => setTimeout(resolve, ms));
    //     }
    //     console.log("Sleeping For 10 seconds");
    //     await timeout(10*1000);
    //     await yeti.claimMany([46], false);
    //     console.log('The balance of owner after claiming 46',BigNumber.from(await frxst.balanceOf(owner.address)).toString());
    //     await timeout(10*1000);
    //     await yeti.claimMany([46], true);
    //     console.log(await yeti.levels([46]));
    //     console.log('The balance of owner after claiming 46',BigNumber.from(await frxst.balanceOf(owner.address)).toString());
    //     expect (await town.ownerOf(46)).to.equal(owner.address);
    // });
    // //
    // it('Checking Exp on Unstaking', async function(){
    //     await frxst.connect(owner).addController(yeti.address);
    //     await town.connect(owner).approve(yeti.address, 46);
    //     await yeti.connect(owner).addManyToPalace(owner.address,[46],2);
    //     console.log("here");
    //     expect(await town.ownerOf(46)).to.equal(yeti.address);
    //     console.log(await yeti.fighterArray([0]));
    //     setTimeout(function () {
    //         console.log('The code went to sleep for', 10, 'seconds')
    //     }, 10);
    //     function timeout(ms) {
    //         return new Promise(resolve => setTimeout(resolve, ms));
    //     }
    //     console.log("Sleeping For 10 seconds");
    //     await timeout(10*1000);
    //     await yeti.claimMany([46], true);
    // });
    //
    // it('After 2 days balance check of rarity 1',async function(){
    //     await frxst.connect(owner).addController(yeti.address);
    //     setTimeout(function () {
    //         console.log('The code went to sleep for', 10, 'seconds')
    //     }, 10);
    //     function timeout(ms) {
    //         return new Promise(resolve => setTimeout(resolve, ms));
    //     }
    //     await yeti.connect(owner).addManyToPalace(owner.address,[46],0)
    //     await expect(yeti.connect(owner).claimMany([46],true))
    //         .to.be.revertedWith('Need two days of Frxst before claiming');
    //     console.log("Sleeping For 10 seconds");
    //     await timeout(10*1000);
    //     await yeti.claimMany([46], false);
    //     expect (await frxst.balanceOf(owner.address)).to.equal(63);
    //     await timeout(10*1000);
    //     await yeti.claimMany([46],true);
    //     //(63+63/2)
    //     try{
    //         expect (await frxst.balanceOf(owner.address)).to.equal(101);
    //     }catch(error) {
    //         expect (await frxst.balanceOf(owner.address)).to.equal(126);
    //     }
    //     expect (await yeti.experience(46)).to.equal(4)
    //     await town.connect(owner).approve(yeti.address,46);
    //     await yeti.addManyToPalace(owner.address,[46],0)
    //     await timeout(10*1000);
    //     await yeti.claimMany([46], false);
    //     //expect (await frxst.balanceOf(owner.address)).to.equal(189);
    //     try{
    //         expect (await frxst.balanceOf(owner.address)).to.equal(164);
    //     }catch(error) {
    //         expect (await frxst.balanceOf(owner.address)).to.equal(189);
    //     }
    //     expect (await yeti.experience(46)).to.equal(4)
    // })
    //
    // it('Claim Successive 2 times', async function(){
    //     await frxst.connect(owner).addController(yeti.address);
    //     await yeti.connect(owner).addManyToPalace(owner.address,[46],0);
    //     setTimeout(function () {
    //         console.log('The code went to sleep for', 10, 'seconds')
    //     }, 10);
    //     function timeout(ms) {
    //         return new Promise(resolve => setTimeout(resolve, ms));
    //     }
    //     console.log("Sleeping For 10 seconds");
    //     await timeout(10*1000);
    //     await yeti.claimMany([46], false);
    //     console.log("Balance after 1st claim",await frxst.balanceOf(owner.address));
    //     await expect(yeti.connect(owner).claimMany([46],false))
    //         .to.be.revertedWith('Claiming before 1 day');
    // });
    //
    // it('Hunting and claiming FRXST without unstaking', async function(){
    //     await yeti.connect(owner).initiateGameAt([[46, 1, "0x64e257be7ce2ccd565f1d0cff2d46e285d969fbcb675d314be3d183098e02d2b303864537b2237228bdddb7cb7c715180dca4d4581eff06fc2607c23bb1fe78b1c"]]);
    //     await frxst.connect(owner).addController(yeti.address);
    //     await yeti.connect(owner).addManyToPalace(owner.address,[46],1);
    //     setTimeout(function () {
    //         console.log('The code went to sleep for', 10, 'seconds')
    //     }, 10);
    //     function timeout(ms) {
    //         return new Promise(resolve => setTimeout(resolve, ms));
    //     }
    //     console.log("Sleeping For 10 seconds");
    //     await timeout(10*1000);
    //     await timeout(10*1000);
    //     await yeti.connect(owner).claimMany([46], false);
    //     expect(await frxst.balanceOf(owner.address)).to.equal(324);
    // });
    //
    // it('Hunting and claiming FRXST and EXP by unstaking', async function(){
    //     await frxst.connect(owner).addController(yeti.address);
    //     await yeti.connect(owner).addManyToPalace(owner.address,[46],1);
    //     setTimeout(function () {
    //         console.log('The code went to sleep for', 10, 'seconds')
    //     }, 10);
    //     function timeout(ms) {
    //         return new Promise(resolve => setTimeout(resolve, ms));
    //     }
    //     console.log("Sleeping For 10 seconds");
    //     await timeout(10*1000);
    //     await timeout(10*1000);
    //     await yeti.connect(owner).claimMany([46], true);
    //     expect(await yeti.experience(46)).to.equal(6);
    // });
    // it('Fight Mode: EXP return and FRXST return', async function(){
    //     await frxst.connect(owner).addController(yeti.address);
    //     await yeti.connect(owner).addManyToPalace(owner.address,[47],2);
    //     setTimeout(function () {
    //         console.log('The code went to sleep for', 10, 'seconds')
    //     }, 10);
    //     function timeout(ms) {
    //         return new Promise(resolve => setTimeout(resolve, ms));
    //     }
    //     console.log("Sleeping For 10 seconds");
    //     await timeout(10*1000);
    //     await yeti.connect(owner).claimMany([47], false);//140
    //     await timeout(10*1000);
    //     await yeti.connect(owner).claimMany([47], true);//126
    //     console.log(await frxst.balanceOf(owner.address));//[140+126 = 266]
    //     console.log(await yeti.experience(47));
    // });
    //
    // it('level up', async function () {
    //     await frxst.connect(owner).addController(yeti.address);
    //     await yeti.connect(owner).addManyToPalace(owner.address, [47], 2);
    //     setTimeout(function () {
    //         console.log('The code went to sleep for', 10, 'seconds')
    //     }, 10);
    //
    //     function timeout(ms) {
    //         return new Promise(resolve => setTimeout(resolve, ms));
    //     }
    //
    //     await expect(yeti.connect(owner).claimMany([46, 47], true))
    //         .to.be.revertedWith('Need two days of Frxst before claiming');
    //     console.log("Sleeping For 10 seconds");
    //     await timeout(10 * 1000);
    //     console.log("Forced claim to cause injury")
    //     await yeti.claimMany([46, 47], true);
    //     console.log('Checking the hospital array where it should be 1')
    //     await frxst.connect(owner).approve(yeti.address, ethers.utils.parseEther('1000'))
    //     console.log('The balance of the owner is ', await frxst.balanceOf(owner.address))
    //     console.log('Coming to heal')
    //     await yeti.Heal(46);
    //     console.log('The balance of the owner after Heal ', await frxst.balanceOf(owner.address))
    //     await expect(yeti.connect(owner).claimMany([46], true))
    //         .to.be.revertedWith('Yeti is not staked and can therefore not be claimed.');
    //     await timeout(10 * 1000);
    //     expect(await town.ownerOf(46)).to.equal(owner.address)
    //     await yeti.ClaimSickYeti(47)
    //     expect(await town.ownerOf(47)).to.equal(owner.address)
    // });
    // it ('Hunt, Force injury followed by recovery in a tent and using Heal by giving FRXST Novels', async function(){
    //     await frxst.connect(owner).addController(yeti.address);
    //     await frxst.connect(owner).addController(owner.address);
    //     await yeti.connect(owner).initiateGameAt([[46, 1, "0x64e257be7ce2ccd565f1d0cff2d46e285d969fbcb675d314be3d183098e02d2b303864537b2237228bdddb7cb7c715180dca4d4581eff06fc2607c23bb1fe78b1c"]]);
    //     await yeti.connect(owner).initiateGameAt([[47, 1, "0x81968aa144fc3b40fb1f1d757077fe18a94554dfea46bc9f3803a8a695d9eec30cbcc8d04b8c114e11860ae7b6aaf07da1a2df3f63fa0b90226025cf5090e4be1c"]])
    //     await yeti.connect(owner).addManyToPalace(owner.address,[46,47],1);
    //     setTimeout(function () {
    //         console.log('The code went to sleep for', 10, 'seconds')
    //     }, 10);
    //     function timeout(ms) {
    //         return new Promise(resolve => setTimeout(resolve, ms));
    //     }
    //     await expect(yeti.connect(owner).claimMany([46,47],true))
    //         .to.be.revertedWith('Need two days of Frxst before claiming');
    //     console.log("Sleeping For 10 seconds");
    //     await timeout(10*1000);
    //     console.log('Checking the hospital array where it should be 0')
    //     console.log("Forced claim to cause injury")
    //     await yeti.claimMany([46,47],true);
    //     console.log('Checking the hospital array where it should be 1')
    //     console.log('The balance of the owner is ',await frxst.balanceOf(owner.address))
    //     // await frxst.mint(owner.address,ethers.utils.parseEther('500'));
    //     await frxst.connect(owner).approve(yeti.address, ethers.utils.parseEther('1000'))
    //     console.log('Coming to heal')
    //     await yeti.Heal(46);
    //     console.log('The balance of the owner after Heal ',await frxst.balanceOf(owner.address))
    //     await expect(yeti.connect(owner).claimMany([46], true))
    //         .to.be.revertedWith('Yeti is not staked and can therefore not be claimed.');
    //     await timeout(10*1000);
    //     expect(await town.ownerOf(46)).to.equal(owner.address)
    //     await yeti.ClaimSickYeti(47)
    //     expect(await town.ownerOf(47)).to.equal(owner.address)
    // });
    // it ('Hunt, Force injury followed by recovery in a tent and using Heal by giving FRXST deviant', async function(){
    //     await frxst.connect(owner).addController(yeti.address);
    //     await frxst.connect(owner).addController(owner.address);
    //     await yeti.connect(owner).initiateGameAt([[46, 0, "0xc35f193b050213d65d6c780569a351a9ba13f1e2fc569695b778abf2fbf67ff04f928e61ad46b72fd9f82e14d5ce20cd5bebd7357d902f812e9b6e5207f8293f1c"]]);
    //     await yeti.connect(owner).initiateGameAt([[47, 0, "0x6d034e7eecdbfc0c40929ff822a9048b1316e0e54aceca5b2850da011b81653a6b6a19bd5214925dc42a53cd38870fe1d3ee00f7ca23992a481055606421286f1b"]])
    //     await yeti.connect(owner).addManyToPalace(owner.address,[46,47],1);
    //     setTimeout(function () {
    //         console.log('The code went to sleep for', 10, 'seconds')
    //     }, 10);
    //     function timeout(ms) {
    //         return new Promise(resolve => setTimeout(resolve, ms));
    //     }
    //     await expect(yeti.connect(owner).claimMany([46,47],true))
    //         .to.be.revertedWith('Need two days of Frxst before claiming');
    //     console.log("Sleeping For 10 seconds");
    //     await timeout(10*1000);
    //     console.log("Forced claim to cause injury")
    //     await yeti.claimMany([46,47],true);
    //     console.log('Checking the hospital array where it should be 1')
    //     await frxst.connect(owner).approve(yeti.address, ethers.utils.parseEther('1000'))
    //     console.log('The balance of the owner is ',await frxst.balanceOf(owner.address))
    //     console.log('Coming to heal')
    //     await yeti.Heal(46);
    //     console.log('The balance of the owner after Heal ',await frxst.balanceOf(owner.address))
    //     await expect(yeti.connect(owner).claimMany([46], true))
    //         .to.be.revertedWith('Yeti is not staked and can therefore not be claimed.');
    //     await timeout(10*1000);
    //     expect(await town.ownerOf(46)).to.equal(owner.address)
    //     await yeti.ClaimSickYeti(47)
    //     expect(await town.ownerOf(47)).to.equal(owner.address)
    // });
    // it ('Hunt, Force injury followed by recovery in a tent and using Heal by giving FRXST eternal', async function(){
    //     await frxst.connect(owner).addController(yeti.address);
    //     await frxst.connect(owner).addController(owner.address);
    //     await yeti.connect(owner).initiateGameAt([[46, 2, "0x2ee6ab5f754c89c87653c4c934d2ffd19a324f9c3aacc1f68787ea0bfbd537a64fb04cc9ff9254c7acf915e28cece4844435827c82cdbab6946fec3f0fab08bd1b"]]);
    //     await yeti.connect(owner).initiateGameAt([[47, 2, "0xb06aa0ef7681b6d2a5ee51fba68dca198312b99ee6e640aad8f70578c4157a3270926df50a85927b632ced9081ab40c4b03bc6f2f323e2d52f2389dc341244281b"]])
    //     await yeti.connect(owner).addManyToPalace(owner.address,[46,47],1);
    //     setTimeout(function () {
    //         console.log('The code went to sleep for', 10, 'seconds')
    //     }, 10);
    //     function timeout(ms) {
    //         return new Promise(resolve => setTimeout(resolve, ms));
    //     }
    //     await expect(yeti.connect(owner).claimMany([46,47],true))
    //         .to.be.revertedWith('Need two days of Frxst before claiming');
    //     console.log("Sleeping For 10 seconds");
    //     await timeout(10*1000);
    //     console.log('Checking the hospital array where it should be 0')
    //     console.log("Forced claim to cause injury")
    //     await yeti.claimMany([46,47],true);
    //     console.log('The balance of the owner is ',await frxst.balanceOf(owner.address))
    //     console.log('Checking the hospital array where it should be 1')
    //     await frxst.connect(owner).approve(yeti.address, ethers.utils.parseEther('1000'))
    //     console.log('Coming to heal')
    //     await yeti.Heal(46);
    //     console.log('The balance of the owner after Heal ',await frxst.balanceOf(owner.address))
    //     await expect(yeti.connect(owner).claimMany([46], true))
    //         .to.be.revertedWith('Yeti is not staked and can therefore not be claimed.');
    //     await timeout(10*1000);
    //     expect(await town.ownerOf(46)).to.equal(owner.address)
    //     await yeti.ClaimSickYeti(47)
    //     expect(await town.ownerOf(47)).to.equal(owner.address)
    // });

    it('Leveling up traits', async function(){
        await frxst.connect(owner).addController(yeti.address);
        await yeti.connect(owner).addManyToPalace(owner.address, [46], 1);
        setTimeout(function () {
            console.log('The code went to sleep for', 10, 'seconds')
        }, 10);
        function timeout(ms) {
            return new Promise(resolve => setTimeout(resolve, ms));
        }
        console.log("Sleeping For another 10 seconds");
        await timeout(10*1000);
        // await frxst.connect(owner).addController(owner.address);
        // await frxst.connect(owner).mint(owner.address, ethers.utils.parseEther('60'));
        // await frxst.connect(owner).approve(yeti.address, ethers.utils.parseEther('500'));
        await yeti.claimMany([46], true);
        console.log(await frxst.balanceOf(owner.address)); // 240
        console.log(await yeti.experience(46)); // 10
        await yeti.connect(owner).levelup(46);
        console.log(await frxst.balanceOf(owner.address)); // 40
        console.log(await yeti.levels([46])); // lvl 2
        await town.connect(owner).approve(yeti.address, 46);
        await yeti.connect(owner).addManyToPalace(owner.address, [46], 1);
        await timeout(10*1000);
        await timeout(10*1000);
        await yeti.claimMany([46], true); // 264+264 = 528
        console.log(await yeti.experience(46)); //40
        console.log(await frxst.balanceOf(owner.address));
        // await yeti.connect(owner).levelup(46);
        // console.log(await frxst.balanceOf(owner.address));
        // console.log(await yeti.levels([46]));
        // console.log(await yeti.experience(46));
    });

    // it('Underflow test', async function(){
    //     await frxst.connect(owner).addController(yeti.address);
    //     await yeti.connect(owner).addManyToPalace(owner.address, [46], 2);
    //     setTimeout(function () {
    //         console.log('The code went to sleep for', 10, 'seconds')
    //     }, 10);
    //     function timeout(ms) {
    //         return new Promise(resolve => setTimeout(resolve, ms));
    //     }
    //     console.log("Sleeping For another 10 seconds");
    //     await timeout(10*1000);
    //     // await timeout(10*1000);
    //     await yeti.claimMany([46], true);
    //     await frxst.connect(owner).addController(owner.address);
    //     await frxst.connect(owner).mint(owner.address, ethers.utils.parseEther('100'));
    //     await frxst.connect(owner).approve(yeti.address, ethers.utils.parseEther('100'));
    //     console.log(await yeti.experience(46));
    //     await yeti.connect(owner).levelup(46);
    //     // console.log(await yeti.levels[46]);
    // });


});


