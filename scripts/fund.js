const { getNamedAccounts, ethers } = require("hardhat")

const main = async () => {
    const { deployer } = await getNamedAccounts()

    const fundMe = await ethers.getContract("FundMe", deployer)
    console.log("Contract getting funded")
    const transactionResponse = await fundMe.fund({
        value: ethers.utils.parseEther("0.1"),
    })

    const transactionReceipt = await transactionResponse.wait(1)
    console.log("Funded contract!")
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.log(`Error: ${error}`)
        process.exit(1)
    })
