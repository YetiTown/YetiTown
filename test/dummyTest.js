const chai = require ('chai')
const {solidity} = require ('ethereum-waffle')
const {BigNumber} = require ('ethers')
const { artifacts, ethers } = require("hardhat");
describe("Deploying The Contract", async function () {
    let yeti, nft, frxst, proxy, alice, bob, rarity, vrf, treasury, proxyUpdate, logic;
    beforeEach("Setting Up The Test Suite", async function(){
        [alice, bob, treasury] = await ethers.getSigners()
        const Proxy = await ethers.getContractFactory("UnstructuredProxy")
        const NFT = await ethers.getContractFactory("testYetiTown")
        const Frxst = await ethers.getContractFactory("testFRXST")
        const timeStamp = await ethers.getContractFactory("TimestampVRF")
        const rs = await ethers.getContractFactory("rarityCheck")
        const gameLogic = await ethers.getContractFactory("testGameLogic")
        const gameLogicV2 = await ethers.getContractFactory("testGameLogicV2")
        proxy = await Proxy.deploy()
        nft = await NFT.deploy("YETI","YETI","YETI","YETI")
        frxst = await Frxst.deploy()
        vrf = await timeStamp.deploy(bob.address)
        rarity = await  rs.deploy()
        yeti = await gameLogic.deploy()
        logic = await gameLogicV2.deploy()

        await proxy.deployed()
        await logic.deployed()
        await nft.deployed()
        await frxst.deployed()
        await vrf.deployed()
        await rarity.deployed()
        await yeti.deployed()

        await nft.connect(alice).mint(2)
        await proxy.connect(alice).upgradeTo(yeti.address)
        const {abi:abiLogic} = await artifacts.readArtifact("testGameLogic")
        proxyUpdate = new ethers.Contract(proxy.address,abiLogic,ethers.getDefaultProvider())
        await proxyUpdate.connect(alice).initialize()
        await proxyUpdate.connect(alice).init(
            nft.address,
            frxst.address,
            treasury.address,
            rarity.address,
            vrf.address,
        )
        await proxyUpdate.connect(alice).SetMinimumClaimTime(10);
        await proxyUpdate.connect(alice).SetInjuryTime(10);
        await proxyUpdate.connect(alice).gatheringFRXSTRisk(50);
        await proxyUpdate.connect(alice).huntingInjuryRisk(500);
        await proxyUpdate.connect(alice).fightingStolenRisk(100);
        await proxyUpdate.connect(alice).SetGeneralTaxPercentage(10);
        await proxyUpdate.connect(alice).SetGatherTaxPercentage(50);
        await proxyUpdate.connect(alice).healCostSetter(ethers.utils.parseEther('500'));
        await proxyUpdate.connect(alice).SetLevelUpCostMultiplier(100);
        await proxyUpdate.connect(alice).setRewardCalculationDuration(10);
        await proxyUpdate.connect(alice).SetFrxstRates([
            [50, 60, 4],
            [90, 135, 10],
            [130, 195, 26]
        ]);
        await proxyUpdate.connect(alice).SetExpRates( [
            [80,100,120],
            [96,120,144],
            [120,150,180]
        ]);
        await proxyUpdate.connect(alice).setyetiMultiplier([100, 120, 150])
        await proxyUpdate.connect(alice).setlevelCost([0, 48, 210, 512, 980, 2100, 3430, 4760, 6379, 8313])
        await proxyUpdate.connect(alice).setLevelExp([0, 50, 200, 450, 800, 1600, 2450, 3200, 4050, 5000])
        await proxyUpdate.connect(alice).SetDesignatedSigner("0x2141fc90F4d8114e8778447d7c19b5992F6A0611")

       // await yeti.connect(alice).initialize()
       console.log("alice", alice.address)
       for (let i=0;i< 2;i++) {
             await nft.approve(proxyUpdate.address,await nft.tokenOfOwnerByIndex(alice.address,i))
        }
        console.log('Proxy address', proxyUpdate.address)
        console.log('Yeti address', yeti.address)

        await proxyUpdate.connect(alice).initiateGameAt([[46,1,"0x94f26eaf32b77a91659a5a24729b7b77bce695e9ca8c5d3b4f683ff54ffe498855e7e09e1c753ade95cbfd0f9701ed426818daa8321b0b36ddafc3ea752ceadf1c"]]);
        await proxyUpdate.connect(alice).initiateGameAt([[47,1,"0x0fb2ffebb76360a663f88eaffe729387ea6627cd8850eee714d46876fe0a5baa382e900065bcf806bd819b2f588b4be60b999f3dd69b2e7a2716fd7246a5c4001b"]]);
        await frxst.addController(proxyUpdate.address)
        await proxyUpdate.connect(alice).addManyToPalace(alice.address,[46,47],0)

        setTimeout(function () {
            console.log('The code went to sleep for', 10, 'seconds')
        }, 10);
        function timeout(ms) {
            return new Promise(resolve => setTimeout(resolve, ms));
        }
        await timeout(10*1000)
        await proxyUpdate.connect(alice).claimMany([46],true)
        console.log(await nft.balanceOf(proxyUpdate.address))
        console.log('The staked tokens are',await proxyUpdate.connect(alice).getStakedTokens(alice.address));
        await proxyUpdate.connect(alice).transferOwnership(bob.address)
        await proxy.connect(alice).transferProxyOwnership(bob.address)
        const proxyWithAlice = await proxy.connect(bob)
        await proxyWithAlice.upgradeTo(logic.address)
        const { abi: abiLogicV2 } = await artifacts.readArtifact("testGameLogicV2")
        proxyUpdate = new ethers.Contract(proxy.address, abiLogicV2, ethers.getDefaultProvider());
        console.log(await nft.balanceOf(proxyUpdate.address))
        console.log('Value:BOB ',await proxyUpdate.connect(bob).LEVEL_UP_COST_MULTIPLIER())
        await proxyUpdate.connect(bob).SetMinimumClaimTime(10);
        await proxyUpdate.connect(bob).SetInjuryTime(10);
        await proxyUpdate.connect(bob).gatheringFRXSTRisk(50);
        await proxyUpdate.connect(bob).huntingInjuryRisk(500);
        await proxyUpdate.connect(bob).fightingStolenRisk(100);
        await proxyUpdate.connect(bob).SetGeneralTaxPercentage(10);
        await proxyUpdate.connect(bob).SetGatherTaxPercentage(50);
        await proxyUpdate.connect(bob).healCostSetter(ethers.utils.parseEther('500'));
        await proxyUpdate.connect(bob).SetLevelUpCostMultiplier(100);
        console.log(await proxyUpdate.connect(bob).HEALING_COST())
        await proxyUpdate.connect(bob).SetFrxstRates([
            [50, 60, 4],
            [90, 135, 10],
            [130, 195, 26]
        ]);
        await proxyUpdate.connect(bob).SetExpRates([
            [80,100,120],
            [96,120,144],
            [120,150,180]
        ]);
        await proxyUpdate.connect(bob).setyetiMultiplier([100, 120, 150])
        await proxyUpdate.connect(bob).setlevelCost([0, 48, 210, 512, 980, 2100, 3430, 4760, 6379, 8313])
        await proxyUpdate.connect(bob).setLevelExp([0, 50, 200, 450, 800, 1600, 2450, 3200, 4050, 5000])
        await proxyUpdate.connect(bob).SetDesignatedSigner("0x2141fc90F4d8114e8778447d7c19b5992F6A0611")
        console.log('Address: ',await proxyUpdate.connect(bob).designatedSigner())
        await frxst.connect(alice).addController(alice.address);
        console.log(await nft.balanceOf(proxyUpdate.address))
        setTimeout(function () {
            console.log('The code went to sleep for', 10, 'seconds')
        }, 10);
        function timeout(ms) {
            return new Promise(resolve => setTimeout(resolve, ms));
        }
        await timeout(10*1000)
        await proxyUpdate.connect(alice).claimMany([46],true)
    });

    it ("Stake Test", async function(){
        await frxst.connect(alice).addController(alice.address);
        console.log(await nft.balanceOf(proxyUpdate.address))
        setTimeout(function () {
            console.log('The code went to sleep for', 10, 'seconds')
        }, 10);
        function timeout(ms) {
            return new Promise(resolve => setTimeout(resolve, ms));
        }
        await timeout(10*1000)
        await proxyUpdate.connect(bob).claimMany([46],true)
        console.log('Firxt Balance of Alice after claiming',await frxst.balanceOf(alice.address))
        console.log('Firxt Balance of Treasury after claiming',await frxst.balanceOf(treasury.address))
        console.log('Experience After 1 Day @ lvl1: ',await proxyUpdate.connect(alice).experience([46]))
        // await frxst.connect(alice).mint(alice.address,ethers.utils.parseEther('5'));
        // await proxyUpdate.connect(alice).levelup(46)
        // console.log('Firxt Balance of Alice after levelingUp 5 token was added as a gift',await frxst.balanceOf(alice.address))
        // console.log('Token Level: ',await proxyUpdate.connect(alice).levels([46]))
        // await nft.approve(proxyUpdate.address,46)
        // await proxyUpdate.connect(alice).addManyToPalace(alice.address,[46],0)
        // await timeout(10*1000)
        // await proxyUpdate.connect(alice).claimMany([46],false)
        // console.log('Firxt Balance of Alice after levelup and claim',await frxst.balanceOf(alice.address))
        // console.log('Firxt Balance of Treasury',await frxst.balanceOf(treasury.address))
        // console.log('Experience After 1 Day @ lvl2: ',await proxyUpdate.connect(alice).experience([46]))
    })
    //
    // it ('Claim From Harvesting Test', async function(){
    //     await proxyUpdate.connect(alice).addManyToPalace(alice.address,[46],0)
    //     setTimeout(function () {
    //         console.log('The code went to sleep for', 10, 'seconds')
    //     }, 10);
    //     function timeout(ms) {
    //         return new Promise(resolve => setTimeout(resolve, ms));
    //     }
    //     await timeout(10*1000)
    //     await proxyUpdate.connect(alice).claimMany([46],true)
    //     console.log('Firxt Balance of Alice after claiming',await frxst.balanceOf(alice.address))
    //     console.log('Firxt Balance of Treasury after claiming',await frxst.balanceOf(treasury.address))
    //     console.log('Experience After 1 Day @ lvl1: ',await proxyUpdate.experience([46]))
    //     await proxyUpdate.levelup(46)
    //     console.log('Token Level: ',await proxyUpdate.levels([46]))
    //     await nft.approve(proxyUpdate.address,46)
    //     await proxyUpdate.connect(alice).addManyToPalace(alice.address,[46],0)
    //     await timeout(10*1000)
    //     await proxyUpdate.connect(alice).claimMany([46],false)
    //     console.log('Firxt Balance of Alice after levelup and claim',await frxst.balanceOf(alice.address))
    //     console.log('Firxt Balance of Treasury',await frxst.balanceOf(treasury.address))
    //     console.log('Experience After 1 Day @ lvl2: ',await proxyUpdate.experience([46]))
    //     // await yeti.levelup(46)
    // })
    //
    // it ('Claim From Hunting Test', async function(){
    //     console.log('The signer is := ',await proxyUpdate.connect(alice).designatedSigner())
    //     await yeti.connect(alice).addManyToPalace(alice.address,[46],1)
    //     setTimeout(function () {
    //         console.log('The code went to sleep for', 10, 'seconds')
    //     }, 10);
    //     function timeout(ms) {
    //         return new Promise(resolve => setTimeout(resolve, ms));
    //     }
    //     await timeout(10*1000)
    //     await yeti.connect(alice).claimMany([46],true)
    //     console.log('Balance of Alice After first claim @ 1days',await frxst.balanceOf(alice.address))
    //     console.log('Balance of Treasury After claim @1 days',await frxst.balanceOf(treasury.address))
    //     console.log('Experience after claim @1 days',await yeti.experience([46]))
    //     await yeti.levelup(46)
    //     console.log('Balance of Alice After 1st level up',await frxst.balanceOf(alice.address))
    //     console.log('Level : ',await yeti.levels([46]))
    //     await nft.approve(yeti.address,46)
    //     await yeti.connect(alice).addManyToPalace(alice.address,[46],1)
    //     await timeout(10*1000)
    //     await yeti.connect(alice).claimMany([46],false)
    //     console.log('Balance Of Alice After Level UP and Claim @ 1 days',await frxst.balanceOf(alice.address))
    //     console.log('Balance Of Treasury after @ 1 days',await frxst.balanceOf(treasury.address))
    //     console.log('Experience Gathered At Level2 @ 1 days',await yeti.experience([46]))
    //     // await yeti.levelup(46)
    //     // console.log('Experience Gathered At Level3 @ 0 days',await yeti.experience([46]))
    //     // console.log('Level : ',await yeti.levels([46]))
    // })
    //
    // it ('Claim From Fighting Test', async function(){
    //     await yeti.connect(alice).addManyToPalace(alice.address,[46],2)
    //     setTimeout(function () {
    //         console.log('The code went to sleep for', 20, 'seconds')
    //     }, 20);
    //     function timeout(ms) {
    //         return new Promise(resolve => setTimeout(resolve, ms));
    //     }
    //     await timeout(20*1000)
    //     await yeti.connect(alice).claimMany([46],true)
    //     console.log('Balance of Alice After first claim @ 2days',await frxst.balanceOf(alice.address))
    //     console.log('Balance of Treasury After claim @2 days',await frxst.balanceOf(treasury.address))
    //     console.log('Experience after claim @2 days',await yeti.experience([46]))
    //     await yeti.levelup(46)
    //     console.log('Balance of Alice After 1st level up',await frxst.balanceOf(alice.address))
    //     console.log('Level : ',await yeti.levels([46]))
    //     await nft.approve(yeti.address,46)
    //     await yeti.connect(alice).addManyToPalace(alice.address,[46],2)
    //     await timeout(10*1000)
    //     await yeti.connect(alice).claimMany([46],false)
    //     console.log('Balance Of Alice After Level UP and Claim @ 1 days',await frxst.balanceOf(alice.address))
    //     console.log('Balance Of Treasury after @ 1 days',await frxst.balanceOf(treasury.address))
    //     console.log('Experience Gathered At Level2 @ 1 days',await yeti.experience([46]))
    //     // await yeti.levelup(46)
    //     // console.log('Experience Gathered At Level3 @ 0 days',await yeti.experience([46]))
    //     // console.log('Level : ',await yeti.levels([46]))
    // })

    // it ('Check Losing Honour', async function (){
    //         await yeti.connect(alice).addManyToPalace(alice.address,[46],2)
    //         setTimeout(function () {
    //             console.log('The code went to sleep for', 10, 'seconds')
    //         }, 10);
    //         function timeout(ms) {
    //             return new Promise(resolve => setTimeout(resolve, ms));
    //         }
    //         await timeout(10*1000)
    //         await yeti.connect(alice).claimMany([46],true)
    //         console.log('Balance of Alice After first claim @ 1days',await frxst.balanceOf(alice.address))
    //         console.log('Balance of Treasury After claim @1 days',await frxst.balanceOf(treasury.address))
    //         console.log('Experience after claim @1 days',await yeti.experience([46]))
    // })
    // it ('Check Injury Exp Half', async function (){
    //         await yeti.connect(alice).addManyToPalace(alice.address,[46],1)
    //         setTimeout(function () {
    //             console.log('The code went to sleep for', 10, 'seconds')
    //         }, 10);
    //         function timeout(ms) {
    //             return new Promise(resolve => setTimeout(resolve, ms));
    //         }
    //         await timeout(10*1000)
    //         await yeti.connect(alice).claimMany([46],true)
    //         console.log('Balance of Alice After first claim @ 1days',await frxst.balanceOf(alice.address))
    //         console.log('Balance of Treasury After claim @1 days',await frxst.balanceOf(treasury.address))
    //         console.log('Experience after claim @1 days',await yeti.experience([46]))
    // })

})