const { network, deployments, ethers, getNamedAccounts } = require("hardhat")
//const { ethers } = require("@nomiclabs/hardhat-ethers")
const { assert, expect } = require("chai")
const { developmentChains } = require("../../helper-hardhat-config")

!developmentChains.includes(network.name)
    ? describe.skip
    : describe("FundMe", async function () {
          let fundMe
          let deployer
          let mockV3Aggregator
          const sendValue = ethers.utils.parseEther("1")
          beforeEach(async () => {
              // deploy our fundMe contract
              // using Hardhat-deploy
              // const accounts = await ethers.getSigners()
              // const
              deployer = (await getNamedAccounts()).deployer
              await deployments.fixture(["all"])
              fundMe = await ethers.getContract("FundMe", deployer)
              mockV3Aggregator = await ethers.getContract(
                  "MockV3Aggregator",
                  deployer
              )
          })
          describe("constructor", async function () {
              it("Sets the aggregator addresses correctly", async function () {
                  const response = await fundMe.getPriceFeed()
              })
              assert.equal(response, mockV3Aggregator.address)
          })

          describe("fund", async function () {
              it("Fails if insufficient funds are sent", async function () {
                  await expect(fundMe.fund()).to.be.revertedWith(
                      "Insufficient Funds"
                  )
              })

              it("Updated the amount funded data structure", async function () {
                  await fundMe.fund({ value: sendValue })
                  const response = await fundMe.getAddressToAmountFunded(
                      deployer
                  )
                  assert.equal(response.toString(), sendValue.toString())
              })

              it("Return the index of the current funder", async function () {
                  await fundMe.fund({ value: sendValue })
                  const response = await fundMe.getFunder(0)
                  assert.equal(response.toString(), deployer.toString())
              })
          })

          describe("withdraw", async function () {
              beforeEach(async function () {
                  await fundMe.fund({ value: sendValue })
              })

              // Only checks withdraw for deployer
              it("Withdraws ETH from single funder: (Only testing deployer)", async function () {
                  // Deployer address should equal 0
                  await fundMe.withdraw()
                  const response = await fundMe.getAddressToAmountFunded(
                      deployer
                  )
                  const zero = "0"
                  assert.equal(response.toString(), zero.toString())
              })

              it("Withdraws withdraws ETH from all funders: (All funders balance should be 0)", async function () {
                  // Get balances of two transactions
                  const startFundMeBalance = await fundMe.provider.getBalance(
                      fundMe.address
                  )
                  const startDeployerBalance = await fundMe.provider.getBalance(
                      deployer
                  )

                  // Act
                  const txnResponse = await fundMe.withdraw()
                  const txnReceipt = await txnResponse.wait(1)

                  // Calculate gas cost
                  const { gasUsed, effectiveGasPrice } = txnReceipt
                  const gasCost = gasUsed.mul(effectiveGasPrice)

                  const endFundMeBalance = await fundMe.provider.getBalance(
                      fundMe.address
                  )
                  const endDeployerBalance = await fundMe.provider.getBalance(
                      deployer
                  )

                  // Assert
                  assert.equal(endFundMeBalance, 0)
                  assert.equal(
                      startFundMeBalance.add(startDeployerBalance).toString(),
                      endDeployerBalance.add(gasCost).toString()
                  )
              })

              it("Withdraw with multiple funders", async function () {
                  // Arrange
                  const accounts = await ethers.getSigners()
                  const numFunders = 6
                  for (let i = 1; i < numFunders; i++) {
                      const fundMeConnectedContract = await fundMe.connect(
                          accounts[i]
                      )
                      await fundMeConnectedContract.fund({ value: sendValue })
                  }
                  const startFundMeBalance = await fundMe.provider.getBalance(
                      fundMe.address
                  )
                  const startDeployerBalance = await fundMe.provider.getBalance(
                      deployer
                  )

                  // Act

                  const txnResponse = await fundMe.withdraw()
                  const txnReceipt = await txnResponse.wait()

                  const { gasUsed, effectiveGasPrice } = txnReceipt
                  const gasCost = gasUsed.mul(effectiveGasPrice)

                  const endFundMeBalance = await fundMe.provider.getBalance(
                      fundMe.address
                  )
                  const endDeployerBalance = await fundMe.provider.getBalance(
                      deployer
                  )

                  // Assert
                  assert.equal(endFundMeBalance, 0)
                  assert.equal(
                      startFundMeBalance.add(startDeployerBalance).toString(),
                      endDeployerBalance.add(gasCost).toString()
                  )

                  // Make sure the funders are reset properly
                  await expect(fundMe.getFunder(0)).to.be.reverted

                  for (i = 1; i < numFunders; i++) {
                      assert.equal(
                          await fundMe.getAddressToAmountFunded(
                              accounts[i].address
                          ),
                          0
                      )
                  }
              })

              it("Only owner can withdraw", async function () {
                  const accounts = await ethers.getSigners()
                  const attackerConnectedContract = await fundMe.connect(
                      accounts[1]
                  )
                  await expect(
                      attackerConnectedContract.withdraw()
                  ).to.be.revertedWithCustomError(fundMe, "FundMe__NotOwner")
              })
          })
          describe("cheapWithdraw", async function () {
              beforeEach(async function () {
                  await fundMe.fund({ value: sendValue })
              })

              // Only checks withdraw for deployer
              it("Withdraws ETH from single funder: (Only testing deployer)", async function () {
                  // Deployer address should equal 0
                  await fundMe.cheapWithdraw()
                  const response = await fundMe.getAddressToAmountFunded(
                      deployer
                  )
                  const zero = "0"
                  assert.equal(response.toString(), zero.toString())
              })

              it("Withdraws withdraws ETH from all funders: (All funders balance should be 0)", async function () {
                  // Get balances of two transactions
                  const startFundMeBalance = await fundMe.provider.getBalance(
                      fundMe.address
                  )
                  const startDeployerBalance = await fundMe.provider.getBalance(
                      deployer
                  )

                  // Act
                  const txnResponse = await fundMe.cheapWithdraw()
                  const txnReceipt = await txnResponse.wait(1)

                  // Calculate gas cost
                  const { gasUsed, effectiveGasPrice } = txnReceipt
                  const gasCost = gasUsed.mul(effectiveGasPrice)

                  const endFundMeBalance = await fundMe.provider.getBalance(
                      fundMe.address
                  )
                  const endDeployerBalance = await fundMe.provider.getBalance(
                      deployer
                  )

                  // Assert
                  assert.equal(endFundMeBalance, 0)
                  assert.equal(
                      startFundMeBalance.add(startDeployerBalance).toString(),
                      endDeployerBalance.add(gasCost).toString()
                  )
              })

              it("Withdraw with multiple funders", async function () {
                  // Arrange
                  const accounts = await ethers.getSigners()
                  const numFunders = 6
                  for (let i = 1; i < numFunders; i++) {
                      const fundMeConnectedContract = await fundMe.connect(
                          accounts[i]
                      )
                      await fundMeConnectedContract.fund({ value: sendValue })
                  }
                  const startFundMeBalance = await fundMe.provider.getBalance(
                      fundMe.address
                  )
                  const startDeployerBalance = await fundMe.provider.getBalance(
                      deployer
                  )

                  // Act

                  const txnResponse = await fundMe.cheapWithdraw()
                  const txnReceipt = await txnResponse.wait()

                  const { gasUsed, effectiveGasPrice } = txnReceipt
                  const gasCost = gasUsed.mul(effectiveGasPrice)

                  const endFundMeBalance = await fundMe.provider.getBalance(
                      fundMe.address
                  )
                  const endDeployerBalance = await fundMe.provider.getBalance(
                      deployer
                  )

                  // Assert
                  assert.equal(endFundMeBalance, 0)
                  assert.equal(
                      startFundMeBalance.add(startDeployerBalance).toString(),
                      endDeployerBalance.add(gasCost).toString()
                  )

                  // Make sure the funders are reset properly
                  await expect(fundMe.getFunder(0)).to.be.reverted

                  for (i = 1; i < numFunders; i++) {
                      assert.equal(
                          await fundMe.getAddressToAmountFunded(
                              accounts[i].address
                          ),
                          0
                      )
                  }
              })

              it("Only owner can withdraw", async function () {
                  const accounts = await ethers.getSigners()
                  const attackerConnectedContract = await fundMe.connect(
                      accounts[1]
                  )
                  await expect(
                      attackerConnectedContract.cheapWithdraw()
                  ).to.be.revertedWithCustomError(fundMe, "FundMe__NotOwner")
              })
          })
      })
