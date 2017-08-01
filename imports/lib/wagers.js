import { registrar } from './ethereum';


export function retrievePendingWagers(callback) {
  // console.log("retrievePendingWagers");

  let pendingWagers = PendingWagers.find({}, {sort: {"date": -1}}).fetch();
  let blockchainWagers = [];

  // pendingWagers.forEach(pendingWager => {
  //
  //   registrar.contract.wagers.call(pendingWagers.shaWager, (err, result) => {
  //     if (!err && result !== '0x0000000000000000000000000000000000000000') {
  //
  //       var wager = {
  //         // "createdAt": result[0],
  //         // "shaDeposit": result[1],
  //         // "amount": result[2],
  //         // "funder": result[3]
  //       }
  //
  //       blockchainWagers.push(wager);
  //     }
  //   });
  // });

  callback(pendingWagers);
}
