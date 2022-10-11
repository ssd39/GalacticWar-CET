let galacticWarContract;
const gwContractAddress = "0xdf7c5d154bA1E7ae19f73ef62935367b22d4D382";

async function load() {
  let jsonFile = await fetch('/blockchain/MainGame.json')
  let abi = (await jsonFile.json()).abi;
  galacticWarContract = await new window.web3.eth.Contract(abi, gwContractAddress);
}

window.connect = async function () {

  if (typeof window.ethereum == 'undefined') {
    alert("Please install metamask")
  }
  const accounts = await window.ethereum.request({
    method: 'eth_requestAccounts'
  });
  window.web3 = new Web3(ethereum);
  window.accounts = accounts[0];
  await load();

  myGameInstance.SendMessage("RTS_Camera", "onConnect");
  window.userdata()
};

window.openMarketPlace = () => {
  window.open("https://assets-market.galacticwar.live/");
};

window.startgame = async function () {
  await gwContractAddress.methods.startgame().send({
    from: window.accounts
  })
  myGameInstance.SendMessage('RTS_Camera', 'onDone');
};

let graphkey = {
  0: "townhall",
  1: "miner",
  2: "cannon",
  3: "xbow",
  4: "tesla",
  5: "archer",
  6: "robot",
  7: "valkyriee",
};
const keys = Object.keys(graphkey);
keys.forEach((item, i) => {
  window[graphkey[item]] = 0;
});

window.collectwin = async function (buildingamount) {
  setTimeout(async () => {
    if (buildingamount <= 0) {
      myGameInstance.SendMessage("Button_AD", "showData");
      return
    }
    await galacticWarContract.methods.endwar(buildingamount).send({
      from: window.accounts
    });
    myGameInstance.SendMessage("Button_AD", "showData");
  }, 6500)
};

window.savegame = async function (str) {
  await fetch('https://galacticwar.herokuapp.com/save', {
    method: 'POST',
    headers:{
      'Content-Type': 'application/json'
    },
    body: str
  })
  myGameInstance.SendMessage("syncButton", "onSave");
};

window.fetchWar = async function () {
  let building_data = await (await fetch(`https://galacticwar.herokuapp.com/random/${window.accounts}`)).json()
  myGameInstance.SendMessage("WarManager", "onWarData", JSON.stringify(building_data));
}

window.userdata = async function () {

  let query = `query($id: String!) {
    user(id:$id){
        nfts{
          id
          owner {
            id
          }
          locked
          amount
          nft{
            id
            nftid
          }
 
        }
        aureus
        minerid {
          id
          locked
        }
        townhall
      }
  }`
  let variables = {
    id: window.accounts
  }

  let data = await (await fetch('https://graph.galacticwar.live:8080/subgraphs/name/dwij/rtsgame', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      query: query,
      variables: variables
    })
  })).json()

  if (data.user == null || data.user.townhall == null) {
    myGameInstance.SendMessage('RTS_Camera', 'onNewUser');
  } else {
    if (windata.user.minerid != null) {
      if (data.user.minerid.locked == false) {
        window.miner = 1;
      }
    }
    window.aureus = data.user.aureus
    for (let i = 0; i < data.user.nfts.length; i++) {
      window[graphkey[parseInt(data.user.nfts[i].nft.id)]] = parseInt(data.user.nfts[i].amount) - parseInt(data.user.nfts[i].locked)
    }

    let building_data = await (await fetch(`https://galacticwar.herokuapp.com/${window.accounts}`)).json()
    window.building_data = building_data
    myGameInstance.SendMessage("RTS_Camera", "onDone");
  }  
};