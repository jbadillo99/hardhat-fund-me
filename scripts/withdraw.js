const { ethers, getNamedAccounts } = require("hardhat")

const main = async () => {
    const { deployer } = getNamedAccounts()
    const fundMe = await ethers.getContract("FundMe", deployer)
    console.log("Funding...")
    const transactionResponse = await fundMe.withdraw()
    const transactionReceipt = await transactionResponse.wait()
    console.log("Got withdrawal")
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.log(`Error: ${error}`)
        process.exit(1)
    })
