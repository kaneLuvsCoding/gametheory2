export function resolveMarket(players, submissions, options) {
  let { totalDemand = 200, holdingCost = 200, heatLevel = 0 } = options || {};

  // 1. Process Sabotage Actions BEFORE resolving market
  const processedSubmissions = submissions.map(sub => ({ ...sub }));
  const results = players.map(p => {
    const sub = processedSubmissions.find(s => s.playerId === p.id) || { price: 999, quantity: 0, sortPrice: 999 };
    return {
      playerId: p.id,
      playerName: p.name,
      submittedPrice: sub.price,
      submittedQuantity: sub.quantity,
      soldQuantity: 0,
      revenue: 0,
      holdingCost: 0,
      auditTarget: sub.auditTarget,
      sabotageAction: sub.sabotageType,
      sabotageTarget: sub.sabotageTarget,
      inventoryDestroyed: 0,
      raided: false,
      seizedAmount: 0
    };
  });

  // Apply Thugs (destroy 50 inventory)
  for (const sub of processedSubmissions) {
    if (sub.sabotageType === 'Thugs' && sub.sabotageTarget) {
      const targetSub = processedSubmissions.find(s => s.playerId === sub.sabotageTarget);
      const targetRes = results.find(r => r.playerId === sub.sabotageTarget);
      if (targetSub && targetRes) {
        const destroyed = Math.min(50, targetSub.quantity);
        targetSub.quantity -= destroyed;
        targetRes.inventoryDestroyed += destroyed;
      }
    }
  }

  // Set sort prices (Bribe Dockmaster sells first)
  for (const sub of processedSubmissions) {
    sub.sortPrice = sub.sabotageType === 'Bribe' ? -999 : sub.price;
  }

  // 2. Sort submissions by sortPrice ascending
  const sortedSubmissions = [...processedSubmissions].sort((a, b) => a.sortPrice - b.sortPrice);
  
  let remainingDemand = totalDemand;
  let marketCrashed = false;

  // Check for price crash (multiple dumping at cost e.g. <= 15)
  const lowPriced = processedSubmissions.filter(s => s.price <= 15);
  if (lowPriced.length >= 2) {
    marketCrashed = true;
  }

  // 3. Allocate demand lowest price first
  const priceGroups = new Map();
  for (const sub of sortedSubmissions) {
    if (!priceGroups.has(sub.sortPrice)) {
      priceGroups.set(sub.sortPrice, []);
    }
    priceGroups.get(sub.sortPrice).push(sub);
  }

  const uniquePrices = Array.from(priceGroups.keys()).sort((a, b) => a - b);
  let highestClearedPrice = 0;
  let totalRevenue = 0;
  let totalSold = 0;

  for (const sortPrice of uniquePrices) {
    if (remainingDemand <= 0) break;

    const group = priceGroups.get(sortPrice);
    const totalOffered = group.reduce((sum, s) => sum + s.quantity, 0);

    if (totalOffered <= remainingDemand) {
      for (const sub of group) {
        const res = results.find(r => r.playerId === sub.playerId);
        res.soldQuantity = sub.quantity;
        res.revenue = res.soldQuantity * sub.price;
        remainingDemand -= sub.quantity;
        if (res.soldQuantity > 0) highestClearedPrice = Math.max(highestClearedPrice, sub.price);
        totalRevenue += res.revenue;
        totalSold += res.soldQuantity;
      }
    } else {
      let groupRemainingDemand = remainingDemand;
      let activeGroup = [...group];
      
      while (groupRemainingDemand > 0 && activeGroup.length > 0) {
        const fairShare = Math.floor(groupRemainingDemand / activeGroup.length);
        if (fairShare === 0) {
            for(let i=0; i<groupRemainingDemand; i++) {
                if(i < activeGroup.length) {
                    const res = results.find(r => r.playerId === activeGroup[i].playerId);
                    res.soldQuantity += 1;
                    res.revenue = res.soldQuantity * activeGroup[i].price;
                    if (res.soldQuantity > 0) highestClearedPrice = Math.max(highestClearedPrice, activeGroup[i].price);
                    totalRevenue += activeGroup[i].price;
                    totalSold += 1;
                }
            }
            groupRemainingDemand = 0;
            break;
        }

        let newActiveGroup = [];
        for (const sub of activeGroup) {
          const res = results.find(r => r.playerId === sub.playerId);
          const remainingOffer = sub.quantity - res.soldQuantity;
          
          if (remainingOffer <= fairShare) {
            res.soldQuantity += remainingOffer;
            groupRemainingDemand -= remainingOffer;
          } else {
            res.soldQuantity += fairShare;
            groupRemainingDemand -= fairShare;
            newActiveGroup.push(sub);
          }
          res.revenue = res.soldQuantity * sub.price;
          if (res.soldQuantity > 0) highestClearedPrice = Math.max(highestClearedPrice, sub.price);
        }
        totalRevenue += (fairShare * activeGroup.length * group[0].price); // roughly
        totalSold += (fairShare * activeGroup.length);
        activeGroup = newActiveGroup;
      }
      remainingDemand = 0; // Filled
    }
  }

  // 4. Calculate holding costs for unsold inventory
  for (const res of results) {
    const player = players.find(p => p.id === res.playerId);
    // inventory remaining after sabotage destruction and sales
    const unsold = player.inventory - res.inventoryDestroyed - res.soldQuantity;
    if (unsold > 0) {
      res.holdingCost = holdingCost;
    }
  }
  
  // 5. Heat Meter & Police Raids
  let policeRaid = false;
  let newHeatLevel = heatLevel;
  
  // Calculate average clearing price
  const avgPrice = totalSold > 0 ? totalRevenue / totalSold : 0;
  if (avgPrice >= 60) {
    newHeatLevel += 30;
  } else if (avgPrice < 40) {
    newHeatLevel = Math.max(0, newHeatLevel - 15);
  }

  if (newHeatLevel >= 100) {
    policeRaid = true;
    newHeatLevel = 0; // reset after raid
    // Raid hits anyone who sold at the highest cleared price
    for (const res of results) {
      if (res.soldQuantity > 0 && res.submittedPrice === highestClearedPrice) {
        const player = players.find(p => p.id === res.playerId);
        const totalCash = player.balance + res.revenue;
        res.raided = true;
        res.seizedAmount = Math.floor(totalCash * 0.5);
      }
    }
  }
  
  // 6. Resolve Audits (informants)
  for (const res of results) {
     if (res.auditTarget) {
         const targetRes = results.find(r => r.playerId === res.auditTarget);
         if (targetRes) {
             res.auditedPrice = targetRes.submittedPrice;
             res.auditedQuantity = targetRes.submittedQuantity;
         }
     }
  }

  // 7. Market Crash Penalty — hits EVERYONE who sold, including Bribe users
  // No one escapes a collapsed market. 50% of each seller's revenue is wiped.
  if (marketCrashed) {
    for (const res of results) {
      if (res.soldQuantity > 0) {
        const lost = Math.floor(res.revenue * 0.5);
        res.revenue = res.revenue - lost;
        res.crashLoss = lost; // track for UI display
      }
    }
  }

  return {
    marketCrashed,
    policeRaid,
    newHeatLevel,
    totalDemand,
    totalSold,
    playerResults: results
  };
}
